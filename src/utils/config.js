import api from './api'

export async function getConfig() {
    const { data, ok } = await api.meta.config()
    return ok ? data : null
}

export function getLiveColumnsForTable(schema, table, config) {
    const liveColumns = ((config.tables || {})[schema] || {})[table] || {}
    if (!Object.keys(liveColumns).length) return {}

    const liveObjects = config.objects || {}
    const formattedLiveColumns = {}
    for (const column in liveColumns) {
        const propertyPath = liveColumns[column] || ''
        const [liveObjectGivenName, property] = propertyPath.split('.')
        if (!liveObjectGivenName || !property) continue

        const liveObject = liveObjects[liveObjectGivenName] || {}
        if (!Object.keys(liveObject).length) continue

        const [nsp, name, version] = splitLiveObjectId(liveObject.id)
        if (!nsp || !name || !version) continue

        formattedLiveColumns[column] = {
            nsp,
            name,
            version,
            property,
            givenName: liveObjectGivenName,
        }
    }

    return formattedLiveColumns
}

export function getLiveColumnLinksOnTable(schema, table, config) {
    const liveObjects = config.objects || {}
    const liveColumnLinks = {}
    for (const givenName in liveObjects) {
        const obj = liveObjects[givenName]

        const [nsp, name, version] = splitLiveObjectId(obj.id)
        if (!nsp || !name || !version) continue

        for (const link of obj.links || []) {
            const linkOn = link.linkOn || {}

            for (const property in linkOn) {
                const colPath = linkOn[property]
                const [colSchema, colTable, colName] = colPath.split('.')
                if (colSchema === schema && colTable === table && !liveColumnLinks[colName]) {
                    liveColumnLinks[colName] = {
                        column: colName,
                        targetTablePath: obj.table,
                        liveObject: {
                            nsp,
                            name,
                            version,
                            property,
                            givenName,
                        }
                    }
                }
            }

            const seedColPathMappings = getSeedColPathMappings(link.seedWith, linkOn)
            for (const mapping of seedColPathMappings) {
                for (const property in mapping) {
                    const colPath = mapping[property]
                    const [colSchema, colTable, colName] = colPath.split('.')
                    if (colSchema === schema && colTable === table && !liveColumnLinks[colName]) {
                        liveColumnLinks[colName] = {
                            column: colName,
                            targetTablePath: obj.table,
                            liveObject: {
                                nsp,
                                name,
                                version,
                                property,
                                givenName,
                            },
                            isSeedColumn: true,
                        }
                    }
                }    
            }
        }
    }
    
    return Object.values(liveColumnLinks)
}

export function getSeedColPathMappings(seedWith, linkOn) {
    const isString = typeof seedWith === 'string'
    const isArray = Array.isArray(seedWith)

    // String or array of object properties.
    if (isString || isArray) {
        const seedProperties = (isArray ? seedWith : [seedWith])
        linkOn = linkOn || {}
        
        let seedColPaths = []
        let newEntry = {}
        for (const val of seedProperties) {
            if (typeof val === 'object') {
                if (Object.keys(newEntry).length) {
                    seedColPaths.push(newEntry)
                    newEntry = {}        
                }
                seedColPaths.push(val)
            } else if (linkOn.hasOwnProperty(val)) {
                newEntry[val] = linkOn[val]
            } else {
                if (Object.keys(newEntry).length) {
                    seedColPaths.push(newEntry)
                    newEntry = {}
                }
            }
        }
        if (Object.keys(newEntry).length) {
            seedColPaths.push(newEntry)
        }
        return seedColPaths
    }

    // Map of property:colPath
    if (typeof seedWith === 'object') {
        return [seedWith || {}]
    }
    
    return []
}

export function splitLiveObjectId(id) {
    const [nspName, version] = (id || '').split('@')
    if (!nspName || !version) return ['', '', '']

    const [nsp, name] = nspName.split('.')
    if (!nsp || !name) return ['', '', '']

    return [nsp, name, version]
}

export function formatLiveObjectId(nsp, name, version) {
    return `${nsp}.${name}@${version}`
}