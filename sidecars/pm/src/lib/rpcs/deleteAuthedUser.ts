import { deleteSession } from '../auth'

function deleteAuthedUser() {
    deleteSession()
    return {}
}

export default deleteAuthedUser
