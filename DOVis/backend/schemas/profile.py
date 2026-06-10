from pydantic import BaseModel, Field


class Location(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)


class DepthOxygen(BaseModel):
    depth: float
    oxygen: float


class VerticalProfileResponse(BaseModel):
    location: Location
    time: str
    unit: str = "mmol/m3"
    profile: list[DepthOxygen]


class PointInput(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)


class SectionRequest(BaseModel):
    points: list[PointInput] = Field(..., min_length=2)
    time_index: int = 0


class SectionPoint(BaseModel):
    distance_km: float
    depth: float
    oxygen: float
    lat: float
    lon: float


class SectionResponse(BaseModel):
    time: str
    unit: str = "mmol/m3"
    section: list[SectionPoint]
