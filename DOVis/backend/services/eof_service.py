import numpy as np
from backend.core.dataset import get_ds_by_id


# =========================================================
# EOF核心计算
# =========================================================
def _eof(X, mode_num):

    # =====================================================
    # 1. 转 float64
    # =====================================================
    X = X.astype(np.float64)

    # =====================================================
    # 2. 清除 NaN / inf
    # =====================================================
    X = np.nan_to_num(
        X,
        nan=0.0,
        posinf=0.0,
        neginf=0.0
    )

    # =====================================================
    # 3. anomaly
    # EOF分析的应该是异常场
    # =====================================================
    X = X - np.mean(X, axis=0)

    # =====================================================
    # 4. debug信息
    # =====================================================
    print("========== EOF DEBUG ==========")
    print("X shape:", X.shape)
    print("NaN count:", np.isnan(X).sum())
    print("Inf count:", np.isinf(X).sum())
    print("Max:", np.max(X))
    print("Min:", np.min(X))
    print("================================")

    # =====================================================
    # 5. 防止空矩阵
    # =====================================================
    if X.shape[0] == 0 or X.shape[1] == 0:
        raise ValueError("EOF matrix is empty")

    # =====================================================
    # 6. mode_num安全限制
    # =====================================================
    max_modes = min(X.shape)

    if mode_num > max_modes:
        mode_num = max_modes

    # =====================================================
    # 7. SVD
    # =====================================================
    U, S, Vt = np.linalg.svd(X, full_matrices=False)

    # =====================================================
    # 8. PCs
    # =====================================================
    pcs = U[:, :mode_num] * S[:mode_num]

    # =====================================================
    # 9. EOF modes
    # =====================================================
    modes = Vt[:mode_num, :]

    # =====================================================
    # 10. variance contribution
    # =====================================================
    variance = (S ** 2) / np.sum(S ** 2)

    return modes, pcs, variance


# =========================================================
# 主服务
# =========================================================
def run_eof_service(
    dataset_id,
    variable,
    time_range,
    mode_type,
    mode_num,
    slice_params,
):

    # =====================================================
    # 1. 动态加载数据
    # =====================================================
    ds = get_ds_by_id(dataset_id)

    if variable not in ds.data_vars:
        raise ValueError(f"Variable not found: {variable}")

    data = ds[variable]

    # =====================================================
    # 2. 时间切片
    # =====================================================
    t0, t1 = time_range

    data = data.isel(time=slice(t0, t1))

    print("After time slice:", data.shape)

    # =====================================================
    # 3. 空间处理
    # =====================================================
    if mode_type == "horizontal":

        depth = slice_params.get("depth", None)

        if depth is not None and "depth" in data.dims:
            data = data.sel(depth=depth, method="nearest")

        print("Horizontal slice shape:", data.shape)

        # shape:
        # (time, lat, lon)
        X = data.values.reshape(data.shape[0], -1)

        grid_shape = data.shape[1:]

    elif mode_type == "section":

        dim = slice_params["type"]
        value = slice_params["value"]

        # -------------------------------------------------
        # 纬向剖面
        # -------------------------------------------------
        if dim == "lat":

            data = data.sel(lat=value, method="nearest")

            print("Lat section shape:", data.shape)

            # shape:
            # (time, depth, lon)
            X = data.values.reshape(data.shape[0], -1)

            grid_shape = data.shape[1:]

        # -------------------------------------------------
        # 经向剖面
        # -------------------------------------------------
        elif dim == "lon":

            data = data.sel(lon=value, method="nearest")

            print("Lon section shape:", data.shape)

            # shape:
            # (time, depth, lat)
            X = data.values.reshape(data.shape[0], -1)

            grid_shape = data.shape[1:]

        else:
            raise ValueError("invalid section type")

    else:
        raise ValueError("invalid mode_type")

    # =====================================================
    # 4. EOF计算
    # =====================================================
    modes, pcs, variance = _eof(X, mode_num)

    # =====================================================
    # 5. reshape EOF mode
    # =====================================================
    modes_out = []

    for i in range(mode_num):

        field = modes[i].reshape(grid_shape)

        modes_out.append(
            {
                "mode": i + 1,
                "field": field.tolist(),
                "variance": float(variance[i]),
            }
        )

    # =====================================================
    # 6. 返回
    # =====================================================
    return {
        "dataset_id": dataset_id,
        "variable": variable,
        "mode_type": mode_type,
        "mode_num": mode_num,
        "modes": modes_out,
        "pcs": pcs.tolist(),
        "grid_shape": list(grid_shape),
    }