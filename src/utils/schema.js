import listTables from '../services/listTables'

export const DEFAULT_SCHEMA_NAME = 'public'
export const SPEC_SCHEMA_NAME = 'spec'

export const specTableNames = {
    EVENT_CURSORS: 'event_cursors',
    LIVE_COLUMNS: 'live_columns',
    SEED_CURSORS: 'seed_cursors',
    TABLE_SUB_CURSORS: 'table_sub_cursors',
}

/*
TODO: Consolidate this shit elsewhere.
*/

export const schemas = {}

export const getSchema = schema => schemas[schema] || null

export async function resolveSchema(schema) {
    const { rows, error } = await listTables(schema)
    if (rows) {
        schemas[schema] = rows
    }
    return { rows, error }
}