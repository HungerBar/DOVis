import threading
from collections.abc import Mapping

import numpy as np

from backend.core.database import (
    DATASET_ID,
    VARIABLE_NAME,
    connect_db,
    ensure_database,
    load_coordinate,
    load_time_slice,
)

_ds = None
_lock = threading.Lock()

DATASETS = {
    DATASET_ID: "sqlite",
}


class _Coord:
    def __init__(self, values):
        self.values = np.asarray(values)

    def __len__(self):
        return len(self.values)


class _DataVars(Mapping):
    def __init__(self, dataset):
        self._dataset = dataset

    def __getitem__(self, key):
        if key != VARIABLE_NAME:
            raise KeyError(key)
        return self._dataset[key]

    def __iter__(self):
        yield VARIABLE_NAME

    def __len__(self):
        return 1

    def keys(self):
        return [VARIABLE_NAME]


def _normalize_indices(selection, length):
    if isinstance(selection, slice):
        return list(range(length))[selection]
    if isinstance(selection, (list, tuple, np.ndarray)):
        return [int(v) for v in selection]
    return int(selection)


def _nearest_index(values, target):
    arr = np.asarray(values, dtype=np.float64)
    return int(np.abs(arr - float(target)).argmin())


class SQLiteDataArray:
    def __init__(
        self,
        dataset,
        name,
        dims,
        selections=None,
        order=None,
        static_values=None,
    ):
        self._dataset = dataset
        self.name = name
        self._base_dims = tuple(dims)
        self._selections = dict(selections or {})
        self._order = tuple(order or self._visible_dims())
        self._static_values = static_values

    @property
    def dims(self):
        return self._order

    @property
    def coords(self):
        return {
            dim: _Coord(self._selected_coord(dim))
            for dim in self.dims
            if dim in self._dataset.coords
        }

    @property
    def shape(self):
        return tuple(len(np.atleast_1d(self._selected_coord(dim))) for dim in self.dims)

    @property
    def values(self):
        if self._static_values is not None:
            return np.asarray(self._static_values)

        arr = self._load_base_values()
        visible_dims = self._visible_dims()
        if self._order != visible_dims:
            axes = [visible_dims.index(dim) for dim in self._order]
            arr = np.transpose(arr, axes)
        return arr

    def tolist(self):
        return self.values.tolist()

    def isel(self, **kwargs):
        selections = dict(self._selections)
        for dim, value in kwargs.items():
            if dim not in self._base_dims:
                continue
            length = self._dataset.sizes[dim]
            selections[dim] = _normalize_indices(value, length)
        return SQLiteDataArray(
            self._dataset,
            self.name,
            self._base_dims,
            selections=selections,
            order=[dim for dim in self._order if not isinstance(selections.get(dim), int)],
            static_values=self._static_values,
        )

    def sel(self, **kwargs):
        method = kwargs.pop("method", None)
        indexers = {}
        for dim, value in kwargs.items():
            if dim not in self._dataset.coords:
                raise KeyError(dim)
            coord = self._dataset.coords[dim]
            if method == "nearest":
                indexers[dim] = _nearest_index(coord, value)
            else:
                matches = np.where(coord == value)[0]
                if len(matches) == 0:
                    try:
                        numeric_value = float(value)
                    except (TypeError, ValueError):
                        raise KeyError(value) from None
                    matches = np.where(coord == numeric_value)[0]
                if len(matches) == 0:
                    raise KeyError(value)
                indexers[dim] = int(matches[0])
        return self.isel(**indexers)

    def transpose(self, *dims):
        if not dims:
            dims = tuple(reversed(self.dims))
        return SQLiteDataArray(
            self._dataset,
            self.name,
            self._base_dims,
            selections=self._selections,
            order=dims,
            static_values=self._static_values,
        )

    def __array__(self, dtype=None):
        arr = self.values
        if dtype is not None:
            return arr.astype(dtype)
        return arr

    def _visible_dims(self):
        return tuple(
            dim
            for dim in self._base_dims
            if not isinstance(self._selections.get(dim), int)
        )

    def _selected_coord(self, dim):
        coord = self._dataset.coords[dim]
        selection = self._selections.get(dim, slice(None))
        if isinstance(selection, int):
            return np.asarray(coord)[selection]
        return np.asarray(coord)[selection]

    def _load_base_values(self):
        if self.name != VARIABLE_NAME:
            raise KeyError(self.name)

        time_selection = self._selections.get("time", slice(None))
        time_indices = _normalize_indices(time_selection, self._dataset.sizes["time"])

        if isinstance(time_indices, int):
            arr = self._dataset.load_o2_time_slice(time_indices)
            source_dims = ("depth", "lat", "lon")
        else:
            slices = [self._dataset.load_o2_time_slice(i) for i in time_indices]
            arr = np.stack(slices, axis=0)
            source_dims = ("time", "depth", "lat", "lon")

        indexers = []
        for dim in source_dims:
            if dim == "time":
                indexers.append(slice(None))
                continue
            indexers.append(self._selections.get(dim, slice(None)))

        arr = arr[tuple(indexers)]
        return np.asarray(arr)


class SQLiteDataset:
    def __init__(self):
        self.db_path = ensure_database()
        self._conn = connect_db(self.db_path)
        self.coords = {
            "time": load_coordinate(self._conn, "time"),
            "depth": load_coordinate(self._conn, "depth"),
            "lat": load_coordinate(self._conn, "lat"),
            "lon": load_coordinate(self._conn, "lon"),
        }
        self.sizes = {name: len(values) for name, values in self.coords.items()}
        self.dims = self.sizes
        self.data_vars = _DataVars(self)

    def __contains__(self, key):
        return key == VARIABLE_NAME or key in self.coords

    def __getitem__(self, key):
        if key == VARIABLE_NAME:
            return SQLiteDataArray(
                self,
                VARIABLE_NAME,
                ("time", "depth", "lat", "lon"),
            )
        if key in self.coords:
            return SQLiteDataArray(
                self,
                key,
                (key,),
                static_values=self.coords[key],
            )
        raise KeyError(key)

    def __getattr__(self, key):
        if key in self.coords:
            return self[key]
        raise AttributeError(key)

    def isel(self, **kwargs):
        return SQLiteDatasetView(self, selections=kwargs)

    def load_o2_time_slice(self, time_index: int):
        return load_time_slice(self._conn, VARIABLE_NAME, time_index)

    def close(self):
        self._conn.close()


class SQLiteDatasetView:
    def __init__(self, dataset, selections=None):
        self._dataset = dataset
        self._selections = dict(selections or {})
        self.coords = dataset.coords
        self.sizes = dict(dataset.sizes)
        self.dims = self.sizes
        self.data_vars = _DataVars(self)

    def __contains__(self, key):
        return key in self._dataset

    def __getitem__(self, key):
        arr = self._dataset[key]
        if isinstance(arr, SQLiteDataArray):
            return arr.isel(**self._selections)
        return arr

    def __getattr__(self, key):
        if key in self.coords:
            return self[key]
        raise AttributeError(key)

    def isel(self, **kwargs):
        selections = dict(self._selections)
        selections.update(kwargs)
        return SQLiteDatasetView(self._dataset, selections=selections)


def _reset_cache():
    global _ds
    if _ds is not None:
        _ds.close()
    _ds = None


def get_ds():
    global _ds

    with _lock:
        if _ds is None:
            _ds = SQLiteDataset()
        return _ds


def get_ds_by_id(dataset_id: str):
    if dataset_id not in DATASETS:
        raise ValueError(f"[Dataset] Unknown dataset_id: {dataset_id}")
    return get_ds()
