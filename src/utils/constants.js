import { setCurrentProject } from './cache'

// Global app constants.
const constants = {
    ENV: process.env.REACT_APP_ENV || 'local',
    
    // Explicitly set project details.
    PROJECT_ID: process.env.REACT_APP_PROJECT_ID,
    PROJECT_ORG: process.env.REACT_APP_PROJECT_ORG,
    PROJECT_NAME: process.env.REACT_APP_PROJECT_NAME,

    RECORDS_PER_PAGE: parseInt(process.env.REACT_APP_RECORDS_PER_PAGE || 100),
}
constants.isLocal = () => constants.ENV === 'local'

// Store project details from constants as current project if running locally.
if (constants.isLocal() && constants.PROJECT_ID) {
    setCurrentProject({
        id: constants.PROJECT_ID,
        org: constants.PROJECT_ORG,
        name: constants.PROJECT_NAME,
    })
}

export default constants