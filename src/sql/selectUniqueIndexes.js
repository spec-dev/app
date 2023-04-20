const selectUniqueIndexes = `SELECT
    indexdef as constraint_def,
    indexname as constraint_name,
    schemaname as schema,
    tablename as table
FROM pg_indexes
WHERE indexdef ilike '%unique index%'`
export default selectUniqueIndexes