const selectUniqueConstraints = `SELECT
    pg_get_constraintdef(c.oid) AS constraint_def,
    conname as constraint_name,
    n.nspname as schema,
    conrelid::regclass::text as table
FROM pg_constraint c 
JOIN pg_namespace n 
    ON n.oid = c.connamespace 
WHERE contype = 'u'`
export default selectUniqueConstraints