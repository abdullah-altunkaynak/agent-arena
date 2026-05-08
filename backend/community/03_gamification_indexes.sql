-- Gamification performance indexes
-- Run after 01_database_schema.sql and 02_community_media_schema.sql

CREATE INDEX IF NOT EXISTS idx_user_profiles_points_total_desc
ON user_profiles(points_total DESC);

CREATE INDEX IF NOT EXISTS idx_user_profiles_level_desc
ON user_profiles(level DESC);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_earned_at
ON user_badges(user_id, earned_at DESC);

CREATE INDEX IF NOT EXISTS idx_badges_points_threshold
ON badges(points_threshold);
