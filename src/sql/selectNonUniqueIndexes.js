const selectNonUniqueIndexes = `SELECT
    indexdef as constraint_def,
    indexname as constraint_name,
    schemaname as schema,
    tablename as table
FROM pg_indexes
WHERE indexdef ilike '%index%'
AND indexdef not ilike '%unique index%'`
export default selectNonUniqueIndexes