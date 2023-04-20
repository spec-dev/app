import { ident, literal } from 'pg-format'
import { sqlStatementsAsTx } from './helpers'
import buildCreateTableColumn from './buildCreateTableColumn'

function buildCreateTableMigration(
    schema,
    name,
    columns,
    primaryUniqueConstraint,
    comment = null,
    asTx = true
) {
    // Force primary unique constraint columns to be NOT NULL.
    for (const column of columns) {
        if (primaryUniqueConstraint.includes(column.name) && !column.isNotNull) {
            column.isNotNull = true
        }
    }

    // Up -> create table with optional comment.
    const columnStatements = columns.map((c) => buildCreateTableColumn(c))
    const createTableSql = `CREATE TABLE ${ident(schema)}.${ident(name)} (${columnStatements.join(
        ', '
    )});`
    const commentSql = comment
        ? `COMMENT ON TABLE ${ident(schema)}.${ident(name)} IS ${literal(comment)};`
        : null
    const upStatements = commentSql ? [createTableSql, commentSql] : [createTableSql]

    // Down -> drop table.
    const dropTableSql = `DROP TABLE ${ident(schema)}.${ident(name)};`
    const downStatements = [dropTableSql]

    if (!asTx) {
        return {
            up: upStatements,
            down: downStatements,
        }
    }

    return {
        up: sqlStatementsAsTx(upStatements),
        down: sqlStatementsAsTx(downStatements),
    }
}

export default buildCreateTableMigration