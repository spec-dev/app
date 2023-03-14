import constants from './constants'
import { SPEC_SCHEMA_NAME, specTableNames } from './schema'
import api from './api'
import { ident } from 'pg-format'

const formatRelation = relation => (
    relation.split('.').map((v) => `${ident(v)}`).join('.')
)

export const getPageRecords = (tablePath, sortRules = [], offset = 0, limit = constants.RECORDS_PER_PAGE) => {
    const comps = [`select * from ${formatRelation(tablePath)}`]
    
    if (sortRules.length) {
        comps.push('order by')
        sortRules.forEach(({ column, order }) => {
            comps.push(`${formatRelation(column)} ${order}`)
        })
    }
    comps.push(`offset ${offset}`)
    comps.push(`limit ${limit}`)

    return api.meta.query({ query: comps.join(' ') })
}

export async function getSeedCursors() {
    return api.meta.query({ query: `select * from ${SPEC_SCHEMA_NAME}.${specTableNames.SEED_CURSORS}` })
}

export async function getTableCount(tablePath) {
    return api.meta.query({ query: `select count(*) from ${formatRelation(tablePath)}` })
}