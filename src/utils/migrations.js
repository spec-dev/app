export const newVersion = () => new Date(new Date().toUTCString()).getTime().toString()

export function newMigration(action, up, down) {
    const version = newVersion()
    const name = [version, action].join('_')
    return { name, version, up, down }
}