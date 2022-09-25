export function setToStorage(key, value) {
    let val
    try {
        val = JSON.stringify(value)
    } catch (e) {
        val = value
    }

    sessionStorage.setItem(key, val)
}

export function getFromStorage(key) {
    let item
    let data = sessionStorage.getItem(key)

    try {
        item = JSON.parse(data)
    } catch (e) {
        item = data
    }

    return item
}