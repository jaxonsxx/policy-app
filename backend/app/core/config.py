"""
 * Application Configuration Settings
 *
 * This file contains the application configuration class that loads
 * environment variables and provides default settings for the API.
 *
 * Public Classes:
 *    Settings(BaseSettings)
 *        Pydantic settings class that loads configuration from environment variables
 *
 * Public Variables:
 *    settings: Settings
 *        Global settings instance loaded from environment variables
 *
 * @author: ASA Policy App Development Team
 * @date: January 2026
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """
    Application settings class - Loads configuration from environment variables
    
    Attributes:
        SUPABASE_URL (str): Supabase project URL
        SUPABASE_KEY (str): Supabase anon/public key
        SUPABASE_SERVICE_KEY (str): Supabase service role key (for admin operations)
        POLICIES_TABLE (str): Name of policies table in database
        BYLAWS_TABLE (str): Name of bylaws table in database
        SUGGESTIONS_TABLE (str): Name of suggestions table in database
        USERS_TABLE (str): Name of users table in database
        POLICY_VERSIONS_TABLE (str): Name of policy versions table in database
        CORS_ORIGINS (List[str]): List of allowed CORS origins
        JWT_SECRET (str): JWT secret key (if using custom JWT)
        JWT_ALGORITHM (str): JWT algorithm
        JWT_EXPIRATION (int): JWT token expiration time in seconds
        DEBUG (bool): Debug mode flag
        ENVIRONMENT (str): Environment name (development/production)
    """
    
    # Supabase Configuration
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_KEY: str
    
    # Database Tables
    POLICIES_TABLE: str = "policies"
    BYLAWS_TABLE: str = "bylaws"
    SUGGESTIONS_TABLE: str = "suggestions"
    USERS_TABLE: str = "users"
    POLICY_VERSIONS_TABLE: str = "policy_versions"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:5500",
        "http://127.0.0.1:8000",
    ]
    
    # JWT Settings (if using Supabase Auth)
    JWT_SECRET: str = ""
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION: int = 3600  # 1 hour
    
    # Application
    DEBUG: bool = False
    ENVIRONMENT: str = "development"
    
    class Config:
        """Pydantic configuration"""
        env_file = ".env"
        case_sensitive = True


settings = Settings()
