export type StringKeyMap = { [key: string]: any }

export type StringMap = { [key: string]: string }

export type AnyMap = { [key: string | number]: any }

export enum FilterOp {
    EqualTo = '=',
    NotEqualTo = '!=',
    GreaterThan = '>',
    GreaterThanOrEqualTo = '>=',
    LessThan = '<',
    LessThanOrEqualTo = '<=',
    InColumn = 'in column',
    GreaterThanColumn = '> column',
    GreaterThanOrEqualToColumn = '>= column',
    LessThanColumn = '< column',
    LessThanOrEqualToColumn = '<= column',
    In = 'in',
    NotIn = 'not in',
}

export const filterOps = new Set(Object.values(FilterOp))

export const columnFilterOps = new Set([
    FilterOp.InColumn,
    FilterOp.GreaterThanColumn,
    FilterOp.GreaterThanOrEqualToColumn,
    FilterOp.LessThanColumn,
    FilterOp.LessThanOrEqualToColumn,
])

export const multiValueFilterOps = new Set([FilterOp.In, FilterOp.NotIn])

export const numericFilterOps = new Set([
    FilterOp.GreaterThan,
    FilterOp.GreaterThanOrEqualTo,
    FilterOp.LessThan,
    FilterOp.LessThanOrEqualTo,
])

export interface LiveColumn {
    property: string
}

export interface LiveColumnFilter {
    property: string
    op: FilterOp
    value: any
}

export interface LiveColumnUniqueMapping {
    property: string
    columnPath: string
}

export interface NewLiveColumnsPayload {
    tablePath: string
    liveObjectVersionId: string
    liveColumns: { [key: string]: LiveColumn }
    filters: LiveColumnFilter[][]
    uniqueBy: string[]
}

export interface NewColumnPayload {
    schema: string
    table: string
    columns: NewColumn[]
}

export interface ForeignKey {
    schema: string
    table: string
    column: string
}

export enum DefaultValueFormat {
    Expression = 'expression',
    Literal = 'literal',
}

export interface DefaultClause {
    value: any
    format: DefaultValueFormat
}

export interface NewColumn {
    name: string
    data_type: string
    default?: DefaultClause
    isPrimaryKey?: boolean
    isSerial?: boolean
    isNotNull?: boolean
    isUnique?: boolean
    isIndexed?: boolean
    foreignKey?: ForeignKey
}

export interface NewTable {
    schema: string
    name: string
    desc?: string
    columns?: NewColumn[]
    uniqueBy?: string[][]
}

export interface ConfigFilter {
    op: FilterOp
    column?: string
    value?: any
}

export type ConfigFilterGroup = { [key: string]: ConfigFilter }

export interface Migration {
    name: string
    version: string
    up: string
    down: string
}
