-- =====================================================
-- OnusOne Time Capsules Database Schema for Supabase
-- =====================================================
-- This script creates all necessary tables, indexes, and functions
-- for the OnusOne Time Capsule application

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
    total_capsules INTEGER DEFAULT 0,
    total_onu_tokens DECIMAL(20,8) DEFAULT 0,
    total_spent DECIMAL(20,8) DEFAULT 0,
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

-- Time Capsules table for future messages
CREATE TABLE IF NOT EXISTS time_capsules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    author_wallet VARCHAR(44) NOT NULL,
    author_username VARCHAR(50) NOT NULL,
    unlock_at BIGINT NOT NULL, -- Unix timestamp
    cost_onu DECIMAL(20,8) DEFAULT 0,
    ipfs_hash VARCHAR(64),
    is_locked BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ONU Token Transactions table
CREATE TABLE IF NOT EXISTS onu_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_wallet VARCHAR(44) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase', 'spend', 'reward', 'refund')),
    amount DECIMAL(20,8) NOT NULL,
    usd_amount DECIMAL(10,2),
    stripe_payment_intent_id VARCHAR(255),
    solana_transaction_hash VARCHAR(64),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Time capsule indexes
CREATE INDEX IF NOT EXISTS idx_time_capsules_author_wallet ON time_capsules(author_wallet);
CREATE INDEX IF NOT EXISTS idx_time_capsules_unlock_at ON time_capsules(unlock_at);
CREATE INDEX IF NOT EXISTS idx_time_capsules_is_locked ON time_capsules(is_locked);
CREATE INDEX IF NOT EXISTS idx_time_capsules_created_at ON time_capsules(created_at);

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_reputation ON users(reputation);

-- Transaction indexes
CREATE INDEX IF NOT EXISTS idx_onu_transactions_user_wallet ON onu_transactions(user_wallet);
CREATE INDEX IF NOT EXISTS idx_onu_transactions_type ON onu_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_onu_transactions_created_at ON onu_transactions(created_at);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update user stats when capsules change
CREATE OR REPLACE FUNCTION update_user_capsule_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        -- Update user capsule count
        UPDATE users 
        SET total_capsules = (
            SELECT COUNT(*)
            FROM time_capsules 
            WHERE author_wallet = COALESCE(NEW.author_wallet, OLD.author_wallet)
            AND is_deleted = FALSE
        )
        WHERE wallet_address = COALESCE(NEW.author_wallet, OLD.author_wallet);
        
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

-- Trigger for user capsule stats updates
CREATE TRIGGER trigger_update_user_capsule_stats
    AFTER INSERT OR UPDATE OR DELETE ON time_capsules
    FOR EACH ROW EXECUTE FUNCTION update_user_capsule_stats();

-- Triggers for updated_at timestamps
CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_time_capsules_updated_at
    BEFORE UPDATE ON time_capsules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default user (for testing)
INSERT INTO users (wallet_address, username, email) VALUES
    ('5KFWZzGAjEHJbjE5p8NmEsrwKez9XLKVWnnMV1Qt3ARi', 'User990', 'user990@example.com')
ON CONFLICT (wallet_address) DO NOTHING;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE onu_transactions ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (wallet_address = current_setting('app.current_user_wallet', true)::VARCHAR);

CREATE POLICY "Time capsules are viewable by all" ON time_capsules FOR SELECT USING (true);
CREATE POLICY "Users can create time capsules" ON time_capsules FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own time capsules" ON time_capsules FOR UPDATE USING (author_wallet = current_setting('app.current_user_wallet', true)::VARCHAR);

CREATE POLICY "Users can view own transactions" ON onu_transactions FOR SELECT USING (user_wallet = current_setting('app.current_user_wallet', true)::VARCHAR);
CREATE POLICY "Users can create transactions" ON onu_transactions FOR INSERT WITH CHECK (true);

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

-- Function to get unlocked time capsules
CREATE OR REPLACE FUNCTION get_unlocked_capsules()
RETURNS TABLE (
    id UUID,
    content TEXT,
    author_username VARCHAR(50),
    unlock_at BIGINT,
    cost_onu DECIMAL(20,8),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tc.id,
        tc.content,
        tc.author_username,
        tc.unlock_at,
        tc.cost_onu,
        tc.created_at
    FROM time_capsules tc
    WHERE tc.is_locked = FALSE 
    AND tc.is_deleted = FALSE
    AND tc.unlock_at <= EXTRACT(EPOCH FROM NOW()) * 1000
    ORDER BY tc.unlock_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for user leaderboard
CREATE OR REPLACE VIEW user_leaderboard AS
SELECT 
    u.username,
    u.wallet_address,
    u.reputation,
    u.level,
    u.total_capsules,
    u.total_onu_tokens,
    u.joined_at
FROM users u
WHERE u.is_banned = FALSE
ORDER BY u.reputation DESC, u.total_capsules DESC;

-- View for time capsule analytics
CREATE OR REPLACE VIEW capsule_analytics AS
SELECT 
    tc.id,
    tc.content,
    tc.author_username,
    tc.cost_onu,
    tc.unlock_at,
    tc.is_locked,
    tc.created_at,
    EXTRACT(EPOCH FROM (NOW() - to_timestamp(tc.unlock_at/1000))) / 3600 as hours_until_unlock
FROM time_capsules tc
WHERE tc.is_deleted = FALSE
ORDER BY tc.created_at DESC;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE users IS 'User profiles and authentication data';
COMMENT ON TABLE time_capsules IS 'Future messages that unlock at specific times';
COMMENT ON TABLE onu_transactions IS 'ONU token purchase and spending history';

COMMENT ON FUNCTION update_user_capsule_stats() IS 'Updates user statistics when time capsules change';
COMMENT ON FUNCTION get_user_level(INTEGER) IS 'Calculates user level based on reputation score';
COMMENT ON FUNCTION get_unlocked_capsules() IS 'Returns all unlocked time capsules';

-- =====================================================
-- END OF SCHEMA
-- =====================================================
