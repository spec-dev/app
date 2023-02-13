import api from './api'
import { TIMESTAMP, BOOLEAN, STRING, NUMBER } from './propertyTypes'

export const liveObjects = {
    all: []
}

export async function loadAllLiveObjects() {
    const { data, ok } = await api.core.liveObjects()
    if (!ok) {
        // TODO: Show error
        return
    }
    liveObjects.all = (data || []).sort((a, b) => {
        const aTimestamp = new Date(a.latestVersion.createdAt).getTime()
        const bTimestamp = new Date(b.latestVersion.createdAt).getTime()
        return (
            Number(a.isContractEvent) - Number(b.isContractEvent) ||
            bTimestamp - aTimestamp
        )
    })
}

export const getAllLiveObjects = () => liveObjects.all || []

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