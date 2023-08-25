import { ident } from '@scaleleap/pg-format'
import short from 'short-uuid'
export { sqlStatementsAsTx } from '../utils/formatters'

export const coalesceRowsToArray = (source, filter) => {
    return `
COALESCE(
    (
        SELECT
            array_agg(row_to_json(${source})) FILTER (WHERE ${filter})
        FROM
            ${source}
    ),
    '{}'
) AS ${source}`
}

export const formatRelation = relation => (
    relation.split('.').map((v) => `${ident(v)}`).join('.')
)

export const newConstraintName = prefix => `${prefix}_${short.generate().toLowerCase()}`

export const typeIdent = type => {
    return type.endsWith('[]') ? `${ident(type.slice(0, -2))}[]` : ident(type)
}