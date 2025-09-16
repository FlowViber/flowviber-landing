
// Prevent any client-side usage
if (typeof window !== 'undefined') {
  throw new Error('Database module should not be imported on client-side')
}

import { Pool } from 'pg'

let pool: Pool | null = null

// Create a connection pool for PostgreSQL (server-side only)
function getDatabase() {
  if (typeof window !== 'undefined') {
    throw new Error('Database connections can only be used on the server side')
  }
  
  if (!pool) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set')
    }
    
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    })
    
    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Database pool error:', err)
    })
  }
  
  return pool
}

export { getDatabase as database }
