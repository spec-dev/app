import { invert } from 'lodash-es'

export const filterOps = {
    EQUAL_TO: 'equals',
    NOT_EQUAL_TO: '!=',
    GREATER_THAN: '>',
    GREATER_THAN_OR_EQUAL_TO: '>=',
    LESS_THAN: '<',
    LESS_THAN_OR_EQUAL_TO: '<=',
    IN_COLUMN: 'in column',
    GREATER_THAN_COLUMN: '> column',
    GREATER_THAN_OR_EQUAL_TO_COLUMN: '>= column',
    LESS_THAN_COLUMN: '< column',
    LESS_THAN_OR_EQUAL_TO_COLUMN: '<= column',
    IS_ONE_OF: 'is one of',
    NOT_ONE_OF: 'not one of',
}

export const filterOpEnglish = {
    EQUAL_TO: 'equals',
    NOT_EQUAL_TO: 'not equal to',
    GREATER_THAN: 'greater than',
    GREATER_THAN_OR_EQUAL_TO: 'greater than or equal to',
    LESS_THAN: 'less than',
    LESS_THAN_OR_EQUAL_TO: 'less than or equal to',
    IN_COLUMN: 'in column', 
    GREATER_THAN_COLUMN: 'greater than column',
    GREATER_THAN_OR_EQUAL_TO_COLUMN: '>= column',
    LESS_THAN_COLUMN: 'less than column',
    LESS_THAN_OR_EQUAL_TO_COLUMN: '<= column',
    IS_ONE_OF: 'is one of',
    NOT_ONE_OF: 'not one of',
}

export const englishForFilterOp = {
    [filterOps.EQUAL_TO]: filterOpEnglish.EQUAL_TO,
    [filterOps.NOT_EQUAL_TO]: filterOpEnglish.NOT_EQUAL_TO,
    [filterOps.GREATER_THAN]: filterOpEnglish.GREATER_THAN,
    [filterOps.GREATER_THAN_OR_EQUAL_TO]: filterOpEnglish.GREATER_THAN_OR_EQUAL_TO,
    [filterOps.LESS_THAN]: filterOpEnglish.LESS_THAN,
    [filterOps.LESS_THAN_OR_EQUAL_TO]: filterOpEnglish.LESS_THAN_OR_EQUAL_TO,
    [filterOps.IN_COLUMN]: filterOpEnglish.IN_COLUMN,
    [filterOps.GREATER_THAN_COLUMN]: filterOpEnglish.GREATER_THAN_COLUMN,
    [filterOps.GREATER_THAN_OR_EQUAL_TO_COLUMN]: filterOpEnglish.GREATER_THAN_OR_EQUAL_TO_COLUMN,
    [filterOps.LESS_THAN_COLUMN]: filterOpEnglish.LESS_THAN_COLUMN,
    [filterOps.LESS_THAN_OR_EQUAL_TO_COLUMN]: filterOpEnglish.LESS_THAN_OR_EQUAL_TO_COLUMN,
    [filterOps.IS_ONE_OF]: filterOpEnglish.IS_ONE_OF,
    [filterOps.NOT_ONE_OF]: filterOpEnglish.NOT_ONE_OF,
}

export const filterOpForEnglish = invert(englishForFilterOp)

export const filterOptions = [
    filterOps.IN_COLUMN,
    filterOps.EQUAL_TO,
    filterOps.IS_ONE_OF,
    filterOps.GREATER_THAN,
    filterOps.GREATER_THAN_OR_EQUAL_TO,
    filterOps.LESS_THAN,
    filterOps.LESS_THAN_OR_EQUAL_TO,
    filterOps.GREATER_THAN_COLUMN,
    filterOps.GREATER_THAN_OR_EQUAL_TO_COLUMN,
    filterOps.LESS_THAN_COLUMN,
    filterOps.LESS_THAN_OR_EQUAL_TO_COLUMN,
    filterOps.NOT_EQUAL_TO,
    filterOps.NOT_ONE_OF, 
].map(op => ({
    value: englishForFilterOp[op],
    label: op,
}))

export const columnOps = new Set([
    filterOpEnglish.IN_COLUMN,
    filterOpEnglish.GREATER_THAN_COLUMN,
    filterOpEnglish.GREATER_THAN_OR_EQUAL_TO_COLUMN,
    filterOpEnglish.LESS_THAN_COLUMN,
    filterOpEnglish.LESS_THAN_OR_EQUAL_TO_COLUMN,
])

export const multiValueOps = new Set([
    filterOpEnglish.IS_ONE_OF,
    filterOpEnglish.NOT_ONE_OF,
])