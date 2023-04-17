






// import { fs, path, readFile } from '../tauri'
// // import toml, { Section } from '@ltd/j-toml'
// import constants from '../constants'
// import logger from './logger'
// import toml from '@tauri-apps/toml'
// // import { toMap } from '../utils/formatters'

// // export const fileExists = async path => await fs.exists(path, { dir: fs.BaseDirectory.Home })

// // export const createDir = (path) => fs.mkdirSync(path)

// export const homeFilePath = async (...args) => await path.join(await path.homeDir(), ...args)

// // export const createFileWithContents = (path: string, contents: any) =>
// //     fs.writeFileSync(path, contents)

// // export function saveProjectCreds(
// //     org: string,
// //     name: string,
// //     id: string,
// //     apiKey: string
// // ): StringKeyMap {
// //     // Ensure spec global config directory exists.
// //     upsertSpecGlobalDir()

// //     // Get current global creds.
// //     const { data, error } = readGlobalCredsFile()
// //     if (error) return { error }

// //     // Upsert project section within file.
// //     const creds = data || {}
// //     const projectPath = [org, name].join('/')
// //     creds[projectPath] = creds[projectPath] || Section({})
// //     creds[projectPath].id = id
// //     creds[projectPath].apiKey = apiKey

// //     return saveGlobalCredsFile(creds)
// // }

// // export function getProjectCreds(projectId: string): StringKeyMap {
// //     const { data, error } = readGlobalCredsFile()
// //     if (error) return { error }

// //     const creds = toMap(data || {})
// //     for (const key in creds) {
// //         const projectCreds = creds[key]
// //         if (projectCreds.id === projectId) {
// //             return { data: { ...projectCreds, path: key } }
// //         }
// //     }
// //     return { data: null }
// // }

// // export function getCurrentProjectId(): StringKeyMap {
// //     const { data, error } = readGlobalStateFile()
// //     if (error) return { error }
// //     return { data: data?.projectId || null }
// // }

// // export function setCurrentProjectId(projectId: string): StringKeyMap {
// //     return saveState({ projectId })
// // }

// // export function saveState(updates: StringKeyMap): StringKeyMap {
// //     // Ensure spec global config directory exists.
// //     upsertSpecGlobalDir()

// //     // Get current global state.
// //     const { data, error } = readGlobalStateFile()
// //     if (error) return { error }

// //     // Apply and save updates.
// //     return saveGlobalStateFile({ ...data, ...updates })
// // }

// // export function saveProjectInfo(
// //     org: string,
// //     name: string,
// //     id: string,
// //     updates: StringKeyMap
// // ): StringKeyMap {
// //     // Ensure spec global config directory exists.
// //     upsertSpecGlobalDir()

// //     // Get current global creds.
// //     const { data, error } = readGlobalProjectsFile()
// //     if (error) return { error }

// //     // Upsert project section within file.
// //     const projects = data || {}
// //     const projectPath = [org, name].join('/')
// //     projects[projectPath] = projects[projectPath] || Section({})
// //     projects[projectPath].id = id
// //     for (const key in updates || {}) {
// //         projects[projectPath][key] = updates[key]
// //     }

// //     return saveGlobalProjectsFile(projects)
// // }

// // export function setProjectLocation(org: string, name: string, id: string, path: string) {
// //     saveProjectInfo(org, name, id, { location: path })
// // }

// // export function upsertSpecGlobalDir() {
// //     fileExists(constants.SPEC_GLOBAL_DIR) || createDir(constants.SPEC_GLOBAL_DIR)
// // }

// // export function upsertSpecGlobalComposeDir() {
// //     fileExists(constants.SPEC_GLOBAL_COMPOSE_DIR) || createDir(constants.SPEC_GLOBAL_COMPOSE_DIR)
// // }

// // export function readGlobalCredsFile(): StringKeyMap {
// //     return readTomlConfigFile(constants.SPEC_GLOBAL_CREDS_PATH)
// // }

// // export function saveGlobalCredsFile(table: any): StringKeyMap {
// //     return saveTomlConfigFile(constants.SPEC_GLOBAL_CREDS_PATH, table)
// // }

// export async function readGlobalStateFile() {
//     return readTomlConfigFile(await homeFilePath(
//         constants.SPEC_CONFIG_DIR_NAME,
//         constants.SPEC_GLOBAL_STATE_FILE_NAME,
//     ))
// }

// // export function saveGlobalStateFile(table: any): StringKeyMap {
// //     return saveTomlConfigFile(constants.SPEC_GLOBAL_STATE_PATH, table)
// // }

// // export function readGlobalProjectsFile(): StringKeyMap {
// //     return readTomlConfigFile(constants.SPEC_GLOBAL_PROJECTS_PATH)
// // }

// // export function saveGlobalProjectsFile(table: any): StringKeyMap {
// //     return saveTomlConfigFile(constants.SPEC_GLOBAL_PROJECTS_PATH, table)
// // }

// export async function readTomlConfigFile(path) {
//     // if (!await fileExists(path)) return {}
//     try {
//         return toml.parse(await readFile(path))
//     } catch (err) {
//         logger.error(`Error reading toml config file at home path ${path}`, err)
//         return {}
//     }
// }

// // export function saveTomlConfigFile(path: string, table: any): StringKeyMap {
// //     let error
// //     try {
// //         createFileWithContents(
// //             path,
// //             toml.stringify(table, { newlineAround: 'section', newline: '\n' })
// //         )
// //     } catch (err) {
// //         error = err
// //     }
// //     return { error }
// // }

// // export function saveProjectComposeEnvs(projectId: string, envs: StringKeyMap): StringKeyMap {
// //     upsertSpecGlobalComposeDir()
// //     const envsFilePath = path.join(constants.SPEC_GLOBAL_COMPOSE_DIR, `${projectId}.env`)

// //     let contents = ''
// //     for (const key in envs) {
// //         contents += `${key}=${envs[key]}\n`
// //     }

// //     let error
// //     try {
// //         createFileWithContents(envsFilePath, contents)
// //     } catch (err) {
// //         error = `Error saving envs to path ${envsFilePath}: ${err}`
// //     }
// //     return { path: envsFilePath, error }
// // }