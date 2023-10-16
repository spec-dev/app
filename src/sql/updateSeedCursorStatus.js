import { SPEC_SCHEMA_NAME, specTableNames } from "../utils/schema";

export const editSeedCursorStatus = (id, isPaused) => {
    const status = isPaused ? 'paused' : 'in-progress';
    return `update ${SPEC_SCHEMA_NAME}.${specTableNames.SEED_CURSORS} set status='${status}' where id='${id}'`;
}

export default editSeedCursorStatus;