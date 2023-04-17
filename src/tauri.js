import logger from './utils/logger'
import Database from 'tauri-plugin-sql-api'
import { parse } from './utils/json'
import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'
import { appWindow } from '@tauri-apps/api/window'
import { watch } from 'tauri-plugin-fs-watch-api'
const { path, shell } = window.__TAURI__
const { Command } = shell

export const sidecars = {
    PM: 'bin/pm'
}

export const pmFunctions = {
    SAVE_LATEST_MIGRATION: 'saveLatestMigration',
    GET_PROJECTS: 'getProjects',
    GET_STATE: 'getState',
    GET_PROJECT_CONFIG: 'getProjectConfig',
    GET_PROJECT_ENVS: 'getProjectEnvs',
}

export const events = {
    DATA_CHANGE: 'data:change',
    FILE_CHANGE: 'file:change',
}

export const rustFunctions = {
    NEW_SPEC_CLIENT: 'new_spec_client',
    SUBSCRIBE_TO_DATABASE: 'listen',
    SUBSCRIBE_TO_FILE: 'watch',
}

export async function newSpecClient(projectConfig) {
    await callRustFunction(rustFunctions.NEW_SPEC_CLIENT, projectConfig)
}

export async function subscribeToDatabase(url, cb) {
    const unsubscribe = await appWindow.listen(events.DATA_CHANGE, (event) => {
        cb(parse(event?.payload?.message, {}))
    })
    const promise = callRustFunction(rustFunctions.SUBSCRIBE_TO_DATABASE, { url })
    return [unsubscribe, promise]
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
    return callPMFunction(pmFunctions.GET_PROJECTS)
}

export async function getState() {
    return callPMFunction(pmFunctions.GET_STATE)
}

export async function getProjectConfig(projectPath) {
    return callPMFunction(pmFunctions.GET_PROJECT_CONFIG, projectPath)
}

export async function getProjectEnvs(projectPath) {
    return callPMFunction(pmFunctions.GET_PROJECT_ENVS, projectPath)
}

export async function callPMFunction(rpcName, ...args) {
    const command = Command.sidecar(sidecars.PM, [
        rpcName,
        ...(args || []),
    ])
    try {
        const { stdout } = await command.execute()
        return parse(stdout || '{}', {}).data
    } catch (err) {
        logger.error(`Error calling ${rpcName} function: ${err}`)
        return null
    }
}

export async function callRustFunction(rpcName, args) {
    try {
        return invoke(rpcName, args || {})
    } catch (err) {
        logger.error(`Error calling ${rpcName} function: ${err}`)
        return null
    }
}

export { Database, path }