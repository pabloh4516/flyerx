-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schema for better organization (optional)
-- CREATE SCHEMA IF NOT EXISTS flyerx;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE flyerx TO flyerx;
