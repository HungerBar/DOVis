import tempfile


def export_nc(dataset):
    tmp = tempfile.NamedTemporaryFile(suffix=".nc", delete=False)
    tmp_path = tmp.name
    tmp.close()

    dataset.to_netcdf(tmp_path)

    return tmp_path
