-- Community rules storage
-- Run after 01_database_schema.sql, 02_community_media_schema.sql, 03_gamification_indexes.sql

CREATE TABLE IF NOT EXISTS community_rules (
    id UUID PRIMARY KEY,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    rule_text VARCHAR(500) NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 1,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_rules_community_order
ON community_rules(community_id, order_index);
