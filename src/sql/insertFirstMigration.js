import { literal } from 'pg-format'

const insertFirstMigration = (version) => `insert into spec.migrations (version) values (${literal(version)})`

export default insertFirstMigration