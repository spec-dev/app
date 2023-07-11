export const ev = (name, fallback = null) =>
    process.env.hasOwnProperty(name) ? process.env[name] : fallback
