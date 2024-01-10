import { StringKeyMap } from './types'
import path from 'path'
import os from 'os'

const constants: StringKeyMap = {
    SPEC_API_ORIGIN: 'https://api.spec.dev',

    // Spec project config.
    SPEC_CONFIG_DIR_NAME: '.spec',
    CONNECTION_CONFIG_FILE_NAME: 'connect.toml',
    PROJECT_CONFIG_FILE_NAME: 'project.toml',
    MIGRATIONS_DIR_NAME: 'migrations',
    HANDLERS_DIR_NAME: 'handlers',
    HOOKS_DIR_NAME: 'hooks',

    // Global CLI config.
    SPEC_GLOBAL_DIR: path.join(os.homedir(), '.spec'),
    SPEC_GLOBAL_STATE_FILE_NAME: 'state.toml',
    SPEC_GLOBAL_CREDS_FILE_NAME: 'creds.toml',
    SPEC_GLOBAL_PROJECTS_FILE_NAME: 'projects.toml',
}

constants.SPEC_GLOBAL_STATE_PATH = path.join(
    constants.SPEC_GLOBAL_DIR,
    constants.SPEC_GLOBAL_STATE_FILE_NAME
)
constants.SPEC_GLOBAL_CREDS_PATH = path.join(
    constants.SPEC_GLOBAL_DIR,
    constants.SPEC_GLOBAL_CREDS_FILE_NAME
)
constants.SPEC_GLOBAL_PROJECTS_PATH = path.join(
    constants.SPEC_GLOBAL_DIR,
    constants.SPEC_GLOBAL_PROJECTS_FILE_NAME
)

export default constants
