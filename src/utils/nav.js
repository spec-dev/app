const paths = {
    HOME: '/',
    DASHBOARD: '/project/:section/:subSection?/:mod?',
}

const sections = {
    TABLES: 'tables'
}

paths.tables = `/project/${sections.TABLES}`
paths.toTable = tableName => `${paths.tables}/${tableName}`

export const links = {
    SPEC_HOME_PAGE: 'https://spec.dev',
    INTRO_BLOG_POST: 'https://spec.dev/blog/introducing-spec',
    REQUEST_EARLY_ACCESS: 'https://spec.dev/early-access',
    GITHUB_ORG: 'https://github.com/spec-dev',
    GITHUB_SPEC: 'https://github.com/spec-dev/spec',
    TWITTER: 'https://twitter.com/SpecDotDev',
    TEAM_EMAIL: 'mailto:team@spec.dev',
    DISCORD: 'https://discord.gg/5sqH6eBgH9',
}

export {
    paths,
    sections,
}