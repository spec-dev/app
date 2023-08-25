import { ident } from '@scaleleap/pg-format'
import { newConstraintName, sqlStatementsAsTx } from './helpers'

function buildCreateIndexMigration(
    schema,
    table,
    columns,
    unique = false,
    asTx = true
) {
    const indexName = newConstraintName('idx')
    const command = unique ? `CREATE UNIQUE INDEX` : `CREATE INDEX`
    const upSql = `${command} ${ident(indexName)} ON ${ident(schema)}.${ident(table)} (${columns
        .map(ident)
        .join(', ')});`
    const downSql = `DROP INDEX ${ident(schema)}.${ident(indexName)};`

    if (!asTx) {
        return {
            up: [upSql],
            down: [downSql],
        }
    }

    return {
        up: sqlStatementsAsTx([upSql]),
        down: sqlStatementsAsTx([downSql]),
    }
}

export default buildCreateIndexMigration