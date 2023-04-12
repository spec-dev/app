import { setCurrentProject } from './cache'

// Global app constants.
const constants = {
    ENV: process.env.REACT_APP_ENV || 'prod',
    
    // Explicitly set project details.
    PROJECT_ID: process.env.REACT_APP_PROJECT_ID || 'local',
    PROJECT_ORG: process.env.REACT_APP_PROJECT_ORG || 'local',
    PROJECT_NAME: process.env.REACT_APP_PROJECT_NAME || 'local',

    CORE_API_ORIGIN: process.env.REACT_APP_CORE_API_HOSTNAME || 'https://api.spec.dev',
    META_API_HOSTNAME: process.env.REACT_APP_META_API_HOSTNAME || 'localhost',
    META_API_PORT: parseInt(process.env.REACT_APP_META_API_PORT || 54322),

    RECORDS_PER_PAGE: parseInt(process.env.REACT_APP_RECORDS_PER_PAGE || 100),
}
constants.isLocal = () => constants.ENV === 'local'

// Store project details from constants as current project.
if (constants.PROJECT_ID) {
    setCurrentProject({
        id: constants.PROJECT_ID,
        org: constants.PROJECT_ORG,
        name: constants.PROJECT_NAME,
    })
}

export default constants