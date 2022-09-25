const paths = {
    HOME: '/',
    DASHBOARD: '/project/:projectId/:section/:subSection?/:mod?',
    GUIDES: '',
    API_REFERENCE: '',
}

const sections = {
    TABLES: 'tables',
    LIVE_OBJECTS: 'live-objects',
    DOCS: 'docs',
}

const docsSubSections = {
    GETTING_STARTED: 'getting-started',
    AUTH: 'auth',
    WALLETS: 'wallets',
    TABLE_APIS: 'table-apis',
    REST_API: 'rest-api',
    SUBSCRIPTIONS: 'subscriptions',
}

const liveObjectsSubSections = {
    OBJECT_ECOSYSTEM: 'ecosystem',
    PUBLISHED: 'published',
    LOCAL: 'local',
}

paths.toTable = tableName => `/project/vyuszitodaosuejfksrds/${sections.TABLES}/${tableName}`
paths.toLiveObjects = subSection => `/project/vyuszitodaosuejfksrds/${sections.LIVE_OBJECTS}/${subSection}`
paths.toDocs = subSection => `/project/vyuszitodaosuejfksrds/${sections.DOCS}/${subSection}`

export {
    paths,
    sections,
    docsSubSections,
    liveObjectsSubSections,
}