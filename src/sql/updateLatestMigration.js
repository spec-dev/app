import { literal } from 'pg-format'

const updateLatestMigration = (version) => `update spec.migrations set version = ${literal(version)}`

export default updateLatestMigration