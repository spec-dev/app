import { getProjectCreds } from '../file'

function getProjectApiKey(projectId: string): string {
    const projectCreds = getProjectCreds(projectId)
    return projectCreds?.apiKey
}

export default getProjectApiKey
