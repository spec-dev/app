import RealtimeClient from './lib/realtimeClient'
import { Pool } from 'pg'

export async function getPoolConnection(pool) {
    let conn, error
    try {
        conn = await pool.connect()
    } catch (err) {
        conn && conn.release()
        error = err
    }
    return { conn, error }
}

export async function performQuery(conn, query) {
    let result, error
    try {
        await conn.query('BEGIN')
        result = await conn.query(query)
        await conn.query('COMMIT')
    } catch (err) {
        await conn.query('ROLLBACK')
        error = err
    } finally {
        conn.release()
    }
    return error ? { error } : { data: result?.rows || [] }
}

export { Pool, RealtimeClient }
