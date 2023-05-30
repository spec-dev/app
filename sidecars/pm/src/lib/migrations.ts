import { Migration } from './types'

export const newVersion = () => new Date(new Date().toUTCString()).getTime().toString()

export function newMigration(action: string, up: string, down: string): Migration {
    const version = newVersion()
    const name = [version, action].join('_')
    return { name, version, up, down }
}
