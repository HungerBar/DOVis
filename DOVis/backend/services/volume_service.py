import numpy as np

from core.oxygen_reader import load_oxygen_data


def calculate_volume(time: str):

    do = load_oxygen_data(time)

    threshold = 2.0

    mask = do < threshold

    cell_volume = 1.0

    volume = np.sum(mask) * cell_volume

    return float(volume)
