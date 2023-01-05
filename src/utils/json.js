export const parse = (str, fallback = {}) => {
    try {
        return JSON.parse(str)
    } catch (err) {
        console.error(err)
        return fallback
    }
}

export const stringify = (data, fallback = '') => {
    try {
        return JSON.stringify(data)
    } catch (err) {
        console.error(err)
        return fallback
    }
}