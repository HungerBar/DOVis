import json
import sqlite3
import threading
import zlib
from pathlib import Path

import numpy as np

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
SOURCE_NC_PATH = DATA_DIR / "do_predict.nc"
DB_PATH = DATA_DIR / "do_predict.sqlite"
DATASET_ID = "do_predict"
VARIABLE_NAME = "o2_pred"
SCHEMA_VERSION = 1

_import_lock = threading.Lock()


def connect_db(path: Path = DB_PATH) -> sqlite3.Connection:
    conn = sqlite3.connect(path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.execute("PRAGMA temp_store=MEMORY")
    return conn


def _source_signature(path: Path = SOURCE_NC_PATH) -> dict:
    stat = path.stat()
    return {
        "path": str(path),
        "mtime_ns": stat.st_mtime_ns,
        "size": stat.st_size,
    }


def _create_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS metadata (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS coordinates (
            dataset_id TEXT NOT NULL,
            name TEXT NOT NULL,
            dims_json TEXT NOT NULL,
            dtype TEXT NOT NULL,
            shape_json TEXT NOT NULL,
            data BLOB NOT NULL,
            PRIMARY KEY (dataset_id, name)
        );

        CREATE TABLE IF NOT EXISTS variables (
            dataset_id TEXT NOT NULL,
            name TEXT NOT NULL,
            dims_json TEXT NOT NULL,
            dtype TEXT NOT NULL,
            shape_json TEXT NOT NULL,
            compression TEXT NOT NULL,
            PRIMARY KEY (dataset_id, name)
        );

        CREATE TABLE IF NOT EXISTS variable_time_slices (
            dataset_id TEXT NOT NULL,
            variable_name TEXT NOT NULL,
            time_index INTEGER NOT NULL,
            shape_json TEXT NOT NULL,
            dtype TEXT NOT NULL,
            data BLOB NOT NULL,
            PRIMARY KEY (dataset_id, variable_name, time_index)
        );

        CREATE INDEX IF NOT EXISTS idx_variable_time_slices_lookup
            ON variable_time_slices(dataset_id, variable_name, time_index);
        """
    )


def _set_metadata(conn: sqlite3.Connection, key: str, value) -> None:
    conn.execute(
        "INSERT OR REPLACE INTO metadata(key, value) VALUES (?, ?)",
        (key, json.dumps(value)),
    )


def _get_metadata(conn: sqlite3.Connection, key: str):
    row = conn.execute("SELECT value FROM metadata WHERE key = ?", (key,)).fetchone()
    if row is None:
        return None
    return json.loads(row["value"])


def database_is_current(
    db_path: Path = DB_PATH,
    source_path: Path = SOURCE_NC_PATH,
) -> bool:
    if not db_path.exists() or not source_path.exists():
        return False

    try:
        with connect_db(db_path) as conn:
            if _get_metadata(conn, "schema_version") != SCHEMA_VERSION:
                return False
            if _get_metadata(conn, "source_signature") != _source_signature(source_path):
                return False
            row = conn.execute(
                """
                SELECT COUNT(*) AS count
                FROM variable_time_slices
                WHERE dataset_id = ? AND variable_name = ?
                """,
                (DATASET_ID, VARIABLE_NAME),
            ).fetchone()
            shape = _get_metadata(conn, "variable_shape")
            return bool(shape and row["count"] == shape[0])
    except sqlite3.Error:
        return False


def ensure_database() -> Path:
    if database_is_current():
        return DB_PATH

    with _import_lock:
        if database_is_current():
            return DB_PATH
        import_netcdf_to_sqlite()
        return DB_PATH


def import_netcdf_to_sqlite(
    source_path: Path = SOURCE_NC_PATH,
    db_path: Path = DB_PATH,
) -> None:
    if not source_path.exists():
        raise FileNotFoundError(f"[Database] source NetCDF not found: {source_path}")

    import xarray as xr

    tmp_path = db_path.with_suffix(".sqlite.tmp")
    if tmp_path.exists():
        tmp_path.unlink()

    ds = xr.open_dataset(source_path, decode_times=False)
    try:
        if VARIABLE_NAME not in ds:
            raise KeyError(f"[Database] missing variable: {VARIABLE_NAME}")

        tmp_path.parent.mkdir(parents=True, exist_ok=True)
        conn = connect_db(tmp_path)
        try:
            _create_schema(conn)
            _set_metadata(conn, "schema_version", SCHEMA_VERSION)
            _set_metadata(conn, "dataset_id", DATASET_ID)
            _set_metadata(conn, "source_signature", _source_signature(source_path))
            _set_metadata(conn, "variable_shape", list(ds[VARIABLE_NAME].shape))
            _set_metadata(conn, "sizes", dict(ds.sizes))

            for name in ("time", "depth", "lat", "lon"):
                arr = np.asarray(ds[name].values)
                conn.execute(
                    """
                    INSERT INTO coordinates
                    (dataset_id, name, dims_json, dtype, shape_json, data)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (
                        DATASET_ID,
                        name,
                        json.dumps((name,)),
                        str(arr.dtype),
                        json.dumps(arr.shape),
                        sqlite3.Binary(np.ascontiguousarray(arr).tobytes()),
                    ),
                )

            if "depth_bnds" in ds:
                arr = np.asarray(ds["depth_bnds"].values)
                conn.execute(
                    """
                    INSERT INTO coordinates
                    (dataset_id, name, dims_json, dtype, shape_json, data)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (
                        DATASET_ID,
                        "depth_bnds",
                        json.dumps(ds["depth_bnds"].dims),
                        str(arr.dtype),
                        json.dumps(arr.shape),
                        sqlite3.Binary(np.ascontiguousarray(arr).tobytes()),
                    ),
                )

            variable = ds[VARIABLE_NAME]
            conn.execute(
                """
                INSERT INTO variables
                (dataset_id, name, dims_json, dtype, shape_json, compression)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    DATASET_ID,
                    VARIABLE_NAME,
                    json.dumps(variable.dims),
                    str(variable.dtype),
                    json.dumps(variable.shape),
                    "zlib",
                ),
            )

            for time_index in range(ds.sizes["time"]):
                arr = np.asarray(
                    variable.isel(time=time_index).values,
                    dtype=np.float32,
                )
                payload = zlib.compress(np.ascontiguousarray(arr).tobytes(), level=4)
                conn.execute(
                    """
                    INSERT INTO variable_time_slices
                    (dataset_id, variable_name, time_index, shape_json, dtype, data)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (
                        DATASET_ID,
                        VARIABLE_NAME,
                        time_index,
                        json.dumps(arr.shape),
                        str(arr.dtype),
                        sqlite3.Binary(payload),
                    ),
                )
                if time_index % 12 == 0:
                    conn.commit()
                    print(
                        f"[Database] imported {time_index + 1}/{ds.sizes['time']} time slices",
                        flush=True,
                    )

            conn.commit()
        finally:
            conn.close()
    finally:
        ds.close()

    tmp_path.replace(db_path)


def load_coordinate(conn: sqlite3.Connection, name: str) -> np.ndarray:
    row = conn.execute(
        """
        SELECT dtype, shape_json, data
        FROM coordinates
        WHERE dataset_id = ? AND name = ?
        """,
        (DATASET_ID, name),
    ).fetchone()
    if row is None:
        raise KeyError(f"[Database] coordinate not found: {name}")

    arr = np.frombuffer(row["data"], dtype=np.dtype(row["dtype"]))
    return arr.reshape(tuple(json.loads(row["shape_json"]))).copy()


def load_time_slice(
    conn: sqlite3.Connection,
    variable_name: str,
    time_index: int,
) -> np.ndarray:
    row = conn.execute(
        """
        SELECT dtype, shape_json, data
        FROM variable_time_slices
        WHERE dataset_id = ? AND variable_name = ? AND time_index = ?
        """,
        (DATASET_ID, variable_name, int(time_index)),
    ).fetchone()
    if row is None:
        raise IndexError(f"[Database] time_index out of range: {time_index}")

    raw = zlib.decompress(row["data"])
    arr = np.frombuffer(raw, dtype=np.dtype(row["dtype"]))
    return arr.reshape(tuple(json.loads(row["shape_json"]))).copy()
