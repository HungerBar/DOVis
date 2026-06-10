import numpy as np
from backend.core.dataset import get_ds


def _find_nearest(arr, val):
    idx = np.abs(arr - val).argmin()
    return int(idx)


def _find_nearest_ocean(lat_arr, lon_arr, o2, lat, lon, max_radius=5):
    """Find nearest ocean grid point with valid O2 data within max_radius cells."""
    j0 = _find_nearest(lat_arr, lat)
    i0 = _find_nearest(lon_arr, lon)

    if not np.all(np.isnan(o2[:, j0, i0])):
        return j0, i0

    # Search outward in expanding squares
    for r in range(1, max_radius + 1):
        best_dist = float("inf")
        best = None
        for dj in range(-r, r + 1):
            for di in range(-r, r + 1):
                if max(abs(dj), abs(di)) != r:
                    continue
                jj = j0 + dj
                ii = i0 + di
                if jj < 0 or jj >= len(lat_arr) or ii < 0 or ii >= len(lon_arr):
                    continue
                if not np.all(np.isnan(o2[:, jj, ii])):
                    # Euclidean distance in lat/lon space
                    d = (lat_arr[jj] - lat) ** 2 + (lon_arr[ii] - lon) ** 2
                    if d < best_dist:
                        best_dist = d
                        best = (jj, ii)
        if best is not None:
            return best

    return j0, i0


def get_vertical_profile(lat: float, lon: float, time_index: int) -> dict:
    ds = get_ds()
    ds_t = ds.isel(time=time_index)

    lat_arr = ds.lat.values.astype(np.float64)
    lon_arr = ds.lon.values.astype(np.float64)
    depth_arr = ds.depth.values.astype(np.float64)

    o2 = ds_t["o2_pred"].values  # (depth, lat, lon)
    j, i = _find_nearest_ocean(lat_arr, lon_arr, o2, lat, lon)
    profile_vals = o2[:, j, i]

    time_str = str(ds.time.values[time_index])

    return {
        "location": {"lat": float(lat_arr[j]), "lon": float(lon_arr[i])},
        "time": time_str,
        "unit": "mmol/m3",
        "profile": [
            {"depth": round(float(d), 1), "oxygen": round(float(v), 1)}
            for d, v in zip(depth_arr, profile_vals)
            if not np.isnan(v)
        ],
    }


def _haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = np.radians(lat2 - lat1)
    dlon = np.radians(lon2 - lon1)
    a = (
        np.sin(dlat / 2) ** 2
        + np.cos(np.radians(lat1))
        * np.cos(np.radians(lat2))
        * np.sin(dlon / 2) ** 2
    )
    return R * 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))


def get_section_profile(points: list[dict], time_index: int) -> dict:
    if len(points) < 2:
        return {"time": "", "unit": "mmol/m3", "section": []}

    # Validate points against study area polygon
    from shapely.geometry import shape, Point as ShpPoint
    import json, os

    geojson_path = os.path.join(os.path.dirname(__file__), "..", "static", "study_area.geojson")
    with open(geojson_path, "r") as f:
        geojson = json.load(f)
    study_polygon = shape(geojson["features"][0]["geometry"])

    for pt in points:
        if not study_polygon.contains(ShpPoint(pt["lon"], pt["lat"])):
            return {"error": "请选择紫色边界内的研究区点位", "section": []}

    ds = get_ds()
    ds_t = ds.isel(time=time_index)

    depth_arr = ds.depth.values.astype(np.float64)
    lat_arr = ds.lat.values.astype(np.float64)
    lon_arr = ds.lon.values.astype(np.float64)

    o2 = ds_t["o2_pred"].values  # (depth, lat, lon)

    # Segment distances
    segment_dists = []
    for k in range(1, len(points)):
        d = _haversine_km(
            points[k - 1]["lat"], points[k - 1]["lon"],
            points[k]["lat"], points[k]["lon"],
        )
        segment_dists.append(d)

    total_dist = sum(segment_dists)

    # Sample every ~20km, min 60 points total, max 300
    MIN_SAMPLES = 60
    MAX_SAMPLES = 300
    SAMPLE_INTERVAL = 20  # km
    num_samples = max(MIN_SAMPLES, min(MAX_SAMPLES, int(total_dist / SAMPLE_INTERVAL) + 1))

    section = []
    cumulative_km_start = 0.0

    for seg_idx, seg_km in enumerate(segment_dists):
        p0 = points[seg_idx]
        p1 = points[seg_idx + 1]

        # Allocate samples proportional to segment length
        if total_dist > 0:
            seg_samples = max(5, int(num_samples * seg_km / total_dist))
        else:
            seg_samples = 10

        for s in range(seg_samples):
            frac = s / max(seg_samples - 1, 1)
            lat = p0["lat"] + frac * (p1["lat"] - p0["lat"])
            lon = p0["lon"] + frac * (p1["lon"] - p0["lon"])
            dist_km = cumulative_km_start + frac * seg_km

            j, i = _find_nearest_ocean(lat_arr, lon_arr, o2, lat, lon)

            for d_idx, d_val in enumerate(depth_arr):
                o2_val = o2[d_idx, j, i]
                if np.isnan(o2_val):
                    continue
                section.append({
                    "distance_km": round(dist_km, 1),
                    "depth": round(float(d_val), 1),
                    "oxygen": round(float(o2_val), 1),
                    "lat": round(lat, 4),
                    "lon": round(lon, 4),
                })

        cumulative_km_start += seg_km

    time_str = str(ds.time.values[time_index])

    return {
        "time": time_str,
        "unit": "mmol/m3",
        "section": section,
    }
