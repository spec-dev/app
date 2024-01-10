import { persistSession } from '../auth'

function saveAuthedUser(email: string, token: string) {
    persistSession(email, token)
    return {}
}

export default saveAuthedUser
