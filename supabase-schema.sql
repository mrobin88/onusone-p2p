-- =====================================================
-- OnusOne P2P Database Schema for Supabase
-- =====================================================
-- This script creates all necessary tables, indexes, and functions
-- for the OnusOne P2P messaging and staking system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table for user profiles and authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(44) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    total_messages INTEGER DEFAULT 0,
    total_staked DECIMAL(20,8) DEFAULT 0,
    total_earned DECIMAL(20,8) DEFAULT 0,
    reputation INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    is_verified BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    preferences JSONB DEFAULT '{}',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Boards table for discussion categories
CREATE TABLE IF NOT EXISTS boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_private BOOLEAN DEFAULT FALSE,
    total_messages INTEGER DEFAULT 0,
    total_stakes DECIMAL(20,8) DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table for all posts and replies
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    author VARCHAR(50) NOT NULL,
    author_wallet VARCHAR(44) NOT NULL,
    board_slug VARCHAR(50) NOT NULL,
    parent_id UUID,
    ipfs_hash VARCHAR(64),
    stake_amount DECIMAL(20,8) DEFAULT 0,
    total_stakes DECIMAL(20,8) DEFAULT 0,
    decay_score INTEGER DEFAULT 100,
    reward_pool DECIMAL(20,8) DEFAULT 0,
    reputation_impact INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    edit_history JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stakes table for message staking
CREATE TABLE IF NOT EXISTS stakes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL,
    staker_wallet VARCHAR(44) NOT NULL,
    staker_username VARCHAR(50) NOT NULL,
    stake_amount DECIMAL(20,8) NOT NULL,
    stake_type VARCHAR(20) NOT NULL CHECK (stake_type IN ('support', 'challenge', 'boost')),
    reward_multiplier DECIMAL(5,2) DEFAULT 1.0,
    expires_at BIGINT,
    is_active BOOLEAN DEFAULT TRUE,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staking rewards table
CREATE TABLE IF NOT EXISTS staking_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL,
    recipient_wallet VARCHAR(44) NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    reason VARCHAR(20) NOT NULL CHECK (reason IN ('quality', 'popularity', 'longevity', 'community')),
    transaction_hash VARCHAR(64),
    is_distributed BOOLEAN DEFAULT FALSE,
    distributed_at TIMESTAMP WITH TIME ZONE,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User connections/following table
CREATE TABLE IF NOT EXISTS user_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_wallet VARCHAR(44) NOT NULL,
    following_wallet VARCHAR(44) NOT NULL,
    connection_type VARCHAR(20) DEFAULT 'follow' CHECK (connection_type IN ('follow', 'friend', 'block')),
    is_mutual BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_wallet, following_wallet)
);

-- Board moderators table
CREATE TABLE IF NOT EXISTS board_moderators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_slug VARCHAR(50) NOT NULL,
    moderator_wallet VARCHAR(44) NOT NULL,
    permissions JSONB DEFAULT '{}',
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(board_slug, moderator_wallet)
);

-- =====================================================
-- FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Add foreign key constraints after all tables are created
ALTER TABLE user_connections 
    ADD CONSTRAINT fk_user_connections_follower 
    FOREIGN KEY (follower_wallet) REFERENCES users(wallet_address) ON DELETE CASCADE;

ALTER TABLE user_connections 
    ADD CONSTRAINT fk_user_connections_following 
    FOREIGN KEY (following_wallet) REFERENCES users(wallet_address) ON DELETE CASCADE;

ALTER TABLE board_moderators 
    ADD CONSTRAINT fk_board_moderators_board 
    FOREIGN KEY (board_slug) REFERENCES boards(slug) ON DELETE CASCADE;

ALTER TABLE board_moderators 
    ADD CONSTRAINT fk_board_moderators_moderator 
    FOREIGN KEY (moderator_wallet) REFERENCES users(wallet_address) ON DELETE CASCADE;

-- Add foreign key constraints for messages and stakes
ALTER TABLE messages 
    ADD CONSTRAINT fk_messages_parent 
    FOREIGN KEY (parent_id) REFERENCES messages(id) ON DELETE CASCADE;

ALTER TABLE stakes 
    ADD CONSTRAINT fk_stakes_message 
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE;

ALTER TABLE staking_rewards 
    ADD CONSTRAINT fk_staking_rewards_message 
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Message indexes
CREATE INDEX IF NOT EXISTS idx_messages_board_slug ON messages(board_slug);
CREATE INDEX IF NOT EXISTS idx_messages_author ON messages(author);
CREATE INDEX IF NOT EXISTS idx_messages_author_wallet ON messages(author_wallet);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_stake_amount ON messages(stake_amount);
CREATE INDEX IF NOT EXISTS idx_messages_decay_score ON messages(decay_score);
CREATE INDEX IF NOT EXISTS idx_messages_parent_id ON messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_messages_ipfs_hash ON messages(ipfs_hash);

-- Stake indexes
CREATE INDEX IF NOT EXISTS idx_stakes_message_id ON stakes(message_id);
CREATE INDEX IF NOT EXISTS idx_stakes_staker_wallet ON stakes(staker_wallet);
CREATE INDEX IF NOT EXISTS idx_stakes_timestamp ON stakes(timestamp);
CREATE INDEX IF NOT EXISTS idx_stakes_stake_type ON stakes(stake_type);
CREATE INDEX IF NOT EXISTS idx_stakes_is_active ON stakes(is_active);

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_reputation ON users(reputation);
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level);

-- Board indexes
CREATE INDEX IF NOT EXISTS idx_boards_slug ON boards(slug);
CREATE INDEX IF NOT EXISTS idx_boards_is_active ON boards(is_active);
CREATE INDEX IF NOT EXISTS idx_boards_last_activity ON boards(last_activity);

-- Connection indexes
CREATE INDEX IF NOT EXISTS idx_user_connections_follower ON user_connections(follower_wallet);
CREATE INDEX IF NOT EXISTS idx_user_connections_following ON user_connections(following_wallet);
CREATE INDEX IF NOT EXISTS idx_user_connections_type ON user_connections(connection_type);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update message stats when stakes change
CREATE OR REPLACE FUNCTION update_message_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        -- Update total stakes for the message
        UPDATE messages 
        SET total_stakes = (
            SELECT COALESCE(SUM(stake_amount), 0)
            FROM stakes 
            WHERE message_id = COALESCE(NEW.message_id, OLD.message_id)
            AND is_active = TRUE
        )
        WHERE id = COALESCE(NEW.message_id, OLD.message_id);
        
        -- Update board stats
        UPDATE boards 
        SET total_stakes = (
            SELECT COALESCE(SUM(total_stakes), 0)
            FROM messages 
            WHERE board_slug = boards.slug
        )
        WHERE slug = (
            SELECT board_slug 
            FROM messages 
            WHERE id = COALESCE(NEW.message_id, OLD.message_id)
        );
        
        RETURN COALESCE(NEW, OLD);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        -- Update user message count
        UPDATE users 
        SET total_messages = (
            SELECT COUNT(*)
            FROM messages 
            WHERE author_wallet = COALESCE(NEW.author_wallet, OLD.author_wallet)
            AND is_deleted = FALSE
        )
        WHERE wallet_address = COALESCE(NEW.author_wallet, OLD.author_wallet);
        
        -- Update user total staked
        UPDATE users 
        SET total_staked = (
            SELECT COALESCE(SUM(stake_amount), 0)
            FROM stakes 
            WHERE staker_wallet = COALESCE(NEW.author_wallet, OLD.author_wallet)
            AND is_active = TRUE
        )
        WHERE wallet_address = COALESCE(NEW.author_wallet, OLD.author_wallet);
        
        RETURN COALESCE(NEW, OLD);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update board activity
CREATE OR REPLACE FUNCTION update_board_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        -- Update board message count
        UPDATE boards 
        SET total_messages = (
            SELECT COUNT(*)
            FROM messages 
            WHERE board_slug = COALESCE(NEW.board_slug, OLD.board_slug)
            AND is_deleted = FALSE
        )
        WHERE slug = COALESCE(NEW.board_slug, OLD.board_slug);
        
        -- Update board last activity
        UPDATE boards 
        SET last_activity = NOW()
        WHERE slug = COALESCE(NEW.board_slug, OLD.board_slug);
        
        RETURN COALESCE(NEW, OLD);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger for message stats updates
CREATE TRIGGER trigger_update_message_stats
    AFTER INSERT OR UPDATE OR DELETE ON stakes
    FOR EACH ROW EXECUTE FUNCTION update_message_stats();

-- Trigger for user stats updates
CREATE TRIGGER trigger_update_user_stats
    AFTER INSERT OR UPDATE OR DELETE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER trigger_update_user_stats_stakes
    AFTER INSERT OR UPDATE OR DELETE ON stakes
    FOR EACH ROW EXECUTE FUNCTION update_user_stats();

-- Trigger for board activity updates
CREATE TRIGGER trigger_update_board_activity
    AFTER INSERT OR UPDATE OR DELETE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_board_activity();

-- Triggers for updated_at timestamps
CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_boards_updated_at
    BEFORE UPDATE ON boards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default boards
INSERT INTO boards (slug, name, description) VALUES
    ('general', 'General Discussion', 'General topics and discussions'),
    ('tech', 'Technology', 'Tech discussions and news'),
    ('crypto', 'Cryptocurrency', 'Crypto and blockchain talk'),
    ('dev', 'Development', 'Development and coding discussions'),
    ('community', 'Community', 'Community topics and events'),
    ('gaming', 'Gaming', 'Gaming and entertainment'),
    ('art', 'Art & Design', 'Creative arts and design'),
    ('music', 'Music', 'Music and audio discussions'),
    ('trading', 'Trading', 'Trading and finance')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_moderators ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be customized based on your auth requirements)
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (wallet_address = current_setting('app.current_user_wallet', true)::VARCHAR);

CREATE POLICY "Boards are viewable by all" ON boards FOR SELECT USING (true);
CREATE POLICY "Only moderators can modify boards" ON boards FOR ALL USING (
    EXISTS (
        SELECT 1 FROM board_moderators 
        WHERE board_slug = boards.slug 
        AND moderator_wallet = current_setting('app.current_user_wallet', true)::VARCHAR
    )
);

CREATE POLICY "Messages are viewable by all" ON messages FOR SELECT USING (true);
CREATE POLICY "Users can create messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE USING (author_wallet = current_setting('app.current_user_wallet', true)::VARCHAR);

CREATE POLICY "Stakes are viewable by all" ON stakes FOR SELECT USING (true);
CREATE POLICY "Users can create stakes" ON stakes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own stakes" ON stakes FOR UPDATE USING (staker_wallet = current_setting('app.current_user_wallet', true)::VARCHAR);

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to get user reputation level
CREATE OR REPLACE FUNCTION get_user_level(reputation_score INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE
        WHEN reputation_score < 100 THEN 1
        WHEN reputation_score < 500 THEN 2
        WHEN reputation_score < 1000 THEN 3
        WHEN reputation_score < 2500 THEN 4
        WHEN reputation_score < 5000 THEN 5
        WHEN reputation_score < 10000 THEN 6
        WHEN reputation_score < 25000 THEN 7
        WHEN reputation_score < 50000 THEN 8
        WHEN reputation_score < 100000 THEN 9
        ELSE 10
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate decay score
CREATE OR REPLACE FUNCTION calculate_decay_score(
    base_score INTEGER,
    age_hours INTEGER,
    stake_multiplier DECIMAL
)
RETURNS INTEGER AS $$
BEGIN
    RETURN GREATEST(1, base_score - (age_hours * stake_multiplier));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for board statistics
CREATE OR REPLACE VIEW board_stats AS
SELECT 
    b.slug,
    b.name,
    b.description,
    b.total_messages,
    b.total_stakes,
    b.active_users,
    b.last_activity,
    COUNT(DISTINCT m.author_wallet) as unique_authors,
    AVG(m.stake_amount) as avg_stake_amount
FROM boards b
LEFT JOIN messages m ON b.slug = m.board_slug AND m.is_deleted = FALSE
GROUP BY b.id, b.slug, b.name, b.description, b.total_messages, b.total_stakes, b.active_users, b.last_activity;

-- View for user leaderboard
CREATE OR REPLACE VIEW user_leaderboard AS
SELECT 
    u.username,
    u.wallet_address,
    u.reputation,
    u.level,
    u.total_messages,
    u.total_staked,
    u.total_earned,
    u.joined_at
FROM users u
WHERE u.is_banned = FALSE
ORDER BY u.reputation DESC, u.total_messages DESC;

-- View for message analytics
CREATE OR REPLACE VIEW message_analytics AS
SELECT 
    m.id,
    m.content,
    m.author,
    m.board_slug,
    m.stake_amount,
    m.total_stakes,
    m.decay_score,
    m.likes,
    m.dislikes,
    m.timestamp,
    EXTRACT(EPOCH FROM (NOW() - to_timestamp(m.timestamp/1000))) / 3600 as age_hours
FROM messages m
WHERE m.is_deleted = FALSE
ORDER BY m.timestamp DESC;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE users IS 'User profiles and authentication data';
COMMENT ON TABLE boards IS 'Discussion board categories';
COMMENT ON TABLE messages IS 'User posts and replies with staking support';
COMMENT ON TABLE stakes IS 'User stakes on messages for rewards';
COMMENT ON TABLE staking_rewards IS 'Distributed rewards from staking pools';
COMMENT ON TABLE user_connections IS 'User following and connection relationships';
COMMENT ON TABLE board_moderators IS 'Board moderation permissions';

COMMENT ON FUNCTION update_message_stats() IS 'Updates message and board statistics when stakes change';
COMMENT ON FUNCTION update_user_stats() IS 'Updates user statistics when messages or stakes change';
COMMENT ON FUNCTION update_board_activity() IS 'Updates board activity metrics';
COMMENT ON FUNCTION get_user_level(INTEGER) IS 'Calculates user level based on reputation score';
COMMENT ON FUNCTION calculate_decay_score(INTEGER, INTEGER, DECIMAL) IS 'Calculates message decay score based on age and stakes';

-- =====================================================
-- END OF SCHEMA
-- =====================================================
