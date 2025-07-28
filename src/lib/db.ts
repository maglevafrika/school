// lib/db.ts
import mysql, { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'

// Define types for database operations
export interface QueryOptions {
  orderBy?: string
  limit?: number
}

export interface TransactionQuery {
  sql: string
  params?: any[]
}

export interface DatabaseResult extends ResultSetHeader {
  insertId: number
  affectedRows: number
}

// Function to get database configuration
function getDatabaseConfig() {
  // Railway provides these environment variables (with and without underscores)
  const railwayConfig = {
    host: process.env.MYSQLHOST || process.env.MYSQL_HOST,
    port: process.env.MYSQLPORT ? parseInt(process.env.MYSQLPORT) : 
          process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : undefined,
    user: process.env.MYSQLUSER || process.env.MYSQL_USER,
    password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD,
    database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE,
  }

  // Local development configuration
  const localConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  }

  // Use Railway config if available, otherwise fall back to local config
  const config = railwayConfig.host ? railwayConfig : localConfig

  console.log(`🔗 Using database config: ${config.host}:${config.port}/${config.database}`)
  
  return config
}

// Create connection pool for better performance
const dbConfig = getDatabaseConfig()

const pool: Pool = mysql.createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Add SSL configuration for production (Railway requires SSL)
  ...(process.env.NODE_ENV === 'production'
    ? { ssl: { rejectUnauthorized: false } }
    : {})
})

// Test the connection
export async function testConnection(): Promise<boolean> {
  try {
    const connection: PoolConnection = await pool.getConnection()
    console.log('✅ Database connected successfully')
    console.log(`📍 Connected to: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`)
    connection.release()
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    console.error('🔧 Current config:', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      hasPassword: !!dbConfig.password
    })
    return false
  }
}

// Execute a query
export async function query<T extends RowDataPacket[] | ResultSetHeader>(
  sql: string, 
  params: any[] = []
): Promise<T> {
  try {
    const [results] = await pool.execute<T>(sql, params)
    return results
  } catch (error) {
    console.error('Database query error:', error)
    console.error('SQL:', sql)
    console.error('Params:', params)
    throw error
  }
}

// Execute multiple queries in a transaction
export async function transaction(queries: TransactionQuery[]): Promise<any[]> {
  const connection: PoolConnection = await pool.getConnection()
  
  try {
    await connection.beginTransaction()
    
    const results: any[] = []
    for (const { sql, params = [] } of queries) {
      const [result] = await connection.execute(sql, params)
      results.push(result)
    }
    
    await connection.commit()
    return results
  } catch (error) {
    await connection.rollback()
    console.error('Transaction failed, rolled back:', error)
    throw error
  } finally {
    connection.release()
  }
}

// Helper functions for common operations
export const db = {
  // Generic query method
  async query<T extends RowDataPacket[] | ResultSetHeader>(
    sql: string, 
    params: any[] = []
  ): Promise<T> {
    return await query<T>(sql, params)
  },

  // Select operations - returns array of records
  async select<T extends RowDataPacket>(
    table: string, 
    where: Record<string, any> = {}, 
    options: QueryOptions = {}
  ): Promise<T[]> {
    let sql = `SELECT * FROM ${table}`
    const params: any[] = []
    
    if (Object.keys(where).length > 0) {
      const conditions = Object.keys(where).map(key => {
        params.push(where[key])
        return `${key} = ?`
      })
      sql += ` WHERE ${conditions.join(' AND ')}`
    }
    
    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy}`
    }
    
    if (options.limit) {
      sql += ` LIMIT ${options.limit}`
    }
    
    return await query<T[]>(sql, params)
  },

  // Insert operation
  async insert(table: string, data: Record<string, any>): Promise<DatabaseResult> {
    const columns = Object.keys(data).join(', ')
    const placeholders = Object.keys(data).map(() => '?').join(', ')
    const values = Object.values(data)
    
    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`
    return await query<DatabaseResult>(sql, values)
  },

  // Update operation
  async update(
    table: string, 
    data: Record<string, any>, 
    where: Record<string, any>
  ): Promise<DatabaseResult> {
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ')
    const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ')
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`
    const params = [...Object.values(data), ...Object.values(where)]
    
    return await query<DatabaseResult>(sql, params)
  },

  // Delete operation
  async delete(table: string, where: Record<string, any>): Promise<DatabaseResult> {
    const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ')
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`
    const params = Object.values(where)
    
    return await query<DatabaseResult>(sql, params)
  },

  // Get single record
  async findOne<T extends RowDataPacket>(
    table: string, 
    where: Record<string, any> = {}
  ): Promise<T | null> {
    const results = await this.select<T>(table, where, { limit: 1 })
    return results[0] || null
  },

  // Count records
  async count(table: string, where: Record<string, any> = {}): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM ${table}`
    const params: any[] = []
    
    if (Object.keys(where).length > 0) {
      const conditions = Object.keys(where).map(key => {
        params.push(where[key])
        return `${key} = ?`
      })
      sql += ` WHERE ${conditions.join(' AND ')}`
    }
    
    interface CountResult extends RowDataPacket {
      count: number
    }
    
    const result = await query<CountResult[]>(sql, params)
    return result[0].count
  }
}

// Graceful shutdown
export async function closeConnection(): Promise<void> {
  await pool.end()
  console.log('Database connection pool closed')
}

// Export the pool for direct access if needed
export { pool }
export default db

// Optional: Define common database table interfaces
export interface User extends RowDataPacket {
  id: number
  email: string
  name?: string
  created_at: Date
  updated_at: Date
}

export interface Post extends RowDataPacket {
  id: number
  title: string
  content?: string
  published: boolean
  author_id: number
  created_at: Date
  updated_at: Date
}