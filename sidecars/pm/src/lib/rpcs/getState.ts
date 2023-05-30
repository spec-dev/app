import { readGlobalStateFile } from '../file'
import { toMap } from '../utils/formatters'
import { StringKeyMap } from '../types'

function getState(): StringKeyMap {
    return toMap(readGlobalStateFile() || {})
}

export default getState
