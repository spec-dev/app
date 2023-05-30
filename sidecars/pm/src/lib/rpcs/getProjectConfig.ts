import { readProjectConfigFile } from '../file'
import { toMap } from '../utils/formatters'
import { StringKeyMap } from '../types'

function getProjectConfig(projectPath: string): StringKeyMap {
    return toMap(readProjectConfigFile(projectPath) || {})
}

export default getProjectConfig
