import { invert } from 'lodash-es'

export const filterOps = {
    EQUAL_TO: '=',
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
    IN: 'in',
    NOT_IN: 'not in',
}

export const filterOpLabels = {
    EQUAL_TO: 'equals',
    NOT_EQUAL_TO: 'not equal to',
    GREATER_THAN: '>',
    GREATER_THAN_OR_EQUAL_TO: '>=',
    LESS_THAN: '<',
    LESS_THAN_OR_EQUAL_TO: '<=',
    IN_COLUMN: 'in column', 
    GREATER_THAN_COLUMN: '> column',
    GREATER_THAN_OR_EQUAL_TO_COLUMN: '>= column',
    LESS_THAN_COLUMN: '< column',
    LESS_THAN_OR_EQUAL_TO_COLUMN: '<= column',
    IN: 'in list',
    NOT_IN: 'not in list',
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
    GREATER_THAN_OR_EQUAL_TO_COLUMN: 'greater than or equal to column',
    LESS_THAN_COLUMN: 'less than column',
    LESS_THAN_OR_EQUAL_TO_COLUMN: 'less than or equal to column',
    IN: 'in list',
    NOT_IN: 'not in list',
}

export const labelForFilterOp = {
    [filterOps.EQUAL_TO]: filterOpLabels.EQUAL_TO,
    [filterOps.NOT_EQUAL_TO]: filterOpLabels.NOT_EQUAL_TO,
    [filterOps.GREATER_THAN]: filterOpLabels.GREATER_THAN,
    [filterOps.GREATER_THAN_OR_EQUAL_TO]: filterOpLabels.GREATER_THAN_OR_EQUAL_TO,
    [filterOps.LESS_THAN]: filterOpLabels.LESS_THAN,
    [filterOps.LESS_THAN_OR_EQUAL_TO]: filterOpLabels.LESS_THAN_OR_EQUAL_TO,
    [filterOps.IN_COLUMN]: filterOpLabels.IN_COLUMN,
    [filterOps.GREATER_THAN_COLUMN]: filterOpLabels.GREATER_THAN_COLUMN,
    [filterOps.GREATER_THAN_OR_EQUAL_TO_COLUMN]: filterOpLabels.GREATER_THAN_OR_EQUAL_TO_COLUMN,
    [filterOps.LESS_THAN_COLUMN]: filterOpLabels.LESS_THAN_COLUMN,
    [filterOps.LESS_THAN_OR_EQUAL_TO_COLUMN]: filterOpLabels.LESS_THAN_OR_EQUAL_TO_COLUMN,
    [filterOps.IN]: filterOpLabels.IN,
    [filterOps.NOT_IN]: filterOpLabels.NOT_IN,
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
    [filterOps.IN]: filterOpEnglish.IN,
    [filterOps.NOT_IN]: filterOpEnglish.NOT_IN,
}

export const filterOpForEnglish = invert(englishForFilterOp)

export const filterOptions = [
    filterOps.EQUAL_TO,
    filterOps.IN_COLUMN,
    filterOps.IN,
    filterOps.GREATER_THAN,
    filterOps.GREATER_THAN_OR_EQUAL_TO,
    filterOps.LESS_THAN,
    filterOps.LESS_THAN_OR_EQUAL_TO,
    filterOps.GREATER_THAN_COLUMN,
    filterOps.GREATER_THAN_OR_EQUAL_TO_COLUMN,
    filterOps.LESS_THAN_COLUMN,
    filterOps.LESS_THAN_OR_EQUAL_TO_COLUMN,
    filterOps.NOT_EQUAL_TO,
    filterOps.NOT_IN, 
].map(op => ({
    value: op,
    label: englishForFilterOp[op],
    displayLabel: labelForFilterOp[op],
}))

export const columnOps = new Set([
    filterOps.IN_COLUMN,
    filterOps.GREATER_THAN_COLUMN,
    filterOps.GREATER_THAN_OR_EQUAL_TO_COLUMN,
    filterOps.LESS_THAN_COLUMN,
    filterOps.LESS_THAN_OR_EQUAL_TO_COLUMN,
])

export const multiValueOps = new Set([
    filterOps.IN,
    filterOps.NOT_IN,
])

export function getColumnOpForSpecConfigOp(op) {
    switch (op) {
        case filterOps.EQUAL_TO:
            return filterOps.IN_COLUMN

        case filterOps.GREATER_THAN:
            return filterOps.GREATER_THAN_COLUMN

        case filterOps.GREATER_THAN_OR_EQUAL_TO:
            return filterOps.GREATER_THAN_OR_EQUAL_TO_COLUMN

        case filterOps.LESS_THAN:
            return filterOps.LESS_THAN_COLUMN
    
        case filterOps.LESS_THAN_OR_EQUAL_TO:
            return filterOps.LESS_THAN_OR_EQUAL_TO_COLUMN

        default:
            return op
    }
}