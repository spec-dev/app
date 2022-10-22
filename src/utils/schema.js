import api from './api'

export const DEFAULT_SCHEMA_NAME = 'public'

export const schemas = {}

export const getSchema = schemaName => schemas[schemaName] || null

export async function resolveSchema(schemaName) {
    const { data, ok } = await api.meta.tables({ schema: schemaName })
    if (ok) {
        schemas[schemaName] = data
    }
    return { data, ok }
}