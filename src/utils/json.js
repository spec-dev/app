export const parse = str => {
    try {
        return JSON.parse(str)
    } catch (e) {
        console.log(e)
        return {}
    }
}

export const stringify = data => {
    try {
        return JSON.stringify(data)
    } catch (e) {
        console.log(e)
        return ''
    }
}