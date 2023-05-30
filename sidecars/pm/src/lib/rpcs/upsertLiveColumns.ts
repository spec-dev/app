import {
    filterOps,
    StringKeyMap,
    LiveColumn,
    LiveColumnFilter,
    ConfigFilter,
    ConfigFilterGroup,
    FilterOp,
    columnFilterOps,
    multiValueFilterOps,
    numericFilterOps,
    NewLiveColumnsPayload,
} from '../types'
import { fromNamespacedVersion } from '../utils/formatters'
import { Section, inline } from '@ltd/j-toml'
import { couldBeColPath, couldBeNumber, isNonEmptyString } from '../utils/validators'
import { readProjectConfigFile, saveProjectConfigFile } from '../file'

function upsertLiveColumns(projectPath: string, data: NewLiveColumnsPayload) {
    const currentConfig = readProjectConfigFile(projectPath)
    const { tablePath, liveObjectVersionId, liveColumns, filters, uniqueBy } = data
    const [schema, table] = tablePath.split('.')
    if (!schema || !table) {
        throw `Malformed table path ${tablePath}`
    }

    let error
    try {
        validateFilters(filters)
        validateUniqueBy(uniqueBy)
        const liveObjectName = upsertLiveObjectVersionInConfig(currentConfig, liveObjectVersionId)
        upsertLiveColumnsInConfig(currentConfig, schema, table, liveColumns, liveObjectName)
        upsertLiveObjectLinkInConfig(currentConfig, tablePath, liveObjectName, filters, uniqueBy)
        ;({ error } = saveProjectConfigFile(projectPath, currentConfig))
    } catch (err) {
        error = `Error adding live columns to config: ${err}`
    }
    if (error) throw error
}

/**
 * Example:
 *
 * [object.LiveObject]
 * id = 'nsp.name@0.0.1'
 */
export function upsertLiveObjectVersionInConfig(config: StringKeyMap, liveObjectVersionId: string) {
    config.objects = config.objects || {}

    const { nsp, name } = fromNamespacedVersion(liveObjectVersionId)
    if (!name) throw `Malformed live object version id: ${liveObjectVersionId}`

    let objectName = name
    let addNewSection = true
    if (config.objects[objectName]) {
        const id = config.objects[objectName].id
        const existingNsp = fromNamespacedVersion(id).nsp
        if (existingNsp === nsp) {
            config.objects[objectName].id = liveObjectVersionId
            addNewSection = false
        } else {
            objectName = nsp + name
        }
    }
    if (!addNewSection) return objectName

    config.objects[objectName] = Section({ id: liveObjectVersionId })
    return objectName
}

/**
 * Example:
 *
 * [tables.public.table_name]
 * column_name = 'LiveObject.property'
 */
function upsertLiveColumnsInConfig(
    config: StringKeyMap,
    schema: string,
    table: string,
    liveColumns: { [key: string]: LiveColumn },
    liveObjectName: string
) {
    config.tables = config.tables || {}
    config.tables[schema] = config.tables[schema] || {}
    config.tables[schema][table] = config.tables[schema][table] || Section({})

    for (const colName in liveColumns) {
        const liveColumnData = liveColumns[colName]
        config.tables[schema][table][colName] = [liveObjectName, liveColumnData.property].join('.')
    }
}

/**
 * Example:
 *
 * [[object.LiveObject.links]]
 * table = 'schema.table'
 * uniqueBy = ['property1', 'property2', ...]
 * filterBy = [
 *     { property = { op = '>' value = 1 }, ... },
 *     ...
 * ]
 */
function upsertLiveObjectLinkInConfig(
    config: StringKeyMap,
    tablePath: string,
    liveObjectName: string,
    filters: LiveColumnFilter[][],
    uniqueBy: string[]
) {
    if (!config.objects[liveObjectName])
        throw `No live object exist in config for name ${liveObjectName}`

    config.objects[liveObjectName].links = config.objects[liveObjectName].links || []
    const linksCount = config.objects[liveObjectName].links.length

    let linkIndex = linksCount
    if (linksCount) {
        for (let i = 0; i < linksCount; i++) {
            if (config.objects[liveObjectName].links[i].table === tablePath) {
                linkIndex = i
                break
            }
        }
    }

    config.objects[liveObjectName].links[linkIndex] =
        config.objects[liveObjectName].links[linkIndex] || Section({})
    config.objects[liveObjectName].links[linkIndex].table = tablePath
    config.objects[liveObjectName].links[linkIndex].uniqueBy = inline(uniqueBy)

    const filterBy = formatFilterBy(filters)
    if (filterBy) {
        config.objects[liveObjectName].links[linkIndex].filterBy = filterBy.map((entry) => {
            const group = {}
            for (const key in entry) {
                group[key] = inline(entry[key] as any)
            }
            return inline(group)
        })
    } else {
        delete config.objects[liveObjectName].links[linkIndex].filterBy
    }
}

function validateFilters(filters: LiveColumnFilter[][]) {
    for (const entry of filters) {
        for (const filter of entry || []) {
            const { property, op } = filter || {}
            if (!property) {
                throw 'Invalid filter - no "property" given'
            }
            if (!op) {
                throw 'Invalid filter - no "op" given'
            }
            if (!filter.hasOwnProperty('value')) {
                throw 'Invalid filter - no "value" given'
            }
            if (!filterOps.has(op)) {
                throw `Invalid filter op: ${op}`
            }
            if (columnFilterOps.has(op) && !couldBeColPath(filter.value)) {
                throw `Invalid column path for filter operation (${op}): ${filter.value}`
            }
            if (multiValueFilterOps.has(op) && !Array.isArray(filter.value)) {
                throw `Invalid value for array-type filter operation (${op}): ${filter.value}`
            }
            if (numericFilterOps.has(op) && !couldBeNumber(filter.value)) {
                throw `Invalid value for numeric-type filter operation (${op}): ${filter.value}`
            }
        }
    }
}

function validateUniqueBy(uniqueBy: string[]) {
    if (!Array.isArray(uniqueBy)) {
        throw '"uniqueBy" must be an array of strings'
    }

    const seen = new Set()
    for (const property of uniqueBy) {
        if (seen.has(property)) {
            throw `"uniqueBy" can't contain any duplicate properties: ${property}`
        }
        if (!isNonEmptyString(property)) {
            throw '"uniqueBy" must be an array of all non-empty strings'
        }
        seen.add(property)
    }
}

function formatFilterBy(filters: LiveColumnFilter[][]): ConfigFilterGroup[] | null {
    if (!filters.length) return null

    const filterBy = []
    for (const entry of filters) {
        const group: ConfigFilterGroup = {}

        for (const filter of entry || []) {
            group[filter.property] = formatConfigFilter(filter)
        }

        Object.keys(group).length && filterBy.push(group)
    }

    return filterBy.length ? filterBy : null
}

function formatConfigFilter(filter: LiveColumnFilter): ConfigFilter {
    switch (filter.op) {
        case FilterOp.InColumn:
            return { op: FilterOp.EqualTo, column: filter.value }

        case FilterOp.GreaterThanColumn:
            return { op: FilterOp.GreaterThan, column: filter.value }

        case FilterOp.GreaterThanOrEqualToColumn:
            return { op: FilterOp.GreaterThanOrEqualTo, column: filter.value }

        case FilterOp.LessThanColumn:
            return { op: FilterOp.LessThan, column: filter.value }

        case FilterOp.LessThanOrEqualToColumn:
            return { op: FilterOp.LessThanOrEqualTo, column: filter.value }

        default:
            return { op: filter.op, value: filter.value }
    }
}

export default upsertLiveColumns
