import numpy as np
from backend.core.dataset import get_ds


def load_oxygen_data(time: str):
    """Load oxygen data for a given time index or coordinate.

    The backend dataset stores dissolved oxygen predictions in `o2_pred`.
    Expected output is a 3D numpy array with shape (depth, lat, lon).
    """

    ds = get_ds()

    if "o2_pred" not in ds:
        raise KeyError("Dataset does not contain required variable 'o2_pred'.")

    oxygen = ds["o2_pred"]

    if "time" not in oxygen.dims:
        raise ValueError("Variable 'o2_pred' must include a 'time' dimension.")

    # Support time selection by coordinate or integer index
    try:
        data = oxygen.sel(time=time)
    except Exception:
        try:
            data = oxygen.isel(time=int(time))
        except Exception as exc:
            raise ValueError(
                f"Cannot select oxygen data for time={time}. "
                "Use a valid time coordinate or integer time index."
            ) from exc

    return np.asarray(data, dtype=np.float32)
