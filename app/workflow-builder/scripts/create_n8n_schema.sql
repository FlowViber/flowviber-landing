-- Drop existing tables to recreate with proper n8n-compatible schema
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS workflows CASCADE;
DROP TABLE IF EXISTS ai_providers CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS core_nodes CASCADE;
DROP TABLE IF EXISTS node_parameters CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table (users/instances)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    n8n_instance_url TEXT
);

-- Create api_keys table
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    encrypted_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- Create workflows table with all n8n-compatible columns
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    
    -- Chat and AI workflow data
    chat_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    workflow_json JSONB,
    
    -- n8n integration fields
    n8n_workflow_id TEXT,
    deployed_at TIMESTAMP WITH TIME ZONE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    
    -- Status and metadata
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'generated', 'deployed')),
    version INTEGER DEFAULT 1,
    
    -- User association
    user_id UUID DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES profiles(id),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create core_nodes table (n8n node definitions)
CREATE TABLE core_nodes (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    node_type TEXT NOT NULL, -- 'trigger', 'action', 'condition', etc.
    category TEXT,
    properties JSONB DEFAULT '{}',
    icon_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create node_parameters table (for workflow nodes)
CREATE TABLE node_parameters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    node_id TEXT NOT NULL, -- n8n node ID within workflow
    node_type TEXT NOT NULL,
    parameters JSONB DEFAULT '{}',
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table (for AI chat history)
CREATE TABLE conversations (
    id VARCHAR(255) PRIMARY KEY,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflows_created_at ON workflows(created_at);
CREATE INDEX idx_workflows_n8n_workflow_id ON workflows(n8n_workflow_id);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_provider ON api_keys(provider);
CREATE INDEX idx_node_parameters_workflow_id ON node_parameters(workflow_id);
CREATE INDEX idx_conversations_workflow_id ON conversations(workflow_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);
CREATE INDEX idx_core_nodes_name ON core_nodes(name);
CREATE INDEX idx_core_nodes_category ON core_nodes(category);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at
    BEFORE UPDATE ON workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_core_nodes_updated_at
    BEFORE UPDATE ON core_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_node_parameters_updated_at
    BEFORE UPDATE ON node_parameters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default profile (Development User)
INSERT INTO profiles (id, display_name, n8n_instance_url) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Development User',
    'https://lucaringlogic.app.n8n.cloud/'
) ON CONFLICT (id) DO NOTHING;

-- Insert sample API keys (matching the image data)
INSERT INTO api_keys (id, user_id, provider, encrypted_key, created_at, updated_at) VALUES 
(
    '601aa701-7056-446c-9940-88016bbce9e',
    '00000000-0000-0000-0000-000000000001',
    'openai',
    'sk-proj-sMGlWVKSYZqO5dlFfzyadZkb',
    '2025-08-31 03:32:03.44147+00',
    '2025-09-02 03:38:00.660442+00'
),
(
    '6125a495-0538-4a3c-8088-9f2c39881848',
    '00000000-0000-0000-0000-000000000001',
    'claude',
    'sk-ant-api03-xWlrvpTQFgZcFxY_CfuZcC',
    '2025-08-31 03:28:44.277344+00',
    '2025-09-02 03:38:03.157449+00'
),
(
    'da8de6bc-59c4-4880-9ca4-703faaea585b',
    '00000000-0000-0000-0000-000000000001',
    'n8n',
    'eyJhbGciOiJUzIUNiIkIn5RzCl6lxkWCJg',
    '2025-08-31 03:28:58.718024+00',
    '2025-09-01 12:17:54.499466+00'
);

-- Insert some common n8n core nodes
INSERT INTO core_nodes (name, display_name, description, node_type, category) VALUES
('n8n-nodes-base.start', 'Start', 'Start workflow execution', 'trigger', 'core'),
('n8n-nodes-base.httpRequest', 'HTTP Request', 'Make HTTP requests', 'action', 'communication'),
('n8n-nodes-base.webhook', 'Webhook', 'Listen for HTTP requests', 'trigger', 'communication'),
('n8n-nodes-base.if', 'IF', 'Conditional logic', 'condition', 'logic'),
('n8n-nodes-base.set', 'Set', 'Set values', 'action', 'data'),
('n8n-nodes-base.code', 'Code', 'Execute JavaScript code', 'action', 'development'),
('n8n-nodes-base.schedule', 'Schedule Trigger', 'Trigger on schedule', 'trigger', 'core'),
('n8n-nodes-base.emailSend', 'Send Email', 'Send emails', 'action', 'communication');

COMMENT ON TABLE profiles IS 'User profiles and n8n instances';
COMMENT ON TABLE api_keys IS 'Encrypted API keys for various providers';
COMMENT ON TABLE workflows IS 'AI-generated n8n workflows with chat history';
COMMENT ON TABLE core_nodes IS 'Available n8n node types and definitions';
COMMENT ON TABLE node_parameters IS 'Individual node configurations within workflows';
COMMENT ON TABLE conversations IS 'AI conversation history linked to workflows';