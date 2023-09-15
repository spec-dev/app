import { AnyMap } from '../types'

export function removeTrailingSlash(str: string): string {
    return str.replace(/\/+$/, '')
}

export function repoPathToComponents(path: string): string[] | null {
    const splitPath = path.split('/')
    return splitPath.length === 2 ? splitPath : null
}

export function toMap(obj): AnyMap {
    const newObj = {}
    for (let key in obj) {
        newObj[key] = obj[key]
    }
    return newObj
}

export const toNamespacedVersion = (nsp: string, name: string, version: string) =>
    `${nsp}.${name}@${version}`

export const fromNamespacedVersion = (
    namespacedVersion: string
): {
    nsp: string
    name: string
    version: string
} => {
    const atSplit = (namespacedVersion || '').split('@')
    if (atSplit.length !== 2) {
        return { nsp: '', name: '', version: '' }
    }

    const [nspName, version] = atSplit
    const dotSplit = (nspName || '').split('.')
    if (dotSplit.length < 2) {
        return { nsp: '', name: '', version: '' }
    }

    const name = dotSplit.pop() || ''
    const nsp = dotSplit.join('.')

    return { nsp, name, version }
}

export function unique(arr: any[]): any[] {
    return Array.from(new Set(arr))
}

export const capitalize = (val: string): string => {
    if (!val) return ''
    return val.charAt(0).toUpperCase() + val.slice(1)
}

export const nspToCamel = (nsp: string): string => {
    if (!nsp) return ''
    let comps = nsp.split('.')

    // Regular top-level namespace.
    if (comps.length === 1) return capitalize(nsp)

    // Contract namespace.
    comps = comps.filter((val, i) => i !== 1)

    const [chain, customerNsp, contractGroup] = comps

    return `${capitalize(chain)}${capitalize(customerNsp)}${contractGroup}`
}
