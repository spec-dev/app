import { ident } from '@scaleleap/pg-format'
import { sqlStatementsAsTx, newConstraintName } from './helpers'

function buildForeignKeyMigration(
    schema,
    table,
    column,
    ref,
    asTx = true
) {
    const constraintName = newConstraintName('fk')

    const upSql = [
        `ALTER TABLE ${ident(schema)}.${ident(table)}`,
        `ADD CONSTRAINT ${ident(constraintName)}`,
        `FOREIGN KEY (${ident(column)})`,
        `REFERENCES ${ident(ref.schema)}.${ident(ref.table)} (${ident(ref.column)})`,
        `ON DELETE NO ACTION ON UPDATE NO ACTION;`,
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

export default buildForeignKeyMigration