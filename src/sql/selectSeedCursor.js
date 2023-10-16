import { SPEC_SCHEMA_NAME, specTableNames } from "../utils/schema";

export const selectSeedCursor = (id) => {
  const statement = `select * from ${SPEC_SCHEMA_NAME}.${specTableNames.SEED_CURSORS} where id='${id}'`;
  return statement;
}

export default selectSeedCursor;
