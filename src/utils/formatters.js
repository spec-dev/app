import humps from 'humps'

const vowels = new Set(['a', 'e', 'i', 'o', 'u'])

export const noMod = val => val

export const camelToSnake = val => humps.decamelize(val || '')

export const withIndefiniteArticle = val => {
    const firstChar = ((val || '')[0] || '').toLowerCase()
    const startsWithVowel = vowels.has(firstChar)
    return startsWithVowel || val.toLowerCase().startsWith('nft') ? `an ${val}` : `a ${val}`
}

export function splitLivePropertyIntoComps(liveProperty) {
    const [left, right] = liveProperty.split('@')
    const [namespace, name] = left.split('.')
    const [version, property] = right.split(':')
    return {
        id: liveProperty,
        namespace,
        name,
        version,
        property,
    }
}

export function abbrevColType(colType) {
    if (colType === 'character varying') {
        return 'varchar'
    }
    if (colType === 'bigint') {
        return 'int8'
    }
    if (colType === 'integer') {
        return 'int'
    }
    return colType
}