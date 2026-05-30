from pydantic import BaseModel, Field


class Location(BaseModel):
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lon: float = Field(..., ge=-180, le=180, description="Longitude")


class DepthOxygen(BaseModel):
    depth: float = Field(..., description="Depth in meters")
    oxygen: float = Field(..., description="Dissolved oxygen concentration (mmol/m³)")


class VerticalProfileResponse(BaseModel):
    location: Location
    time: str = Field(..., description="Time string (e.g., 2024-01)")
    unit: str = Field(default="mmol/m3", description="Unit of oxygen concentration")
    profile: list[DepthOxygen]


class PointInput(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)


class SectionRequest(BaseModel):
    points: list[PointInput] = Field(..., min_length=2, description="List of waypoints defining the transect")
    time: str = Field(default="2024-01", description="Time string")


class SectionPoint(BaseModel):
    distance_km: float
    depth: float
    oxygen: float


class SectionResponse(BaseModel):
    time: str
    unit: str = Field(default="mmol/m3")
    section: list[SectionPoint]


class HealthResponse(BaseModel):
    status: str
    message: str
