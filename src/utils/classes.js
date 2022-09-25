export const cn = (...classes) => classes
    .filter(c => !([ undefined, null, '' ].includes(c)))
    .join(' ')

export const getPrefixer = pre => {
    return str => `${pre}${str || ''}`
}

export const getPCN = pre => {
    return (...classes) => classes
        .filter(c => !([ undefined, null, '' ].includes(c)))
        .map(c => `${pre}${c}`)
        .join(' ')
}