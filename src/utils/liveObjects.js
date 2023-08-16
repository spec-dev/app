import api from './api'
import { TIMESTAMP, BOOLEAN, STRING, NUMBER } from './propertyTypes'

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

    console.log(data)

    const filtered = []
    for (const entry of data) {
        if (entry.displayName.toLowerCase().includes('lens')) continue
        if (entry.name === 'LatestInteraction') continue
        if (entry.name === 'Contract') continue

        if (entry.name === 'NFTBalance' || entry.name === 'ERC20Balance') {
            entry.latestVersion.config.chains = { '1': {}, '5': {}, '137': {} }
        }
        if (entry.name === 'TokenTransfer') {
            entry.desc = 'Native, ERC-20, and NFT token transfers.'
        }

        filtered.push(entry)
    }
    return filtered
    
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