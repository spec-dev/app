import { SPEC_SCHEMA_NAME, specTableNames } from '../utils/schema'

export const selectSeedCursors = () => `select * from ${SPEC_SCHEMA_NAME}.${specTableNames.SEED_CURSORS}`

export default selectSeedCursors