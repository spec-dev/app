import path from 'path'
import { setCurrentProject } from './cache'

// Global app config.
const config = {
    ENV: process.env.REACT_APP_ENV || 'local',

    // Project config file components.
    SPEC_CONFIG_DIR: path.resolve(process.env.REACT_APP_SPEC_CONFIG_DIR || '.spec'),
    PROJECT_CONFIG_FILE_NAME: 'project.toml',
    
    // Explicitly set project details.
    PROJECT_ID: process.env.REACT_APP_PROJECT_ID,
    PROJECT_ORG: process.env.REACT_APP_PROJECT_ORG,
    PROJECT_NAME: process.env.REACT_APP_PROJECT_NAME,

    RECORDS_PER_PAGE: parseInt(process.env.REACT_APP_RECORDS_PER_PAGE || 1000),
}
config.isLocal = () => config.ENV === 'local'

// Project config file path.
config.PROJECT_CONFIG_PATH = path.join(
    config.SPEC_CONFIG_DIR,
    config.PROJECT_CONFIG_FILE_NAME
)

// Store project details from config as current project if running locally.
if (config.isLocal() && config.PROJECT_ID) {
    setCurrentProject({
        id: config.PROJECT_ID,
        org: config.PROJECT_ORG,
        name: config.PROJECT_NAME,
    })
}

export default config