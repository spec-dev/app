import { parse, stringify } from './utils/json'

const watchingFiles = new Set()

const events = {
    DATA_CHANGE: 'data:change',
    FILE_CHANGE: 'file:change',
}

const pmFunctions = {
    GET_PROJECT_API_KEY: 'getProjectApiKey',
    GET_PROJECT_CONFIG: 'getProjectConfig',
    GET_PROJECT_ENVS: 'getProjectEnvs',
    GET_PROJECTS: 'getProjects',
    GET_STATE: 'getState',
    GET_HOME_DIR: 'getHomeDir',
    SAVE_LATEST_MIGRATION: 'saveLatestMigration',
    UPSERT_LIVE_COLUMNS: 'upsertLiveColumns',
}

export async function createSpecClient(
    projectId, 
    projectApiKey, 
    projectConfigPath,
    dbParams,
) {
    try {
        const resp = await window.electronAPI.createSpecClient(stringify({
            projectId,
            projectApiKey,
            projectConfigPath,
            dbParams,
        }))
        const { error } = resp ? parse(resp) : {}
        if (error) throw error
        return true
    } catch (err) {
        await window.electronAPI.send('sidecar-error', `Error creating Spec client (${projectId}): ${err}`)
        return false
    }
}

export async function killSpecClient() {
    try {
        await window.electronAPI.killSpecClient()
    } catch (err) {
        await window.electronAPI.send('sidecar-error', `Error killing Spec client: ${err}`)
    }
}

export async function createDatabasePool(connParams) {
    const { user, password, host, port, name: database } = connParams || {}

    try {
        const resp = await window.electronAPI.newPool(stringify({
            user, 
            password, 
            host,
            port,
            database,
        }))
        const { error } = resp ? parse(resp) : {}
        if (error) throw error
        return true
    } catch (err) {
        await window.electronAPI.send('sidecar-error', `Error creating new DB pool ${connParams}: ${err}`)
        return false
    }
}

export async function teardownDatabasePool() {
    try {
        await window.electronAPI.teardownPool()
    } catch (err) {
        await window.electronAPI.send('sidecar-error', `Error tearing down DB pool: ${err}`)
    }
}

export async function subscribeToDatabase(connParams, handleEvents) {
    const { user, password, host, port, name: database } = connParams || {}

    try {
        const resp = await window.electronAPI.subscribeToDatabase(stringify({
            user, 
            password, 
            host,
            port,
            database,
        }))
        const { error } = resp ? parse(resp) : {}
        if (error) throw error

        window.electronAPI.on(events.DATA_CHANGE, (_, message) => {
            const payload = parse(message)
            console.log('got message', payload)
            handleEvents && handleEvents(payload?.events || [])
        })

        return true
    } catch (err) {
        await window.electronAPI.send('sidecar-error', `Error subscribing to database ${connParams}: ${err}`)
        return false
    }
}

export async function unsubscribeFromDatabase() {
    try {
        await Promise.all([
            window.electronAPI.unsubscribeFromDatabase(),
            window.electronAPI.off(events.DATA_CHANGE),
        ])
    } catch (err) {
        await window.electronAPI.send('sidecar-error', `Error unsubscribing from DB: ${err}`)
    }
}

export async function query(sql) {
    try {
        const resp = await window.electronAPI.query(sql)
        const { data, error } = resp ? parse(resp) : {}
        if (error) throw error
        return { rows: data || [] }
    } catch (err) {
        await window.electronAPI.send('sidecar-error', `Error performing query: ${err}`)
        return { error: err }
    }
}

export async function subscribeToPath(filePath, recursive, onChange) {
    if (watchingFiles.has(filePath)) return
    watchingFiles.add(filePath)

    try {
        const resp = await window.electronAPI.subscribeToPath(filePath, recursive)
        const { error } = resp ? parse(resp) : {}
        if (error) throw error

        window.electronAPI.on([events.FILE_CHANGE, filePath].join(':'), (_, message) => {
            const payload = parse(message)
            onChange && onChange(payload)
        })
    } catch (err) {
        await window.electronAPI.send('sidecar-error', `Error subscribing to path ${filePath}: ${err}`)
    }
}

export async function getProjects() {
    const { data, error } = await callRpc(pmFunctions.GET_PROJECTS)
    if (error) {
        // TODO
        return {}
    }
    return data || {}
}

export async function getState() {
    const { data: state, error } = await callRpc(pmFunctions.GET_STATE)
    if (error) {
        // TODO
        return {}
    }

    if (state && !state.projectEnv) {
        state.projectEnv = 'local'
    }
    return state || {}
}

export async function getProjectApiKey(projectId) {
    const { data, error } = await callRpc(pmFunctions.GET_PROJECT_API_KEY, projectId)
    if (error) {
        // TODO
        return null
    }
    return data
}

export async function getProjectConfig(projectPath) {
    const { data, error } = await callRpc(pmFunctions.GET_PROJECT_CONFIG, projectPath)
    if (error) {
        // TODO
        return {}
    }
    return data || {}
}

export async function getProjectEnvs(projectPath) {
    const { data, error } = await callRpc(pmFunctions.GET_PROJECT_ENVS, projectPath)
    if (error) {
        // TODO
        return {}
    }
    return data || {}
}

export async function getHomeDir() {
    const { data, error } = await callRpc(pmFunctions.GET_HOME_DIR)
    if (error) {
        // TODO
        return null
    }
    return data
}

export async function saveLatestMigration(projectPath, name, up, down) {
    const { error } = await callRpc(
        pmFunctions.SAVE_LATEST_MIGRATION, 
        projectPath, 
        name,
        up, 
        down,
    )
    return error || null
}

export async function upsertLiveColumns(projectPath, data) {
    const { error } = await callRpc(
        pmFunctions.UPSERT_LIVE_COLUMNS, 
        projectPath, 
        data,
    )
    return error || null
}

export async function callRpc(rpcName, ...args) {
    try {
        const resp = await window.electronAPI.rpc(rpcName, stringify(args))
        return resp ? parse(resp) : {}
    } catch (err) {
        await window.electronAPI?.send('sidecar-error', `Error calling ${rpcName} function: ${err}`)
        return { error: err }
    }
}