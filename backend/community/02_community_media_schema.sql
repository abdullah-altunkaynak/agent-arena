-- Community media storage (icon/banner binaries in DB)
-- Run after 01_database_schema.sql

CREATE TABLE IF NOT EXISTS community_media (
    community_id UUID PRIMARY KEY REFERENCES communities(id) ON DELETE CASCADE,
    icon_base64 TEXT,
    icon_mime VARCHAR(120),
    banner_base64 TEXT,
    banner_mime VARCHAR(120),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_media_updated_at ON community_media(updated_at DESC);
