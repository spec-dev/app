import netrc from 'netrc'
import { StringKeyMap } from './types'
import constants from './constants'

export function persistSession(email: string, token: string) {
    try {
        const entries = netrc()
        entries[getNetrcEntryId()] = {
            login: email,
            password: token,
        }
        netrc.save(entries)
    } catch (err) {
        throw `Error saving user session: ${err?.message || err}`
    }
}

export function deleteSession() {
    try {
        const entries = netrc()
        delete entries[getNetrcEntryId()]
        netrc.save(entries)
    } catch (err) {
        throw `Error deleting user session: ${err?.message || err}`
    }
}

export function getSession(): StringKeyMap {
    try {
        const entries = netrc()
        const session = entries[getNetrcEntryId()] || {}
        const { login, password } = session
        return { email: login, password }
    } catch (err) {
        throw `Error getting user session: ${err?.message || err}`
    }
}

export function getNetrcEntryId(): string {
    const url = new URL(constants.SPEC_API_ORIGIN + '/')
    return url.hostname
}
