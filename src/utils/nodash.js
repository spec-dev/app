export const noop = () => {}

export const has = (m, k) => m.hasOwnProperty(k)

export const vals = Object.values

export const keys = Object.keys

export const unique = values => Array.from(new Set(values))