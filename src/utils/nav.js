const paths = {
    HOME: '/',
    DASHBOARD: '/project/:projectId/:section/:subSection?/:mod?',
}

const sections = {
    TABLES: 'tables',
}

paths.toTables = projectId => `/project/${projectId}/${sections.TABLES}`
paths.toTable = (projectId, tableName) => `${paths.toTables(projectId)}/${tableName}`

export {
    paths,
    sections,
}