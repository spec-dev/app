import { DEFAULT_SCHEMA_NAME } from './schema'

const keys = {
    CURRENT_PROJECT: 'currentProject',
    CURRENT_SCHEMA_NAME: 'currentSchemaName',
}

/**
 * Get/Set current project.
 */
export const getCurrentProject = () => getFromStorage(keys.CURRENT_PROJECT) || null
export const setCurrentProject = project => setToStorage(keys.CURRENT_PROJECT, project)

/**
 * Get/Set current schema name.
 */
export const getCurrentSchemaName = () => {
    const currentSchemaName = getFromStorage(keys.CURRENT_SCHEMA_NAME)
    if (currentSchemaName) return currentSchemaName
    setCurrentSchemaName(DEFAULT_SCHEMA_NAME)
    return DEFAULT_SCHEMA_NAME
}
export const setCurrentSchemaName = schemaName => setToStorage(keys.CURRENT_SCHEMA_NAME, schemaName) 

export function setToStorage(key, value) {
    let val
    try {
        val = JSON.stringify(value)
    } catch (e) {
        val = value
    }

    sessionStorage.setItem(key, val)
}

export function getFromStorage(key) {
    let item
    let data = sessionStorage.getItem(key)

    try {
        item = JSON.parse(data)
    } catch (e) {
        item = data
    }

    return item
}