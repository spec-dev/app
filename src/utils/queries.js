import config from './config'

export const selectPageRecords = (tablePath, offset = 0, limit = config.RECORDS_PER_PAGE) => (
    `select * from ${tablePath} offset ${offset} limit ${limit}`
)