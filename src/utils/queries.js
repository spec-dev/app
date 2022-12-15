import constants from './constants'

export const selectPageRecords = (tablePath, sortRules = [], offset = 0, limit = constants.RECORDS_PER_PAGE) => {
    const comps = [`select * from ${tablePath}`]
    
    if (sortRules.length) {
        comps.push('order by')
        sortRules.forEach(({ column, order }) => {
            comps.push(`${column} ${order}`)
        })
    }
    comps.push(`offset ${offset}`)
    comps.push(`limit ${limit}`)

    return comps.join(' ')
}