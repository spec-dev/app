import constants from '../constants'
import { createDir, createFileWithContents, fileExists } from '../file'
import path from 'path'

const UP = 'up.sql'
const DOWN = 'down.sql'

function saveLatestMigration(projectPath: string, name: string, up: string, down: string) {
    const migrationsDirPath = path.join(
        projectPath,
        constants.SPEC_CONFIG_DIR_NAME,
        constants.MIGRATIONS_DIR_NAME
    )

    // Upsert migrations directory.
    fileExists(migrationsDirPath) || createDir(migrationsDirPath)

    // Create versioned migration directory.
    const versionDir = path.join(migrationsDirPath, name)
    createDir(versionDir)

    // Create up/down migration files for this version.
    createFileWithContents(path.join(versionDir, UP), up)
    createFileWithContents(path.join(versionDir, DOWN), down)
}

export default saveLatestMigration
