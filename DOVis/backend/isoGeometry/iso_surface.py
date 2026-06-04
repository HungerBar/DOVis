import numpy as np
import xarray as xr
import os


# =========================================================
# 1. 主函数：计算 iso depth field
# =========================================================
def compute_iso_depth_field(ds_t, iso_value, var_name="o2_pred", depth_name="depth"):
    """
    Compute iso-surface depth field.

    Parameters
    ----------
    ds_t : xarray.Dataset
        Time-sliced dataset (ds.isel(time=t))
    iso_value : float
        Target isovalue
    var_name : str
        Variable name in dataset (default: "o2")
    depth_name : str
        Depth coordinate name (default: "depth")

    Returns
    -------
    np.ndarray
        2D array (lat, lon) with depth or NaN
    """

    field = ds_t[var_name].values  # (depth, lat, lon)
    depth = ds_t[depth_name].values  # (depth,)

    nz, ny, nx = field.shape

    result = np.full((ny, nx), np.nan, dtype=np.float32)

    for j in range(ny):
        for i in range(nx):

            profile = field[:, j, i]

            if np.all(np.isnan(profile)):
                continue

            for k in range(nz - 1):

                v1 = profile[k]
                v2 = profile[k + 1]

                if np.isnan(v1) or np.isnan(v2):
                    continue

                # detect crossing
                if (v1 - iso_value) * (v2 - iso_value) <= 0 and v1 != v2:

                    z1 = depth[k]
                    z2 = depth[k + 1]

                    # linear interpolation
                    denom = v2 - v1
                    if abs(denom) < 1e-12:
                        continue

                    t = (iso_value - v1) / denom
                    z = z1 + t * (z2 - z1)

                    result[j, i] = z
                    break

    return result


# =========================================================
# 2. 导出 NetCDF
# =========================================================
def export_iso_depth_nc(z_field, ds_t, output_path=None, name="iso_depth"):
    """
    Export iso-depth field to NetCDF.

    Parameters
    ----------
    z_field : np.ndarray
        2D (lat, lon) iso depth field
    ds_t : xarray.Dataset
        Reference dataset (for coordinates)
    output_path : str
        Output file path
    name : str
        Variable name

    Returns
    -------
    str
        file path
    """

    lat = ds_t["lat"].values
    lon = ds_t["lon"].values

    da = xr.DataArray(
        z_field,
        dims=("lat", "lon"),
        coords={"lat": lat, "lon": lon},
        name=name,
    )

    out_ds = xr.Dataset({name: da})

    if output_path is None:
        os.makedirs("tiles", exist_ok=True)
        output_path = "tiles/iso_depth.nc"

    out_ds.to_netcdf(output_path)

    return output_path


# =========================================================
# 3. 一步封装（API 推荐直接调用）
# =========================================================
def build_iso_surface_product(
    ds_t, iso_value, var_name="o2_pred", depth_name="depth", output_path=None
):
    """
    Full pipeline:
    ds -> iso depth field -> NetCDF
    """

    z_field = compute_iso_depth_field(
        ds_t, iso_value, var_name=var_name, depth_name=depth_name
    )

    path = export_iso_depth_nc(z_field, ds_t, output_path=output_path)

    return path
