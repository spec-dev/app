import { literal } from '@scaleleap/pg-format'

const createSpecUserSql = (pw) => `create user spec with password ${literal(pw)}`

export default createSpecUserSql