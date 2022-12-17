export const getRandom = (min, max) => {
    return Math.random() * (max - min) + min
}

export const range = (min, max) => Array.from({ length: max - min + 1 }, (_, i) => min + i)

export const sum = (arr = []) => {
    let total = 0
    arr.forEach(item => { total += item })
    return total
}