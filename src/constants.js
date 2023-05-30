import path from 'path'
import { getHomeDir } from './electronClient'

let homeDir = null

/**
 * Global app constants.
 */
const constants = {
    CORE_API_ORIGIN: 'https://api.spec.dev',
    RECORDS_PER_PAGE: 100,

    // Spec project config.
    SPEC_CONFIG_DIR_NAME: '.spec',
    CONNECTION_CONFIG_FILE_NAME: 'connect.toml',
    PROJECT_CONFIG_FILE_NAME: 'project.toml',
    MIGRATIONS_DIR_NAME: 'migrations',
    HANDLERS_DIR_NAME: 'handlers',
    HOOKS_DIR_NAME: 'hooks',

    // Global CLI config.
    SPEC_GLOBAL_STATE_FILE_NAME: 'state.toml',
    SPEC_GLOBAL_CREDS_FILE_NAME: 'creds.toml',
    SPEC_GLOBAL_PROJECTS_FILE_NAME: 'projects.toml',

    // Spec API config.
    USER_AUTH_HEADER_NAME: 'Spec-User-Auth-Token',

    // Default DB config.
    SPEC_CLIENT_DB_USER: 'spec',

    DEFAULT_DB_USER: 'postgres',
    DEFAULT_DB_PASSWORD: '',
    DEFAULT_DB_HOST: 'localhost',
    DEFAULT_DB_PORT: 5432,
    DEFAULT_DB_NAME: 'postgres',

    globalStatePath: async () => {
        homeDir = homeDir || await getHomeDir()
        return path.join(
            homeDir,
            constants.SPEC_CONFIG_DIR_NAME,
            constants.SPEC_GLOBAL_STATE_FILE_NAME,
        )
    },

    globalProjectsPath: async () => {
        homeDir = homeDir || await getHomeDir()
        
        return path.join(
            homeDir,
            constants.SPEC_CONFIG_DIR_NAME,
            constants.SPEC_GLOBAL_PROJECTS_FILE_NAME,
        )
    }
}

export default constants