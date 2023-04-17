import humps from 'humps'
import pluralize from 'pluralize'

const vowels = new Set(['a', 'e', 'i', 'o', 'u'])

export const noMod = val => val

export const camelToSnake = val => {
    val = val || ''

    let formattedVal = ''
    for (let i = 0; i < val.length; i++) {
        const [prevChar, char, nextChar] = [val[i - 1], val[i], val[i + 1]]
        const [prevCharIsUpperCase, charIsUpperCase, nextCharIsUpperCase] = [
            prevChar && prevChar === prevChar.toUpperCase(),
            char && char === char.toUpperCase(),
            nextChar && nextChar === nextChar.toUpperCase(),
        ]

        if (prevCharIsUpperCase && charIsUpperCase && (nextCharIsUpperCase || i === val.length - 1)) {
            formattedVal += char.toLowerCase()
        } else {
            formattedVal += char
        }
    }

    return humps.decamelize(formattedVal)
}

export const snakeToCamel = val => humps.camelize(val || '')

export const toNamespacedVersion = ({ nsp, name, version }) => `${nsp}.${name}@${version}`

export const withIndefiniteArticle = val => {
    const firstChar = ((val || '')[0] || '').toLowerCase()
    const startsWithVowel = vowels.has(firstChar)
    return startsWithVowel || val.toLowerCase().startsWith('nft') ? `an ${val}` : `a ${val}`
}

export const toSingular = word => pluralize(word, 1)

export const toPlural = word => pluralize(word, 2)

export function unique(arr) {
    return Array.from(new Set(arr))
}

export function toPostgresUrl(params) {
    const { user, password, host, port, name } = params || {}
    return `postgres://${user}:${password}@${host}:${port}/${name}`
}