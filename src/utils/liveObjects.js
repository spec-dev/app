import api from './api'
import { TIMESTAMP, BOOLEAN, STRING, NUMBER, BLOCK_HASH, TRANSACTION_HASH, BLOCK_NUMBER, ADDRESS, BIGINT, BIGFLOAT } from './propertyTypes'

export const liveObjects = {
    frontPage: [],
}

// Query for matching live objects. Store results.
export async function loadMatchingLiveObjects(query, filters, offset, limit) {
    const { data, ok } = await api.core.searchLiveObjects({ 
        query, 
        filters: filters || {}, 
        offset: offset || 0, 
        limit,
    })
    if (!ok) {
        // TODO: Show error
        return []
    }
    return data
}

;(async () => {
    liveObjects.frontPage = await loadMatchingLiveObjects()
})()

export const getFrontPageLiveObjects = () => liveObjects.frontPage || []

export const propertyIsEnum = property => property.options?.length || property.type === BOOLEAN

export const formatPropertyOptionsForSelection = property => {
    if (property.type === BOOLEAN) {
        return [
            {
                value: true,
                label: 'true',
                type: property.type,
            },
            {
                value: false,
                label: 'false',
                type: property.type,
            },
        ]
    }

    return (property.options || []).map(p => ({
        value: p.value,
        label: p.name,
        type: p.type,
    }))
}

export const resolvedPropertyType = (property, exampleValue = null) => {
    const primitiveTypes = new Set([BOOLEAN, STRING, NUMBER])

    if (property.options?.length) {
        return 'enum'
    }

    if ([BLOCK_HASH, TRANSACTION_HASH, ADDRESS, BIGFLOAT, BIGINT].includes(property.type)) {
        return STRING
    }

    if (property.type === BLOCK_NUMBER) {
        return NUMBER
    }

    if (primitiveTypes.has(property.type) || property.type?.toLowerCase() === TIMESTAMP.toLowerCase()) {
        return property.type
    }

    if (exampleValue !== null) {
        const exampleType = typeof exampleValue
        if (primitiveTypes.has(exampleType)) {
            return exampleType
        }
    }
    
    return property.type
}