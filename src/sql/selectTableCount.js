import { formatRelation } from './helpers'

const selectTableCount = tablePath => `select count(*) from ${formatRelation(tablePath)}`

export default selectTableCount