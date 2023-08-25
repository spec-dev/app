import { ident } from '@scaleleap/pg-format'
import { newConstraintName, sqlStatementsAsTx } from './helpers'

function buildAddPrimaryKeyMigration(
    schema,
    table,
    columns,
    asTx = true
) {
    const constraintName = newConstraintName('pk')

    const upSql = [
        `ALTER TABLE ${ident(schema)}.${ident(table)}`,
        `ADD CONSTRAINT ${ident(constraintName)}`,
        `PRIMARY KEY (${columns.map(ident).join(', ')});`,
    ].join(' ')

    const downSql = [
        `ALTER TABLE ${ident(schema)}.${ident(table)}`,
        `DROP CONSTRAINT ${ident(constraintName)};`,
    ].join(' ')

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

export default buildAddPrimaryKeyMigration