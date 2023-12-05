import fs from 'fs'
import path from 'path'
import { StringKeyMap } from './types'
import toml, { Section } from '@ltd/j-toml'
import constants from './constants'
import { toMap } from './utils/formatters'

// ============================================
//  HELPERS
// ============================================

export const fileExists = (path: string): boolean => fs.existsSync(path)

export const createDir = (path: string) => fs.mkdirSync(path)

export const createFileWithContents = (path: string, contents: any) =>
    fs.writeFileSync(path, contents)

export function readTomlConfigFile(path: string): StringKeyMap {
    if (!fileExists(path)) return {}
    return toml.parse(fs.readFileSync(path, 'utf-8'), { bigint: false, x: { comment: true } })
}

export function saveTomlConfigFile(path: string, table: any) {
    createFileWithContents(path, toml.stringify(table, { newlineAround: 'section', newline: '\n' }))
}

// ============================================
//  GLOBAL CONFIG
// ============================================

export function saveProjectCreds(org: string, name: string, id: string, apiKey: string) {
    // Ensure spec global config directory exists.
    upsertSpecGlobalDir()

    // Get current global creds.
    const data = readGlobalCredsFile()

    // Upsert project section within file.
    const creds = data || {}
    const projectPath = [org, name].join('/')
    creds[projectPath] = creds[projectPath] || Section({})
    creds[projectPath].id = id
    creds[projectPath].apiKey = apiKey

    saveGlobalCredsFile(creds)
}

export function getProjectCreds(projectId: string): StringKeyMap | null {
    const data = readGlobalCredsFile()
    const creds = toMap(data || {})
    for (const key in creds) {
        const projectCreds = creds[key]
        if (projectCreds.id === projectId) {
            const [org, name] = key.split('/')
            return { org, name, ...projectCreds }
        }
    }
    return null
}

export function getCurrentProjectId(): string | null {
    const data = readGlobalStateFile()
    return data?.projectId || null
}

export function setCurrentProjectId(projectId: string) {
    saveState({ projectId })
}

export function saveState(updates: StringKeyMap) {
    // Ensure spec global config directory exists.
    upsertSpecGlobalDir()

    // Get current global state.
    const data = readGlobalStateFile() || {}

    // Apply and save updates.
    saveGlobalStateFile({ ...data, ...updates })
}

export function saveProjectInfo(org: string, name: string, id: string, updates: StringKeyMap) {
    // Ensure spec global config directory exists.
    upsertSpecGlobalDir()

    // Get current global creds.
    const data = readGlobalProjectsFile()

    // Upsert project section within file.
    const projects = data || {}
    const projectPath = [org, name].join('/')
    projects[projectPath] = projects[projectPath] || Section({})
    projects[projectPath].id = id
    for (const key in updates || {}) {
        projects[projectPath][key] = updates[key]
    }

    saveGlobalProjectsFile(projects)
}

export function getProjectInfo(projectId: string): StringKeyMap | null {
    const data = readGlobalProjectsFile()
    const info = toMap(data || {})
    for (const key in info) {
        const projectInfo = info[key]
        if (projectInfo.id === projectId) {
            const [org, name] = key.split('/')
            return { org, name, ...projectInfo }
        }
    }
    return null
}

export function setProjectLocation(org: string, name: string, id: string, path: string) {
    saveProjectInfo(org, name, id, { location: path })
}

export function upsertSpecGlobalDir() {
    fileExists(constants.SPEC_GLOBAL_DIR) || createDir(constants.SPEC_GLOBAL_DIR)
}

export function upsertSpecGlobalComposeDir() {
    fileExists(constants.SPEC_GLOBAL_COMPOSE_DIR) || createDir(constants.SPEC_GLOBAL_COMPOSE_DIR)
}

export function readGlobalCredsFile(): StringKeyMap {
    return readTomlConfigFile(constants.SPEC_GLOBAL_CREDS_PATH)
}

export function saveGlobalCredsFile(table: any) {
    saveTomlConfigFile(constants.SPEC_GLOBAL_CREDS_PATH, table)
}

export function readGlobalStateFile(): StringKeyMap {
    return readTomlConfigFile(constants.SPEC_GLOBAL_STATE_PATH)
}

export function saveGlobalStateFile(table: any) {
    saveTomlConfigFile(constants.SPEC_GLOBAL_STATE_PATH, table)
}

export function readGlobalProjectsFile(): StringKeyMap {
    return readTomlConfigFile(constants.SPEC_GLOBAL_PROJECTS_PATH)
}

export function saveGlobalProjectsFile(table: any) {
    saveTomlConfigFile(constants.SPEC_GLOBAL_PROJECTS_PATH, table)
}

// ============================================
//  PROJECT CONFIG
// ============================================

const comments = {
    DATA_SOURCES_SECTION: '# = Data Sources -----------------------------',
    LIVE_TABLES_SECTION: '# = Live Tables ------------------------------',
    LINKS_SECTION: '# = Links & Filters --------------------------',
    DEFAULTS_SECTION: '# = Defaults ---------------------------------',
}

export function readProjectConfigFile(projectPath: string): StringKeyMap {
    return readTomlConfigFile(
        path.join(projectPath, constants.SPEC_CONFIG_DIR_NAME, constants.PROJECT_CONFIG_FILE_NAME)
    )
}

export function readProjectEnvsFile(projectPath: string): StringKeyMap {
    return readTomlConfigFile(
        path.join(
            projectPath,
            constants.SPEC_CONFIG_DIR_NAME,
            constants.CONNECTION_CONFIG_FILE_NAME
        )
    )
}

export function saveProjectConfigFile(projectPath: string, config: any): StringKeyMap {
    let error
    try {
        // Get stringified sections.
        const doc = toml.stringify(config, { newlineAround: 'section', newline: '\n' })
        const sections = doc.split('\n\n')

        const objectSections = []
        const liveColumnSections = []
        const linkSections = []
        const defaultSections = []
        const otherSections = []
        for (const section of sections) {
            const sectionHeader = section.split('\n').filter((s) => !!s)[0]

            // Object sections.
            if (sectionHeader.startsWith('[objects')) {
                objectSections.push(section)
                continue
            }

            // Live Columns section.
            if (sectionHeader.startsWith('[tables')) {
                liveColumnSections.push(section)
                continue
            }

            // Link sections.
            if (sectionHeader.startsWith('[[objects') && sectionHeader.endsWith('.links]]')) {
                linkSections.push(section)
                continue
            }

            // Defaults section.
            if (sectionHeader.startsWith('[defaults')) {
                defaultSections.push(section)
                continue
            }

            otherSections.push(section)
        }

        const newContents = [
            comments.DATA_SOURCES_SECTION,
            ...(objectSections.length ? objectSections.map((section) => '\n' + section) : ['']),
            '\n' + comments.LIVE_TABLES_SECTION,
            ...(liveColumnSections.length
                ? liveColumnSections.map((section) => '\n' + section)
                : ['']),
            '\n' + comments.LINKS_SECTION,
            ...(linkSections.length ? linkSections.map((section) => '\n' + section) : ['']),
        ]

        if (defaultSections.length) {
            newContents.push(
                ...[
                    '\n' + comments.DEFAULTS_SECTION,
                    ...defaultSections.map((section) => '\n' + section),
                ]
            )
        }

        newContents.push(...otherSections.map((section) => '\n' + section))
        const finalContents = newContents
            .join('\n')
            .replace(/(\n\n\n)/g, '\n\n')
            .trim()

        fs.writeFileSync(
            path.join(
                projectPath,
                constants.SPEC_CONFIG_DIR_NAME,
                constants.PROJECT_CONFIG_FILE_NAME
            ),
            finalContents
        )
    } catch (err) {
        error = err
    }
    return { error }
}
