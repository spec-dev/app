import { parseColNamesFromConstraint } from '../utils/formatters'
import { selectFullSchema } from '../sql'
import pm from '../managers/project/projectManager'

async function listTables(schema) {
    let { rows, error } = await pm.query(selectFullSchema(schema))
    if (error) return { error }

    rows = rows.map(table => {
        const uniqueConstraints = table.unique_constraints || []
        const uniqueIndexes = table.unique_indexes || []
        const nonUniqueIndexes = table.non_unique_indexes || []
        delete table.unique_constraints
        delete table.unique_indexes
        delete table.non_unique_indexes
        const allUniqueConstraints = [...uniqueConstraints, ...uniqueIndexes]

        const unique = allUniqueConstraints.map((c) =>
            parseColNamesFromConstraint(c.constraint_def)
        )
        const uniqueColsSet = new Set()
        const uniqueColumns = []

        for (const entry of unique) {
            if (!entry) continue
            const key = entry.columns.sort().join(':')
            if (uniqueColsSet.has(key)) continue
            uniqueColsSet.add(key)
            uniqueColumns.push(entry.columns)
        }

        table.unique_columns = uniqueColumns

        table.non_unique_indexes = nonUniqueIndexes
            .map((c) => parseColNamesFromConstraint(c.constraint_def))
            .filter((v) => !!v)
            .map((v) => v.columns)

        table.columns = table.columns.sort((a, b) => (
            a.ordinal_position - b.ordinal_position
        ))

        table.comment = (table.comment || '').split('|').pop()

        return table
    }).sort((a, b) => a.name.localeCompare(b.name))
    
    return { rows, error }
}

export default listTables