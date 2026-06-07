from backend.core.dataset import get_ds

def get_times():

    ds = get_ds()

    return [str(t) for t in ds.time.values]
