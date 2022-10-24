import constants from './constants'

export const selectPageRecords = (tablePath, offset = 0, limit = constants.RECORDS_PER_PAGE) => (
    `select * from ${tablePath} offset ${offset} limit ${limit}`
)