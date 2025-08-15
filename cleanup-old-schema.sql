-- =====================================================
-- CLEANUP OLD P2P SCHEMA - Run this FIRST!
-- =====================================================

-- Drop all old P2P tables and functions
DROP TABLE IF EXISTS board_moderators CASCADE;
DROP TABLE IF EXISTS user_connections CASCADE;
DROP TABLE IF EXISTS staking_rewards CASCADE;
DROP TABLE IF EXISTS stakes CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS boards CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop old functions
DROP FUNCTION IF EXISTS update_message_stats() CASCADE;
DROP FUNCTION IF EXISTS update_user_stats() CASCADE;
DROP FUNCTION IF EXISTS update_board_activity() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS get_user_level(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS calculate_decay_score(INTEGER, INTEGER, DECIMAL) CASCADE;

-- Drop old views
DROP VIEW IF EXISTS board_stats CASCADE;
DROP VIEW IF EXISTS user_leaderboard CASCADE;
DROP VIEW IF EXISTS message_analytics CASCADE;

-- Drop old triggers
DROP TRIGGER IF EXISTS trigger_update_message_stats ON stakes;
DROP TRIGGER IF EXISTS trigger_update_user_stats ON messages;
DROP TRIGGER IF EXISTS trigger_update_user_stats_stakes ON stakes;
DROP TRIGGER IF EXISTS trigger_update_board_activity ON messages;
DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON users;
DROP TRIGGER IF EXISTS trigger_update_messages_updated_at ON messages;
DROP TRIGGER IF EXISTS trigger_update_boards_updated_at ON boards;

-- Clean slate ready for new time capsule schema!
