import buildCreateTableColumn from './buildCreateTableColumn'
import { ident } from 'pg-format'
import { sqlStatementsAsTx } from './helpers'

function buildAddColumnMigration(
    schema,
    table,
    column,
    asTx = true
) {
    const upSql = `ALTER TABLE ${ident(schema)}.${ident(table)} ADD COLUMN ${buildCreateTableColumn(
        column
    )};`
    const downSql = `ALTER TABLE ${ident(schema)}.${ident(table)} DROP COLUMN ${ident(
        column.name
    )};`

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

export default buildAddColumnMigration