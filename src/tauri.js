import logger from './utils/logger'
import Database from 'tauri-plugin-sql-api'
import { parse } from './utils/json'
import { watch } from 'tauri-plugin-fs-watch-api'
import { listen, TauriEvent } from '@tauri-apps/api/event'
import { stringify } from './utils/json'
const { path, shell } = window.__TAURI__ || {}
const { Command } = shell

// Spawned child processes.
const children = []
listen(TauriEvent.WINDOW_DESTROYED, async () => {
    try {
        await Promise.all(children.filter(c => !!c).map(c => c.kill()))
    } catch (err) {}
})

export const sidecars = {
    SPEC: 'bin/spec-client', // Spec client
    DB: 'bin/db',            // DB queries and realtime subscriptions
    PM: 'bin/pm',            // Project manager / filesystem interactions
}

export const pmFunctions = {
    GET_PROJECT_API_KEY: 'getProjectApiKey',
    GET_PROJECT_CONFIG: 'getProjectConfig',
    GET_PROJECT_ENVS: 'getProjectEnvs',
    GET_PROJECTS: 'getProjects',
    GET_STATE: 'getState',
    SAVE_LATEST_MIGRATION: 'saveLatestMigration',
    UPSERT_LIVE_COLUMNS: 'upsertLiveColumns',
}

export async function newSpecClient(
    projectId, 
    projectApiKey, 
    projectConfigPath,
    dbParams,
) {
    const cmd = Command.sidecar(sidecars.SPEC, [], { env: {
        SPEC_CONFIG_DIR: projectConfigPath,
        DB_USER: dbParams.user,
        DB_PASSWORD: dbParams.password,
        DB_HOST: dbParams.host,
        DB_PORT: dbParams.port ? dbParams.port.toString() : dbParams.port,
        DB_NAME: dbParams.name,
        PROJECT_ID: projectId,
        PROJECT_API_KEY: projectApiKey,
        STREAM_LOGS: 'local',
        FORCE_COLOR: 'true',
        DEBUG: 'true',
    }})

    cmd.on('close', data => {
        logger.info(`Spec client finished with code ${data.code} and signal ${data.signal}`)
    })
    cmd.on('error', error => {
        logger.error(`Spec client error`, error)
    })
    cmd.stderr.on('data', error => {
        logger.error(`Spec client stderr`, error)
    })

    const child = await cmd.spawn()
    children.push(child)

    return child
}

export async function getDatabaseConnection(connParams, cb) {
    const { user, password, host, port, name } = connParams || {}

    const cmd = Command.sidecar(sidecars.DB, [], { env: {
        DB_USER: user,
        DB_PASSWORD: password,
        DB_HOST: host,
        DB_PORT: port ? port.toString() : port,
        DB_NAME: name,
    }})

    cmd.on('close', data => {
        logger.info(`DB subscription finished with code ${data.code} and signal ${data.signal}`)
    })
    cmd.on('error', error => {
        logger.error(`DB subscription error`, error)
    })
    cmd.stderr.on('data', error => {
        logger.error(`DB subscription stderr`, error)
    })
    cmd.stdout.on('data', data => cb(parse(data)))

    const child = await cmd.spawn()
    children.push(child)

    return child
}

export async function subscribeToFile(path, recursive, cb) {
    try {
        return watch(path, { recursive: recursive || false, delayMs: 50 }, cb)
    } catch (err) {
        logger.error(`Error subscribing to file ${path}`, err)
        return null
    }
}

export async function getProjects() {
    const { data, error } = await callPMFunction(pmFunctions.GET_PROJECTS)
    if (error) {
        // TODO
        return {}
    }
    return data || {}
}

export async function getState() {
    const { data: state, error } = await callPMFunction(pmFunctions.GET_STATE)
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
    const { data, error } = await callPMFunction(pmFunctions.GET_PROJECT_API_KEY, projectId)
    if (error) {
        // TODO
        return null
    }
    return data
}

export async function getProjectConfig(projectPath) {
    const { data, error } = await callPMFunction(pmFunctions.GET_PROJECT_CONFIG, projectPath)
    if (error) {
        // TODO
        return {}
    }
    return data || {}
}

export async function getProjectEnvs(projectPath) {
    const { data, error } = await callPMFunction(pmFunctions.GET_PROJECT_ENVS, projectPath)
    if (error) {
        // TODO
        return {}
    }
    return data || {}
}

export async function saveLatestMigration(projectPath, name, up, down) {
    const { error } = await callPMFunction(
        pmFunctions.SAVE_LATEST_MIGRATION, 
        projectPath, 
        name,
        up, 
        down,
    )
    return error || null
}

export async function upsertLiveColumns(projectPath, data) {
    const { error } = await callPMFunction(
        pmFunctions.UPSERT_LIVE_COLUMNS, 
        projectPath, 
        stringify(data),
    )
    return error || null
}

export async function callPMFunction(rpcName, ...args) {
    const command = Command.sidecar(sidecars.PM, [
        rpcName,
        ...(args || []),
    ])
    try {
        const { stdout, stderr } = await command.execute()
        if (stderr) throw stderr
        return { data: parse(stdout || '{}', {}).data }
    } catch (err) {
        logger.error(`Error calling ${rpcName} function: ${err}`)
        return { error: err }
    }
}

export { Database, path }