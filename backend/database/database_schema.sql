-- ASA Policy App Database Schema
-- Run this SQL in your Supabase SQL Editor
-- This is the complete schema with all current database structure
--
-- Created with the help of Cursor AI

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Policies Table
-- Note: Database columns use 'name' and 'content', but API uses 'policy_name' and 'policy_content'
-- The API automatically maps between these names
CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,  -- Maps to API field 'policy_name'
    section TEXT NOT NULL,
    content TEXT DEFAULT '',  -- Maps to API field 'policy_content'
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT,
    updated_by TEXT
);

-- Bylaws Table
-- Note: Database columns use 'number', 'title', 'content', but API uses 'bylaw_number', 'bylaw_title', 'bylaw_content'
-- The API automatically maps between these names
-- IMPORTANT: 'number' is INTEGER (not TEXT) to match API requirement
CREATE TABLE IF NOT EXISTS bylaws (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number INTEGER UNIQUE NOT NULL,  -- INTEGER - maps to API field 'bylaw_number'
    title TEXT NOT NULL,  -- Maps to API field 'bylaw_title'
    content TEXT DEFAULT '',  -- Maps to API field 'bylaw_content'
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT,
    updated_by TEXT
);

-- Suggestions Table
CREATE TABLE IF NOT EXISTS suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,
    bylaw_id UUID REFERENCES bylaws(id) ON DELETE SET NULL,
    suggestion TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users Table
-- Note: The 'id' field should match the user ID from Supabase Auth (auth.users)
-- When a user registers/logs in via Supabase Auth, their ID is stored here
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,  -- References auth.users(id) from Supabase Auth
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'public' CHECK (role IN ('public', 'admin', 'policy_working_group')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policy Versions Table (for version history)
CREATE TABLE IF NOT EXISTS policy_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id UUID REFERENCES policies(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    section TEXT NOT NULL,
    content TEXT DEFAULT '',
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT
);

-- Indexes for Policies
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_section ON policies(section);
CREATE INDEX IF NOT EXISTS idx_policies_policy_id ON policies(policy_id);
CREATE INDEX IF NOT EXISTS idx_policies_created_at ON policies(created_at);

-- Indexes for Bylaws
CREATE INDEX IF NOT EXISTS idx_bylaws_status ON bylaws(status);
CREATE INDEX IF NOT EXISTS idx_bylaws_number ON bylaws(number);
CREATE INDEX IF NOT EXISTS idx_bylaws_created_at ON bylaws(created_at);

-- Indexes for Suggestions
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_policy_id ON suggestions(policy_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_bylaw_id ON suggestions(bylaw_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_created_at ON suggestions(created_at);

-- Indexes for Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Indexes for Policy Versions
CREATE INDEX IF NOT EXISTS idx_policy_versions_policy_id ON policy_versions(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_versions_version_number ON policy_versions(policy_id, version_number);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bylaws_updated_at BEFORE UPDATE ON bylaws
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suggestions_updated_at BEFORE UPDATE ON suggestions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on tables
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE bylaws ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- Policies: Public can view approved policies
CREATE POLICY "Public can view approved policies"
    ON policies FOR SELECT
    USING (status = 'approved');

-- Bylaws: Public can view approved bylaws
CREATE POLICY "Public can view approved bylaws"
    ON bylaws FOR SELECT
    USING (status = 'approved');

-- Suggestions: Public can insert suggestions
CREATE POLICY "Public can insert suggestions"
    ON suggestions FOR INSERT
    WITH CHECK (true);

-- Admin RLS Policies
-- Allow admin users to perform all operations on policies
CREATE POLICY "Admin can manage policies"
    ON policies FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id::text = current_setting('request.jwt.claims', true)::json->>'sub'
            AND users.role = 'admin'
        )
    );

-- Allow admin users to perform all operations on bylaws
CREATE POLICY "Admin can manage bylaws"
    ON bylaws FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id::text = current_setting('request.jwt.claims', true)::json->>'sub'
            AND users.role = 'admin'
        )
    );

-- Allow admin and policy_working_group to manage suggestions
CREATE POLICY "Admin and policy_working_group can manage suggestions"
    ON suggestions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id::text = current_setting('request.jwt.claims', true)::json->>'sub'
            AND users.role IN ('admin', 'policy_working_group')
        )
    );

-- Note: Admin operations can also use the service role key which bypasses RLS
-- The backend uses service role key for admin operations to ensure proper access
