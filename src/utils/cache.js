import { DEFAULT_SCHEMA_NAME } from './schema'

const keys = {
    CURRENT_PROJECT: 'currentProject',
    CURRENT_SCHEMA_NAME: 'currentSchemaName',
    TABLES_SEEDED: 'tablesSeeded',
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

/**
 * Get/Set whether a table has been seeded before.
 */
export const hasTableBeenSeeded = (tableId) => {
    const tablesSeeded = getFromStorage(keys.TABLES_SEEDED, true) || {}
    return tablesSeeded[tableId.toString()] === true
}
export const markTableAsSeeded = (tableId) => {
    const tablesSeeded = getFromStorage(keys.TABLES_SEEDED) || {}
    tablesSeeded[tableId.toString()] = true
    setToStorage(keys.TABLES_SEEDED, tablesSeeded, true)
}

export function setToStorage(key, value, useLocalStorage = false) {
    let val
    try {
        val = JSON.stringify(value)
    } catch (e) {
        val = value
    }

    useLocalStorage 
        ? localStorage.setItem(key, val) 
        : sessionStorage.setItem(key, val)
}

export function getFromStorage(key, useLocalStorage = false) {
    let item
    let data = useLocalStorage 
        ? localStorage.getItem(key) 
        : sessionStorage.getItem(key)

    try {
        item = JSON.parse(data)
    } catch (e) {
        item = data
    }

    return item
}