const getCurrentMigrationVersion = (pw) => `select version from spec.migrations`

export default getCurrentMigrationVersion