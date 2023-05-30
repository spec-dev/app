import { readGlobalProjectsFile } from '../file'
import { toMap } from '../utils/formatters'
import { StringKeyMap } from '../types'

function getProjects(): StringKeyMap {
    return toMap(readGlobalProjectsFile() || {})
}

export default getProjects
