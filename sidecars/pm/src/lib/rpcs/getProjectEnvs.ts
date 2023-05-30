import { readProjectEnvsFile } from '../file'
import { toMap } from '../utils/formatters'
import { StringKeyMap } from '../types'

function getProjectEnvs(projectPath: string): StringKeyMap {
    return toMap(readProjectEnvsFile(projectPath) || {})
}

export default getProjectEnvs
