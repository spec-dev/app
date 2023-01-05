import api from './api'

export const liveObjects = {
    all: []
}

export async function loadAllLiveObjects() {
    const { data, ok } = await api.core.liveObjects()
    if (!ok) {
        // TODO: Show error
        return
    }
    liveObjects.all = data
}

export const getAllLiveObjects = () => liveObjects.all || []

export const propertyIsEnum = property => property.options?.length || property.type === 'boolean'

export const formatPropertyOptionsForSelection = property => {
    if (property.type === 'boolean') {
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

const primitiveTypes = new Set([
    'boolean',
    'string',
    'number',
])

export const resolvedPropertyType = (property, exampleValue = null) => {
    if (primitiveTypes.has(property.type) || property.type === 'Timestamp') {
        return property.type
    }
    if (property.options?.length) {
        return 'enum'
    }
    if (exampleValue !== null) {
        const exampleType = typeof exampleValue
        if (primitiveTypes.has(exampleType)) {
            return exampleType
        }
    }
    return property.type
}