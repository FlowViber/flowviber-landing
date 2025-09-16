
-- Drop existing tables if they exist to avoid conflicts
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS workflows CASCADE;
DROP TABLE IF EXISTS ai_providers CASCADE;

-- Create ai_providers table
CREATE TABLE ai_providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    api_key TEXT NOT NULL,
    base_url TEXT,
    models JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflows table for direct PostgreSQL access
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    chat_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    workflow_json JSONB,
    config JSONB DEFAULT '{}',
    status TEXT DEFAULT 'draft',
    user_id UUID DEFAULT '00000000-0000-0000-0000-000000000001', -- Default user for development
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE conversations (
    id VARCHAR(255) PRIMARY KEY,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_workflows_created_at ON workflows(created_at);
CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);
CREATE INDEX idx_conversations_workflow_id ON conversations(workflow_id);
CREATE INDEX idx_ai_providers_active ON ai_providers(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_workflows_updated_at
    BEFORE UPDATE ON workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_providers_updated_at
    BEFORE UPDATE ON ai_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default AI provider (optional)
INSERT INTO ai_providers (name, api_key, base_url, models, is_active) 
VALUES (
    'OpenAI',
    'your-api-key-here',
    'https://api.openai.com/v1',
    '["gpt-3.5-turbo", "gpt-4"]'::jsonb,
    true
) ON CONFLICT (name) DO NOTHING;
