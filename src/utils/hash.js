import sha from 'sha.js'

export function hash(value) {
    return new sha.sha256().update(value).digest('hex')
}

export function hashObject(obj) {
    const keys = Object.keys(obj).sort()
    let s = ''
    for (const key of keys) {
        s += `${key}=${obj[key]}`
    }
    return hash(s)
}

export function areObjectsEquivalent(obj1, obj2) {
    return hashObject(obj1) === hashObject(obj2)
}