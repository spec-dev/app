import { ident, literal } from '@scaleleap/pg-format'
import { typeIdent } from './helpers'

const defaultValueFormats = {
    EXPRESSION: 'expression',
    LITERAL: 'literal',
}

/*
    <name> <type> <not null?> <default?>
*/
function buildCreateTableColumn(column) {
    // Serial
    if (column.isSerial) {
        return `${ident(column.name)} serial`
    }

    // Name & Type
    const comps = [ident(column.name), typeIdent(column.data_type)]

    // Not null.
    if (column.isNotNull || column.isPrimaryKey) {
        comps.push('NOT NULL')
    }

    // Default value.
    if (column.default) {
        const { format, value } = column.default
        const defaultClause =
            format === defaultValueFormats.EXPRESSION
                ? `DEFAULT ${value}`
                : `DEFAULT ${literal(value)}`
        comps.push(defaultClause)
    }

    return comps.join(' ')
}

export default buildCreateTableColumn