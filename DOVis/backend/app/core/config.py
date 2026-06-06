from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_TITLE: str = "DOVis - Dissolved Oxygen Visualization"
    APP_VERSION: str = "0.1.0"
    APP_DESCRIPTION: str = "Backend API for multi-dimensional dissolved oxygen data visualization"

    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    CSV_DATA_PATH: str = "backend/app/data/sample_do_profile.csv"

    model_config = {"env_prefix": "DOVIS_"}


settings = Settings()
