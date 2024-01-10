import { getSession } from '../auth'
import { StringKeyMap } from '../types'

function getAuthedUser(): StringKeyMap {
    return getSession()
}

export default getAuthedUser
