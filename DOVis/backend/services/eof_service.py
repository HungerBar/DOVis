import numpy as np
from eofs.standard import Eof
from backend.core.dataset import get_ds_by_id


def run_eof_service(
    dataset_id: str,
    variable: str,
    time_range: list[int],
    mode_type: str,
    mode_num: int,
    slice_params: dict,
):

    print("\n" + "=" * 50, flush=True)
    print(f"EOF SERVICE START | dataset={dataset_id}, var={variable}", flush=True)
    print("=" * 50 + "\n", flush=True)

    # =====================================================
    # 1. LOAD DATA
    # =====================================================
    ds = get_ds_by_id(dataset_id)

    if variable not in ds.data_vars:
        raise ValueError(f"Variable not found: {variable}")

    data = ds[variable]

    # =====================================================
    # 2. TIME SLICE (修正未来的隐藏崩盘点：将 .dims 改为 .sizes)
    # =====================================================
    t0, t1 = time_range
    t0 = max(0, t0)
    t1 = min(t1, ds.sizes["time"] - 1)  # 🛠️ 修复兼容性：ds.dims -> ds.sizes

    data = data.isel(time=slice(t0, t1 + 1))
    T = data.shape[0]

    coords = {}

    # =====================================================
    # 3. SPACE PREPROCESS
    # =====================================================
    if mode_type == "horizontal":
        depth_val = slice_params.get("depth", None)
        if "depth" in data.dims and depth_val is not None:
            data = data.sel(depth=depth_val, method="nearest")

        data = data.transpose("time", "lat", "lon")
        coords = {
            "lat": data.coords["lat"].values.tolist(),
            "lon": data.coords["lon"].values.tolist(),
        }
        grid_shape = (len(coords["lat"]), len(coords["lon"]))

    elif mode_type == "section":
        dim = slice_params.get("type", "lat")
        value = slice_params.get("value", 0)

        if dim == "lat":
            data = data.sel(lat=value, method="nearest")
            data = data.transpose("time", "depth", "lon")
            coords = {
                "depth": data.coords["depth"].values.tolist(),
                "lon": data.coords["lon"].values.tolist(),
            }
            grid_shape = (len(coords["depth"]), len(coords["lon"]))

        elif dim == "lon":
            data = data.sel(lon=value, method="nearest")
            data = data.transpose("time", "depth", "lat")
            coords = {
                "depth": data.coords["depth"].values.tolist(),
                "lat": data.coords["lat"].values.tolist(),
            }
            grid_shape = (len(coords["depth"]), len(coords["lat"]))
        else:
            raise ValueError("Invalid section type")
    else:
        raise ValueError("Invalid mode_type")

    # =====================================================
    # 3.5 ⭐ 健壮的时间标签提取逻辑 (彻底解决 .dt 崩溃)
    # =====================================================
    time_labels = []
    try:
        if "time" in data.coords:
            time_vals = data.coords["time"].values

            # 情况 A: 标准的 numpy datetime64 类型
            if np.issubdtype(time_vals.dtype, np.datetime64):
                import pandas as pd

                time_labels = pd.to_datetime(time_vals).strftime("%Y-%m").tolist()

            # 情况 B: object 类型 (常见于 cftime 气候时间天历对象，或纯 datetime 目标)
            elif time_vals.dtype == object:
                try:
                    time_labels = [t.strftime("%Y-%m") for t in time_vals]
                except AttributeError:
                    time_labels = [str(t) for t in time_vals]

            # 情况 C: 纯数字索引轴或其他未知格式
            else:
                time_labels = [str(t) for t in time_vals]
        else:
            time_labels = [f"Step_{i}" for i in range(T)]
    except Exception as e:
        print(f"Time axis formatting fallback: {e}", flush=True)
        time_labels = [f"Step_{i}" for i in range(T)]

    coords["time_labels"] = time_labels

    # =====================================================
    # 4. EOF INPUT PREPARATION
    # =====================================================
    X = data.values
    X = np.ma.masked_invalid(X)  # 完美过滤陆地和无效栅格
    solver = Eof(X)

    # =====================================================
    # 5. SOLVE EOF
    # =====================================================
    modes = solver.eofs(neofs=mode_num)
    pcs = solver.pcs(npcs=mode_num)
    variance = solver.varianceFraction()[:mode_num]

    # =====================================================
    # 6. FORMAT OUTPUT
    # =====================================================
    modes_out = []
    for i in range(mode_num):
        field = modes[i].reshape(grid_shape)
        valid = np.ma.compressed(np.ma.masked_invalid(field))
        if valid.size > 0:
            v_min = float(valid.min())
            v_max = float(valid.max())
        else:
            v_min, v_max = -0.1, 0.1

        modes_out.append(
            {
                "mode": i + 1,
                "field": field.tolist(),  # 掩膜陆地自动转为前端标准的 JSON null
                "variance": float(variance[i]),
                "v_min": v_min,
                "v_max": v_max,
            }
        )

    print("\nEOF DONE SUCCESSFULLY\n", flush=True)

    return {
        "dataset_id": dataset_id,
        "variable": variable,
        "mode_type": mode_type,
        "mode_num": mode_num,
        "modes": modes_out,
        "pcs": pcs.tolist(),
        "grid_shape": list(grid_shape),
        "coords": coords,
    }
