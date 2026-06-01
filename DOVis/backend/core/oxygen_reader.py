import numpy as np


def load_oxygen_data(time: str):

    """
    TODO:
    以后替换成 xarray.open_dataset()
    """

    data = np.random.uniform(
        0,
        8,
        (20, 50, 50)
    )

    return data
