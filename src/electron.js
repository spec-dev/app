const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { spawn } = require('child_process')
const appRootDir = require('app-root-dir')
const fsWatcher = require('chokidar')
const { 
    getProjectApiKey,
    getProjectConfig,
    getProjectEnvs,
    getProjects,
    getState,
    getHomeDir,
    saveLatestMigration,
    upsertLiveColumns,
} = require('@spec.dev/pm')
const {
    RealtimeClient,
    Pool,
    getPoolConnection,
    performQuery,
} = require('@spec.dev/app-db')

const { stringify, parse } = JSON

const platform = (() => {
    switch (os.platform()) {
        case 'aix':
        case 'freebsd':
        case 'linux':
        case 'openbsd':
        case 'android':
            return 'linux'
        case 'darwin':
        case 'sunos':
            return 'mac'
        case 'win32':
            return 'win'
    }
})()

const binDir = process.env.ENV === 'local' 
    ? path.join(process.cwd(), 'sidecars', 'bin', platform)
    : path.join(appRootDir.get(), 'bin')

const specClientPath = path.join(binDir, 'spec')

let mainWindow, pool, realtime, spec

const watchingFiles = new Set()

const events = {
    DATA_CHANGE: 'data:change',
    FILE_CHANGE: 'file:change',
}

const rpcNames = {
    GET_PROJECT_API_KEY: 'getProjectApiKey',
    GET_PROJECT_CONFIG: 'getProjectConfig',
    GET_PROJECT_ENVS: 'getProjectEnvs',
    GET_PROJECTS: 'getProjects',
    GET_STATE: 'getState',
    GET_HOME_DIR: 'getHomeDir',
    SAVE_LATEST_MIGRATION: 'saveLatestMigration',
    UPSERT_LIVE_COLUMNS: 'upsertLiveColumns',
}

const rpcs = {
    [rpcNames.GET_PROJECT_API_KEY]: getProjectApiKey,
    [rpcNames.GET_PROJECT_CONFIG]: getProjectConfig,
    [rpcNames.GET_PROJECT_ENVS]: getProjectEnvs,
    [rpcNames.GET_PROJECTS]: getProjects,
    [rpcNames.GET_STATE]: getState,
    [rpcNames.GET_HOME_DIR]: getHomeDir,
    [rpcNames.SAVE_LATEST_MIGRATION]: saveLatestMigration,
    [rpcNames.UPSERT_LIVE_COLUMNS]: upsertLiveColumns,
}

async function handleRpc(_, name, args) {
    const rpc = rpcs[name]
    if (!rpc) {
        return stringify({ error: `RPC not found "${name}"` })
    }
    try {
        const parsedArgs = parse(args) || []
        const data = await rpc(...parsedArgs)
        return stringify({ data })
    } catch (err) {
        return stringify({ error: err })
    }
}

async function teardownPool() {
    pool && await pool.end()
    pool = null
}

async function unsubscribeFromDatabase() {
    realtime && await realtime.close()
    realtime = null
}

function killSpecClient() {
    spec && spec.kill()
    spec = null
}

async function createNewPool(_, payload) {
    await teardownPool()

    let connParams
    try {
        connParams = parse(payload)
    } catch (err) {
        return stringify({ error: `Error parsing connection params ${connParams}: ${err}` })
    }
    try {
        pool = new Pool(connParams)
    } catch (err) {
        return stringify({ error: `Error creating pool ${connParams}: ${err}` })
    }
}

async function subscribeToDatabase(_, payload) {
    await unsubscribeFromDatabase()

    let connParams
    try {
        connParams = parse(payload)
    } catch (err) {
        return stringify({ error: `Realtime: Error parsing connection params ${connParams}: ${err}` })
    }
    try {
        realtime = new RealtimeClient((data) => {
            mainWindow.webContents.send(events.DATA_CHANGE, stringify(data))
        }, connParams)
        await realtime.listen()
    } catch (err) {
        return stringify({ error: `Error creating realtime client: ${err}` })
    }
}

async function query(_, sql) {
    if (!pool) {
        return stringify({ error: `Pool not created yet` })
    }

    const { conn, error: connError } = await getPoolConnection(pool)
    if (connError) {
        return stringify({ error: `Failed to acquire pool connection: ${connError}` })
    }

    const { data, error: queryError } = await performQuery(conn, sql)
    if (connError) {
        return stringify({ error: `Query failed: ${queryError}` })
    }

    return stringify({ data })
}

async function subscribeToPath(_, filePath, recursive) {
    if (watchingFiles.has(filePath)) return
    watchingFiles.add(filePath)

    try {
        fsWatcher.watch(filePath).on('change', (pathChanged) => {
            mainWindow.webContents.send(
                [events.FILE_CHANGE, filePath].join(':'),
                stringify({ filePath: pathChanged })
            )
        })
    } catch (err) {
        return stringify({ error: `Failed to subscribe to path ${filePath}: ${err}` })
    }
    return stringify({ error: null })
}

async function createSpecClient(_, payload) {
    killSpecClient()

    let parsed
    try {
        parsed = parse(payload)
    } catch (err) {
        return stringify({ error: `Create spec client - error parsing input ${payload}: ${err}` })
    }

    const {
        projectId,
        projectApiKey,
        projectConfigPath,
        dbParams = {},
    } = parsed

    const envs = {
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
    }

    try {
        spec = spawn(specClientPath, [], { env: { ...process.env, ...envs }, stdio: 'ignore' })
    } catch (err) {
        return stringify({ error: `Error spawning Spec client: ${err}` })
    }

    spec.on('close', () => {
        console.info(`Spec client closed for project ${projectId}.`)
    })
    spec.on('error', error => {
        console.error(`Spec client error ${error}`)
    })
}

function createWindow() {
    mainWindow = new BrowserWindow({
        titleBarStyle: 'hidden',
        height: 982,
        width: 1512,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })
    mainWindow.setWindowButtonVisibility(false)
    mainWindow.loadURL('http://localhost:3000')
}

app.whenReady().then(() => {
    ipcMain.handle('rpc', handleRpc)
    ipcMain.handle('newPool', createNewPool)
    ipcMain.handle('teardownPool', teardownPool)
    ipcMain.handle('subscribeToDatabase', subscribeToDatabase)
    ipcMain.handle('unsubscribeFromDatabase', unsubscribeFromDatabase)
    ipcMain.handle('subscribeToPath', subscribeToPath)
    ipcMain.handle('query', query)
    ipcMain.handle('createSpecClient', createSpecClient)
    ipcMain.handle('killSpecClient', killSpecClient)
    createWindow()
})

app.on('window-all-closed', () => {
    process.platform === 'darwin' || app.quit()
})

app.on('activate', () => {
    mainWindow || createWindow()
})

app.on('will-quit', killSpecClient)