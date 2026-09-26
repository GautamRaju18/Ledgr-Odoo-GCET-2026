from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    database_url: str = (
        "postgresql+psycopg://stocksense:stocksense@localhost:5432/stocksense"
    )
    jwt_secret: str
    jwt_expire_minutes: int = 12 * 60
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""


settings = Settings()
