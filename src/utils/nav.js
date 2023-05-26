const paths = {
    HOME: '/',
    DASHBOARD: '/project/:section/:subSection?/:mod?',
}

const sections = {
    TABLES: 'tables'
}

paths.tables = `/project/${sections.TABLES}`
paths.toTable = tableName => `${paths.tables}/${tableName}`

export {
    paths,
    sections,
}