import humps from 'humps'

const vowels = new Set(['a', 'e', 'i', 'o', 'u'])

export const noMod = val => val

export const camelToSnake = val => humps.decamelize(val || '')

export const withIndefiniteArticle = val => {
    const firstChar = ((val || '')[0] || '').toLowerCase()
    const startsWithVowel = vowels.has(firstChar)
    return startsWithVowel || val.toLowerCase().startsWith('nft') ? `an ${val}` : `a ${val}`
}