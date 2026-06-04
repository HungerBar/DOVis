import numpy as np
from backend.core.dataset import get_ds


def get_volume(time_idx: int):

    ds = get_ds()

    arr = ds["o2_pred"].isel(time=time_idx).values
    return np.ascontiguousarray(arr, dtype=np.float32)
