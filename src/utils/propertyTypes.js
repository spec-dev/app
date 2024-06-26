import {
    INT8,
    FLOAT8,
    VARCHAR,
    JSON,
    TIMESTAMPTZ,
} from './colTypes'

export const STRING = 'string'
export const NUMBER = 'number'
export const BOOLEAN = 'boolean'
export const DATE = 'date'
export const OBJECT = 'object'
export const BIGINT = 'BigInt'
export const BIGFLOAT = 'BigFloat'
export const UNDEFINED = 'undefined'
export const SYMBOL = 'symbol'
export const NULL = 'null'
export const INTEGER = 'Integer'
export const FLOAT = 'Float'
export const TIMESTAMP = 'Timestamp'
export const ADDRESS = 'Address'
export const BLOCK_NUMBER = 'BlockNumber'
export const BLOCK_HASH = 'BlockHash'
export const TRANSACTION_HASH = 'TransactionHash'
export const CHAIN_ID = 'ChainId'
export const JSON_PROPERTY_TYPE = 'Json'

export function guessColTypeFromProperty(property) {
    let colType = property.colType || guessColTypeFromPropertyType(property.type)
    if (!colType && property.options?.length) {
        colType = guessColTypeFromPropertyType(property.options[0].type)
    }
    return colType
}

export function guessColTypeFromPropertyType(propertyType) {
    switch (propertyType) {
        // Varchars
        case STRING:
        case UNDEFINED:
        case NULL:
        case SYMBOL:
        case ADDRESS:
        case CHAIN_ID:
        case BLOCK_HASH:
        case TRANSACTION_HASH:
        case BIGINT:
        case BIGFLOAT:
            return VARCHAR

        // Integers
        case NUMBER:
        case INTEGER:
        case BLOCK_NUMBER:
            return INT8

        // Floats
        case FLOAT:
            return FLOAT8

        // Booleans
        case BOOLEAN:
            return BOOLEAN
        
        // Datetimes
        case DATE:
        case TIMESTAMP:
            return TIMESTAMPTZ

        // JSON
        case OBJECT:
        case JSON_PROPERTY_TYPE:
            return JSON

        default:
            return null
    }
}