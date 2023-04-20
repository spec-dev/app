import { formatRelation } from './helpers'
import constants from '../constants'

const selectTableRecords = (tablePath, sortRules = [], offset = 0, limit = constants.RECORDS_PER_PAGE) => {
    const comps = [`select * from ${formatRelation(tablePath)}`]
    
    if (sortRules.length) {
        comps.push('order by')
        sortRules.forEach(({ column, order }) => {
            comps.push(`${formatRelation(column)} ${order}`)
        })
    }
    comps.push(`offset ${offset}`)
    comps.push(`limit ${limit}`)

    return comps.join(' ')
}

export default selectTableRecords