import api from './api'

export async function getConfig() {
    const { data, ok } = await api.meta.config()
    return ok ? data : null
}

export function getLiveColumnsForTable(schema, table, config) {
    const liveColumns = (config.tables[schema] || {})[table] || {}
    if (!Object.keys(liveColumns).length) return {}

    const formattedLiveColumns = {}
    for (const column in liveColumns) {
        const propertyPath = liveColumns[column] || ''
        const [liveObjectGivenName, property] = propertyPath.split('.')
        if (!liveObjectGivenName || !property) continue

        const liveObject = config.objects[liveObjectGivenName] || {}
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
    const liveColumnLinks = []
    for (const givenName in liveObjects) {
        const obj = liveObjects[givenName]

        const [nsp, name, version] = splitLiveObjectId(obj.id)
        if (!nsp || !name || !version) continue

        for (const link of obj.links || []) {
            const linkOn = link.linkOn || {}

            for (const property in linkOn) {
                const colPath = linkOn[property]
                const [colSchema, colTable, colName] = colPath.split('.')
                if (colSchema === schema && colTable === table) {
                    liveColumnLinks.push({
                        column: colName,
                        liveObject: {
                            nsp,
                            name,
                            version,
                            property,
                            givenName,
                        }
                    })
                }
            }
        }
    }
    return liveColumnLinks
}

export function splitLiveObjectId(id) {
    const [nspName, version] = (id || '').split('@')
    if (!nspName || !version) return ['', '', '']

    const [nsp, name] = nspName.split('.')
    if (!nsp || !name) return ['', '', '']

    return [nsp, name, version]
}