import logger from '../utils/logger'
import { saveLatestMigration } from '../electronClient'
import { unique, sqlStatementsAsTx, toSingular } from '../utils/formatters'
import { newMigration } from '../utils/migrations'
import { pascalize } from 'humps'
import pm from '../managers/project/projectManager'
import {
    buildCreateTableMigration,
    buildAddPrimaryKeyMigration,
    buildForeignKeyMigration,
    buildCreateIndexMigration,
} from '../sql'

async function createTable(newTable) {
    // Extract new table details and constraints.
    const { schema: schemaName, name: tableName } = newTable
    const uniqueBy = newTable.uniqueBy || []
    const columns = newTable.columns || []
    const colNames = columns.map((c) => c.name)

    let error
    try {
        pm.ensureCurrentProjectLocationSet()

        // Validate given unique constraints (usually composite).
        validateUniqueBy(uniqueBy, colNames)

        // Get table constraints to be created.
        const { primaryKey, foreignKeys, indexes, uniqueConstraints } = resolveTableConstraints(
            uniqueBy,
            columns
        )

        // Build create table statement.
        const tableCreationMigrationSql = buildCreateTableMigration(
            schemaName,
            tableName,
            columns,
            uniqueConstraints[0] || [],
            buildSmartTableDesc(tableName, newTable.desc || null, uniqueConstraints[0]),
            false // as tx
        )

        // Build add primary key statement.
        const primaryKeyMigrationSql = buildAddPrimaryKeyMigration(
            schemaName,
            tableName,
            primaryKey, // array of column names
            false // as tx
        )

        // Build add foreign key statements.
        const foreignKeyMigrationSqlEntries = []
        for (const colName in foreignKeys) {
            const ref = foreignKeys[colName]
            foreignKeyMigrationSqlEntries.push(
                buildForeignKeyMigration(
                    schemaName,
                    tableName,
                    colName,
                    ref,
                    false // as tx
                )
            )
        }

        // Build create index statements.
        const createIndexMigrationSqlEntries = indexes.map((columns) =>
            buildCreateIndexMigration(
                schemaName,
                tableName,
                columns,
                false,
                false // as tx
            )
        )

        // Build create unique index statements.
        const createUniqueIndexMigrationSqlEntries = uniqueConstraints.map((columns) =>
            buildCreateIndexMigration(
                schemaName,
                tableName,
                columns,
                true, // unique
                false // as tx
            )
        )

        // Compile all up/down statements.
        const upStatements = [...tableCreationMigrationSql.up, ...primaryKeyMigrationSql.up]
        const downStatements = []

        for (const foreignKeyMigrationSql of foreignKeyMigrationSqlEntries) {
            upStatements.push(...foreignKeyMigrationSql.up)
            downStatements.push(...foreignKeyMigrationSql.down)
        }

        for (const createIndexMigrationSql of createIndexMigrationSqlEntries) {
            upStatements.push(...createIndexMigrationSql.up)
            downStatements.push(...createIndexMigrationSql.down)
        }

        for (const createUniqueIndexMigrationSql of createUniqueIndexMigrationSqlEntries) {
            upStatements.push(...createUniqueIndexMigrationSql.up)
            downStatements.push(...createUniqueIndexMigrationSql.down)
        }

        downStatements.push(...tableCreationMigrationSql.down)

        // Build new versioned migration.
        const migration = newMigration(
            `create_${tableName}`,
            sqlStatementsAsTx(upStatements),
            sqlStatementsAsTx(downStatements)
        )

        // Perform "up" query.
        ;({ error } = await pm.query(migration.up))

        // If the migration succeeded, save the new migration files (up & down)
        // and update the spec.migrations.version column in the DB.
        error = error || await saveLatestMigration(
            pm.currentProject.location,
            migration.name,
            migration.up,
            migration.down,
        )
    } catch (err) {
        error = err
    }

    error && logger.error(`Error creating table`, error)
    return { error: error || null }
}

function validateUniqueBy(uniqueBy, colNames) {
    if (!Array.isArray(uniqueBy)) {
        throw '"uniqueBy" must be an array of unique constraints'
    }
    if (!uniqueBy.length) return

    if (!colNames.length) {
        throw `Can't add unique constraints to a table with no columns`
    }

    const colNamesSet = new Set(colNames)

    for (const colGroup of uniqueBy) {
        if (!Array.isArray(colGroup)) {
            throw 'Each "uniqueBy" entry must be an array of column names'
        }
        if (!colGroup.length) {
            throw `unique constraint can't be empty`
        }
        if (unique(colGroup).length !== colGroup.length) {
            throw `unique constraint can't contain duplicate column names`
        }
        colGroup.forEach((colName) => {
            if (!colNamesSet.has(colName)) {
                throw `unique constraint references unknown column: ${colName}`
            }
        })
    }

    const uniqueConstraintIds = uniqueBy.map((colGroup) => colGroup.sort().join(':'))
    if (unique(uniqueConstraintIds).length !== uniqueConstraintIds.length) {
        throw `"uniqueBy" contains duplicates of the same unique constraints`
    }
}

function resolveTableConstraints(uniqueBy, columns) {
    const uniqueConstraints = uniqueBy
    const uniqueConstraintIds = new Set(
        uniqueConstraints.map((colGroup) => colGroup.sort().join(':'))
    )
    const indexes= []
    const primaryKey = []
    const foreignKeys = {}
    const numPrimaryKeyCols = columns.filter((c) => c.isPrimaryKey).length

    if (columns.length && !numPrimaryKeyCols) {
        throw 'primary key must be included in table creation'
    }

    for (const column of columns) {
        // Columns included in primary key.
        if (column.isPrimaryKey) {
            primaryKey.push(column.name)
        }

        // Add single-column unique constaints if they aren't already registered.
        if (column.isUnique && !uniqueConstraintIds.has(column.name)) {
            uniqueConstraintIds.add(column.name)
            uniqueConstraints.push([column.name])
        }

        // Add single-column indexes if not also a unique constraint or the sole primary key.
        if (
            column.isIndexed &&
            !uniqueConstraintIds.has(column.name) &&
            (!column.isPrimaryKey || numPrimaryKeyCols > 1)
        ) {
            indexes.push([column.name])
        }

        // Foreign keys.
        if (column.foreignKey) {
            foreignKeys[column.name] = column.foreignKey
        }
    }

    // Filter out the unique contraint if it's exactly the same as the primary key.
    const primaryKeyId = [...primaryKey].sort().join(':')
    const finalUniqueConstraints = []
    for (const colNames of uniqueConstraints) {
        const id = colNames.sort().join(':')
        if (id === primaryKeyId) continue
        finalUniqueConstraints.push(colNames)
    }

    return {
        primaryKey,
        foreignKeys,
        indexes,
        uniqueConstraints: finalUniqueConstraints,
    }
}

function buildSmartTableDesc(
    tableName,
    originalDesc,
    primaryUniqueConstraint,
) {
    if (!primaryUniqueConstraint?.length) return originalDesc
    return `@unique ${primaryUniqueConstraint.join(',')}|@fieldName get${toSingular(
        pascalize(tableName)
    )}|${originalDesc || ''}`
}

export default createTable