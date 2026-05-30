import numpy as np

STANDARD_DEPTHS = [0, 10, 25, 50, 75, 100, 150, 200, 300, 500, 1000, 2000, 4000, 6000]


def _generate_do_profile(lat: float, lon: float) -> list[dict]:
    """Generate a realistic dissolved oxygen depth profile.

    Models typical oceanographic DO vertical structure:
    - High surface oxygen (mixed layer, ~200-230 mmol/m³)
    - Gradual decline through thermocline
    - Oxygen minimum zone around 300-1000m (~50-100 mmol/m³)
    - Slight increase at depth (cold bottom water)
    - Subtle lat/lon variation so different locations yield different profiles
    """
    seed = int(abs(lat * 1000 + lon * 500)) % 1000
    rng = np.random.default_rng(seed)

    base_surface_o2 = 210.0 + rng.uniform(-15, 15)
    omz_depth = 400.0 + rng.uniform(-100, 100)
    omz_min = 45.0 + rng.uniform(0, 40)
    deep_o2 = omz_min + rng.uniform(30, 60)

    profile = []
    for depth in STANDARD_DEPTHS:
        if depth <= 100:
            # Mixed layer: slow decline
            o2 = base_surface_o2 - depth * 0.15 + rng.uniform(-3, 3)
        elif depth <= omz_depth:
            # Thermocline decline toward OMZ
            frac = (depth - 100) / (omz_depth - 100)
            o2 = base_surface_o2 - 15 + frac * (omz_min - base_surface_o2 + 15)
            o2 += rng.uniform(-5, 5)
        else:
            # Deep recovery
            frac = min((depth - omz_depth) / (6000 - omz_depth), 1.0)
            o2 = omz_min + frac * (deep_o2 - omz_min)
            o2 += rng.uniform(-3, 3)

        o2 = max(10, min(280, o2))
        profile.append({"depth": depth, "oxygen": round(float(o2), 1)})

    return profile


def get_vertical_profile(lat: float, lon: float, time: str) -> dict:
    profile = _generate_do_profile(lat, lon)
    return {
        "location": {"lat": lat, "lon": lon},
        "time": time,
        "unit": "mmol/m3",
        "profile": profile,
    }


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = np.radians(lat2 - lat1)
    dlon = np.radians(lon2 - lon1)
    a = np.sin(dlat / 2) ** 2 + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon / 2) ** 2
    return R * 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))


def get_section_profile(points: list[dict], time: str) -> dict:
    """Generate DO profiles along a transect defined by multiple waypoints."""
    cumulative_km = [0.0]
    for i in range(1, len(points)):
        d = _haversine_km(points[i - 1]["lat"], points[i - 1]["lon"],
                          points[i]["lat"], points[i]["lon"])
        cumulative_km.append(cumulative_km[-1] + d)

    total_dist = cumulative_km[-1]
    num_samples = min(len(points), 10)
    section = []

    for idx in range(num_samples):
        if total_dist > 0:
            frac = idx / max(num_samples - 1, 1)
            target_dist = frac * total_dist
            seg_idx = 0
            for i in range(len(cumulative_km) - 1):
                if cumulative_km[i] <= target_dist <= cumulative_km[i + 1]:
                    seg_idx = i
                    break
            else:
                seg_idx = max(len(cumulative_km) - 2, 0)

            seg_frac = 0.5
            seg_len = cumulative_km[seg_idx + 1] - cumulative_km[seg_idx]
            if seg_len > 0:
                seg_frac = (target_dist - cumulative_km[seg_idx]) / seg_len

            lat = points[seg_idx]["lat"] + seg_frac * (points[seg_idx + 1]["lat"] - points[seg_idx]["lat"])
            lon = points[seg_idx]["lon"] + seg_frac * (points[seg_idx + 1]["lon"] - points[seg_idx]["lon"])
        else:
            lat, lon = points[0]["lat"], points[0]["lon"]

        profile = _generate_do_profile(lat, lon)
        for entry in profile:
            section.append({
                "distance_km": round(cumulative_km[seg_idx] + seg_idx * 0.1, 1),
                "depth": entry["depth"],
                "oxygen": entry["oxygen"],
            })

    return {
        "time": time,
        "unit": "mmol/m3",
        "section": section,
    }
