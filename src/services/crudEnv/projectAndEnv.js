const fs = require('fs')
const toml = require('@ltd/j-toml')
const { constants } =  require('./constants')
const netrc = require('netrc')
const fetch = require('node-fetch')
const { routes } = require('./routes')
const path = require('path')

const createDir = (path) => fs.mkdirSync(path)

const createFileWithContents = (path, contents) =>
    fs.writeFileSync(path, contents)

const fileExists = (path) => fs.existsSync(path)

function readTomlConfigFile(path) {
    if (!fileExists(path)) {
        return { data: {} }
    }
    try {
        const data = toml.parse(fs.readFileSync(path, 'utf-8'))
        return { data }
    } catch (error) {
        return { error }
    }
}

function saveTomlConfigFile(path, table) {
    let error
    try {
        createFileWithContents(
            path,
            toml.stringify(table, { newlineAround: 'section', newline: '\n' })
        )
    } catch (err) {
        error = err
    }
    return { error }
}

function saveGlobalStateFile(table) {
    return saveTomlConfigFile(constants.SPEC_GLOBAL_STATE_PATH, table)
}

function readGlobalStateFile() {
    return readTomlConfigFile(constants.SPEC_GLOBAL_STATE_PATH)
}

function saveState(updates) {
    // Ensure spec global config directory exists.
    upsertSpecGlobalDir()

    // Get current global state.
    const { data, error } = readGlobalStateFile()
    if (error) return { error }

    // Apply and save updates.
    return saveGlobalStateFile({ ...data, ...updates })
}

function upsertSpecGlobalDir() {
    fileExists(constants.SPEC_GLOBAL_DIR) || createDir(constants.SPEC_GLOBAL_DIR)
}

async function useEnv(_, env) {
    /*
    TODO:
    ----
    1) Get the current project id from state.toml
    2) Resolve the full project from projects.toml
    3) Use the projects "location" to read connect.toml
    4) Validate the env exists in connect.toml before setting.
    */
    const { error: setEnvError } = saveState({ projectEnv: env })
    if (setEnvError) {
        console.error(setEnvError)
        return
    }

}

function readGlobalCredsFile() {
    return readTomlConfigFile(constants.SPEC_GLOBAL_CREDS_PATH)
}

function saveGlobalCredsFile(table) {
    saveTomlConfigFile(constants.SPEC_GLOBAL_CREDS_PATH, table)
}

const DEFAULT_PROJECT_ENV = 'local'

function saveProjectCreds(
    nsp,
    name,
    id,
    apiKey
) {
    // Ensure spec global config directory exists.
    upsertSpecGlobalDir()

    // Get current global creds.
    const { data, error } = readGlobalCredsFile()
    if (error) return { error }

    // Upsert project section within file.
    const creds = data || {}
    const projectPath = [nsp, name].join('/')
    creds[projectPath] = creds[projectPath] || toml.Section({})
    creds[projectPath].id = id
    creds[projectPath].apiKey = apiKey

    return saveGlobalCredsFile(creds)
}

function getCurrentProjectId() {
    const { data, error } = readGlobalStateFile()
    if (error) return { error }
    return { data: data?.projectId || null }
}

function repoPathToComponents(path) {
    const splitPath = path.split('/')
    return splitPath.length === 2 ? splitPath : null
}

function getNetrcEntryId() {
    const url = new URL(buildUrl(''))
    return url.hostname
}

function getSessionToken() {
    let token = null
    let error = null
    try {
        const entries = netrc()
        token = (entries[getNetrcEntryId()] || {}).password || null
    } catch (err) {
        error = err?.message || err
    }
    return { token, error }
}

async function get(
    url,
    args,
    headers = undefined,
    returnRawResponse = undefined
) {
    const params = new URLSearchParams()
    for (let key in args) {
        params.append(key, args[key])
    }

    let resp, err
    try {
        resp = await fetch(`${url}?${params.toString()}`, { headers })
    } catch (err) {
        err = err
    }
    if (err) return { error: err }

    if (returnRawResponse) {
        return { data: resp }
    }

    const { data, error } = await parseJSONResp(resp)
    if (error) return { error }

    return {
        data,
        headers: resp.headers,
    }
}

async function parseJSONResp(resp) {
    let data = {}
    try {
        data = await resp.json()
    } catch (err) {
        return { error: `Error parsing JSON response: ${err}.` }
    }
    if (data.error) {
        return { error: data.error }
    }
    if (resp.status !== 200) {
        return { error: `Request failed with status ${resp.status}.` }
    }
    return { data }
}

const formatAuthHeader = (sessionToken) => ({
    [constants.USER_AUTH_HEADER_NAME]: sessionToken,
})

function removeTrailingSlash(str) {
    return str.replace(/\/+$/, '')
}

const buildUrl = (route) => {
    return [removeTrailingSlash(constants.SPEC_API_ORIGIN), route].join('/')
}

async function getUserProjects() {
    const { token, error: tokenError } = getSessionToken()
    const { data, error: dataError } = await get(
        buildUrl(routes.GET_PROJECTS),
        null,
        formatAuthHeader(token)
    )

    if (dataError || tokenError) {
        return []
    } else {
        const mappedData = data.map(project => {
            return `${project?.namespace?.name}/${project?.slug}`
        })
        return mappedData
    }

}

async function getProject(
    namespace,
    project,
    sessionToken
) {
    // Perform link request.
    const { data, error } = await get(
        buildUrl(routes.GET_PROJECT),
        { namespace, project },
        formatAuthHeader(sessionToken)
    )
    if (error) return { error }

    // Return project info.
    return {
        id: data.id || '',
        name: data.slug || '',
        namespace: data.namespace?.name || '',
        apiKey: data.apiKey,
        metadata: data.metadata || {},
    }
}

function showProject() {
    // Get current project id.
    const { data: projectId, error } = getCurrentProjectId()
    if (error) {
        return
    }
    if (!projectId) {
        return
    }

    // Get project info from global spec creds file.
    const { data, error: infoError } = getProjectCreds(projectId)
    if (infoError) {
        return
    }
    if (!data?.path) {
        return
    }

    return data.path
}

function getCurrentProjectEnv() {
    const { data, error } = readGlobalStateFile()
    if (error) return { error }
    return { data: data?.projectEnv || null }
}

function showEnv() {
    const { data: env, error } = getCurrentProjectEnv()
    if (error) {
        return
    }

    return env
}

async function useProject(_, projectPath, logResult = true) {
    // Split input into namespace/project.
    const pathComps = repoPathToComponents(projectPath)
    if (!pathComps) {
        console.warn('Please specify the project in <namespace>/<project> format.')
        return
    }
    const [nsp, projectName] = pathComps


    // Get authed user's session token (if any).
    const { token, error } = getSessionToken()
    if (error) {
        console.error(error)
        return
    }
    if (!token) {
        console.error("Auth required")
        return
    }

    // Resolve user's project by nsp/name.
    const projectInfo = await getProject(nsp, projectName, token)
    const {
        id,
        name,
        namespace,
        apiKey,
        metadata,
    } = projectInfo
    if (projectInfo.error) {
        console.error(`Failed to resolve project ${projectPath}: ${projectInfo.error}`)
        return
    }
    if (!id || !name || !namespace || !apiKey) {
        console.error(
            `Failed to resolve project with ${projectPath}.\n
            Couldn't resolve all necessary project attributes:\n
            id=${id}\n
            name=${name}\n 
            namespace=${namespace}\n
            apiKey=${apiKey}`
        )
        return
    }

    // Save project id and api key to global creds file.
    const result = saveProjectCreds(namespace, name, id, apiKey)
    if (result && result.error) {
        console.error(result.error)
        return
    }

    // Set current project id in global state.
    const { error: setProjectIdError } = saveState({
        projectId: id,
        projectEnv: DEFAULT_PROJECT_ENV,
    })
    if (setProjectIdError) {
        console.error(setProjectIdError)
        return
    }

    return { id, metadata }
}

function toMap(obj) {
    const newObj = {}
    for (let key in obj) {
        newObj[key] = obj[key]
    }
    return newObj
}

function getProjectCreds(projectId){
    const { data, error } = readGlobalCredsFile()
    if (error) return { error }

    const creds = toMap(data || {})
    for (const key in creds) {
        const projectCreds = creds[key]
        if (projectCreds.id === projectId) {
            return { data: { ...projectCreds, path: key } }
        }
    }
    return { data: null }
}

function readGlobalProjectsFile() {
    return readTomlConfigFile(constants.SPEC_GLOBAL_PROJECTS_PATH)
}

function getDBConfig(projectDirPath, projectEnv) {
    const connectFilePath = path.join(
        projectDirPath,
        constants.SPEC_CONFIG_DIR_NAME,
        constants.CONNECTION_CONFIG_FILE_NAME
    )

    // Ensure connection config file exists.
    if (!fileExists(connectFilePath)) {
        return { error: null }
    }

    // Return config for given environment.
    try {
        const data = toml.parse(fs.readFileSync(connectFilePath, 'utf-8')) || {}
        return { data }
    } catch (error) {
        return { error }
    }
}

async function getCurrentProjectEnvs(_, projectPath) {
    if (!projectPath) {
        return;
    }
    const { data: stateData, error: stateError } = readGlobalStateFile()
    const { data: globalData, error: globalError } = readGlobalProjectsFile()
    if (globalError || stateError) {
        return []
    }
    const env = stateData?.projectEnv
    const location = globalData[projectPath].location
    const { data: dbData, error: dbError } = getDBConfig(location, env)
    if (dbError) {
        return []
    }
    return Object.keys(dbData) || []
}

module.exports = {
    useProject,
    useEnv,
    getUserProjects,
    getCurrentProjectEnvs,
    showProject,
    showEnv
}