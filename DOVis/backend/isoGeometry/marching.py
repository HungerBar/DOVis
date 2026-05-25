import numpy as np
from skimage import measure
from pyproj import Transformer
from backend.core.dataset import get_ds

to_ecef = Transformer.from_crs(
    "EPSG:4979",
    "EPSG:4978",
    always_xy=True,
)


def run_marching_cubes(time_idx: int, iso_value: float, verbose=True):
    ds = get_ds()

    vol = ds["o2_pred"].isel(time=time_idx).values  # (D, lat, lon)
    depth = ds.depth.values
    lat = ds.lat.values
    lon = ds.lon.values

    # =========================================================
    # 1. NaN 处理
    # =========================================================
    nan_count = np.isnan(vol).sum()
    if nan_count > 0:
        if verbose:
            print(f"[NaN] detected: {nan_count}")

        fill_val = np.nanmin(vol) - 1.0
        vol = np.nan_to_num(vol, nan=fill_val)

    # =========================================================
    # 2. Marching Cubes（index space）
    # =========================================================
    verts, faces, _, _ = measure.marching_cubes(
        vol, level=iso_value, spacing=(1.0, 1.0, 1.0)
    )

    # =========================================================
    # 3. index -> grid coordinate
    # =========================================================
    vd = np.clip(verts[:, 0], 0, len(depth) - 1)
    vh = np.clip(verts[:, 1], 0, len(lat) - 1)
    vw = np.clip(verts[:, 2], 0, len(lon) - 1)

    d0 = np.floor(vd).astype(int)
    h0 = np.floor(vh).astype(int)
    w0 = np.floor(vw).astype(int)

    d1 = np.clip(d0 + 1, 0, len(depth) - 1)
    h1 = np.clip(h0 + 1, 0, len(lat) - 1)
    w1 = np.clip(w0 + 1, 0, len(lon) - 1)

    td = vd - d0
    th = vh - h0
    tw = vw - w0

    # =========================================================
    # 4. 三线性插值（物理坐标）
    # =========================================================
    def interp(arr):
        return (
            arr[d0, h0, w0] * (1 - td) * (1 - th) * (1 - tw)
            + arr[d1, h0, w0] * td * (1 - th) * (1 - tw)
            + arr[d0, h1, w0] * (1 - td) * th * (1 - tw)
            + arr[d0, h0, w1] * (1 - td) * (1 - th) * tw
            + arr[d1, h1, w0] * td * th * (1 - tw)
            + arr[d1, h0, w1] * td * (1 - th) * tw
            + arr[d0, h1, w1] * (1 - td) * th * tw
            + arr[d1, h1, w1] * td * th * tw
        )

    lon_v = interp(lon[None, None, :].repeat(len(depth), 0).repeat(len(lat), 1))
    lat_v = interp(lat[None, :, None].repeat(len(depth), 0).repeat(len(lon), 2))
    depth_v = interp(depth[:, None, None].repeat(len(lat), 1).repeat(len(lon), 2))

    # =========================================================
    # 5. 构建局部 ENU 坐标（关键替换）
    # =========================================================

    # reference origin（局部原点）
    lon0 = float(np.mean(lon_v))
    lat0 = float(np.mean(lat_v))
    h0 = 0.0

    # origin in ECEF
    x0, y0, z0 = to_ecef.transform(lon0, lat0, h0)

    # vertices in ECEF
    height_v = -depth_v  # 海洋：深度转高度
    x, y, z = to_ecef.transform(lon_v, lat_v, height_v)

    dx = x - x0
    dy = y - y0
    dz = z - z0

    # ECEF → ENU rotation matrix
    lon_r = np.deg2rad(lon0)
    lat_r = np.deg2rad(lat0)

    slon = np.sin(lon_r)
    clon = np.cos(lon_r)
    slat = np.sin(lat_r)
    clat = np.cos(lat_r)

    R = np.array(
        [
            [-slon, clon, 0],
            [-slat * clon, -slat * slon, clat],
            [clat * clon, clat * slon, slat],
        ]
    )

    verts_enu = np.vstack([R @ np.array([dx, dy, dz])]).T

    # =========================================================
    # 6. sanity check
    # =========================================================
    if not np.all(np.isfinite(verts_enu)):
        bad = np.sum(~np.isfinite(verts_enu))
        raise ValueError(f"Invalid ENU vertices: {bad}")

    if verbose:
        print("\n[RESULT]")
        print("verts:", len(verts_enu))
        print("faces:", len(faces))
        print("nan filled:", nan_count)
        print("origin:", (lon0, lat0))

    return verts_enu, faces, {"lon0": 80, "lat0": -10, "height0": 0}
