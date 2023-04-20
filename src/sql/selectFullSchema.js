import { literal } from 'pg-format'
import selectTables from './selectTables'
import selectTableColumns from './selectTableColumns'
import selectPrimaryKeys from './selectPrimaryKeys'
import selectRelationships from './selectRelationships'
import uniqueConstraintsSql from './selectUniqueConstraints'
import uniqueIndexesSql from './selectUniqueIndexes'
import selectNonUniqueIndexes from './selectNonUniqueIndexes'
import { coalesceRowsToArray } from './helpers'

const listTables = schema => `
WITH tables AS (${selectTables}),
    columns AS (${selectTableColumns}),
    primary_keys AS (${selectPrimaryKeys}),
    relationships AS (${selectRelationships}),
    unique_constraints AS (${uniqueConstraintsSql}),
    unique_indexes AS (${uniqueIndexesSql}),
    non_unique_indexes AS (${selectNonUniqueIndexes})
SELECT
    *,
    ${coalesceRowsToArray('columns', 'columns.table_id = tables.id')},
    ${coalesceRowsToArray('primary_keys', 'primary_keys.table_id = tables.id')},
    ${coalesceRowsToArray(
        'relationships',
        `(relationships.source_schema = tables.schema AND relationships.source_table_name = tables.name)
            OR (relationships.target_table_schema = tables.schema AND relationships.target_table_name = tables.name)`
    )},
    ${coalesceRowsToArray(
        'unique_constraints',
        `(unique_constraints.schema = tables.schema AND unique_constraints.table = tables.name)
            OR (unique_constraints.schema = tables.schema AND unique_constraints.table = (tables.schema || '.' || tables.name))`
    )},
    ${coalesceRowsToArray(
        'unique_indexes',
        `(unique_indexes.schema = tables.schema AND unique_indexes.table = tables.name)`
    )},
    ${coalesceRowsToArray(
        'non_unique_indexes',
        `(non_unique_indexes.schema = tables.schema AND non_unique_indexes.table = tables.name)`
    )}
FROM tables where schema = ${literal(schema)}`

export default listTables