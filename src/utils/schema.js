import api from './api'

export const DEFAULT_SCHEMA_NAME = 'public'
export const SPEC_SCHEMA_NAME = 'spec'

export const specTableNames = {
    EVENT_CURSORS: 'event_cursors',
    LIVE_COLUMNS: 'live_columns',
    SEED_CURSORS: 'seed_cursors',
    TABLE_SUB_CURSORS: 'table_sub_cursors',
}

export const schemas = {}

export const getSchema = schemaName => schemas[schemaName] || null

export async function resolveSchema(schemaName) {
    const { data, ok } = await api.meta.tables({ schema: schemaName })
    if (ok) {
        schemas[schemaName] = data
    }
    return { data, ok }
}