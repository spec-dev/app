export const stripTrailingSlash = val => {
    while (val.endsWith('/')) {
        val = val.slice(0, val.length - 1)
    }

    return val
}

export const s3 = filePath => (
    `https://dbjzhg7yxqn0y.cloudfront.net/v1/${filePath}`
)