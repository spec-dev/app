import logger from '../utils/logger'
import { saveLatestMigration } from '../electronClient'
import { sqlStatementsAsTx } from '../utils/formatters'
import { newMigration } from '../utils/migrations'
import pm from '../managers/project/projectManager'
import {
    buildAddColumnMigration,
    buildForeignKeyMigration,
    buildCreateIndexMigration,
} from '../sql'

async function addColumns(
    schema,
    table,
    columns,
) {
    if (!columns.length) return { error: 'No columns to create' }

    let error
    try {
        // Get the constraints that need creation on the new columns.
        const { foreignKeys, indexes, uniqueConstraints } = resolveNewColumnConstraints(columns)

        // Build add column statements.
        const addColumnMigrationSqlEntries = columns.map((column) =>
            buildAddColumnMigration(
                schema,
                table,
                column,
                false // as tx
            )
        )

        // Build add foreign key statements.
        const foreignKeyMigrationSqlEntries = []
        for (const colName in foreignKeys) {
            const ref = foreignKeys[colName]
            foreignKeyMigrationSqlEntries.push(
                buildForeignKeyMigration(
                    schema,
                    table,
                    colName,
                    ref,
                    false // as tx
                )
            )
        }

        // Build create index statements.
        const createIndexMigrationSqlEntries = indexes.map((columns) =>
            buildCreateIndexMigration(
                schema,
                table,
                columns,
                false,
                false // as tx
            )
        )

        // Build create unique index statements.
        const createUniqueIndexMigrationSqlEntries = uniqueConstraints.map((columns) =>
            buildCreateIndexMigration(
                schema,
                table,
                columns,
                true, // unique
                false // as tx
            )
        )

        // Compile all up/down statements.
        const upStatements = []
        const downStatements = []

        for (const addColumnMigrationSql of addColumnMigrationSqlEntries) {
            upStatements.push(...addColumnMigrationSql.up)
        }

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

        for (const addColumnMigrationSql of addColumnMigrationSqlEntries) {
            downStatements.push(...addColumnMigrationSql.down)
        }

        // Build new versioned migration.
        const migration = newMigration(
            `add_${table}_columns`,
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

    error && logger.error(`Error adding columns to ${schema}.${table} ${error}`)
    return { error }
}

function resolveNewColumnConstraints(columns) {
    const uniqueConstraints = []
    const uniqueConstraintIds = new Set()
    const indexes = []
    const foreignKeys = {}

    for (const column of columns) {
        // Add single-column unique constaints if they aren't already registered.
        if (column.isUnique && !uniqueConstraintIds.has(column.name)) {
            uniqueConstraintIds.add(column.name)
            uniqueConstraints.push([column.name])
        }

        // Add single-column indexes if not also a unique constraint.
        if (column.isIndexed && !uniqueConstraintIds.has(column.name)) {
            indexes.push([column.name])
        }

        // Foreign keys.
        if (column.foreignKey) {
            foreignKeys[column.name] = column.foreignKey
        }
    }

    return {
        foreignKeys,
        indexes,
        uniqueConstraints,
    }
}

export default addColumns