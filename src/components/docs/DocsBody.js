import React, { useCallback, useMemo } from 'react'
import { cn, getPCN } from '../../utils/classes'
import { docsSubSections } from '../../utils/nav'
import caretIcon from '../../svgs/caret-down'
import githubIcon from '../../svgs/github'
import npmIcon from '../../svgs/npm'
import ex from '../../data/examples'
import DocsSection from './DocsSection'

const className = 'docs-body'
const pcn = getPCN(className)

const getHeaderTitle = currentSubSection => {
    switch (currentSubSection) {
        case docsSubSections.REST_API:
            return 'Tables REST API'
        case docsSubSections.SUBSCRIPTIONS:
            return 'Table Subscriptions API'
        default:
            return ''
    }
}

const getHeaderSubtitle = currentSubSection => {
    switch (currentSubSection) {
        case docsSubSections.REST_API:
            return 'All views and tables in the public schema accessible by the active database role for a request are available for . All views and tables in the public schema accessible by the active database role for a request are available for querying.'
        case docsSubSections.SUBSCRIPTIONS:
            return 'All views and tables in the public schema accessible by the active database role for a request are available for . All views and tables in the public schema accessible by the active database role for a request are available for querying.'
        default:
            return ''
    }
}

const getSections = currentSubSection => {
    switch (currentSubSection) {
        case docsSubSections.REST_API:
            return [
                {
                    title: 'Read records',
                    desc: 'All views and tables in the public schema accessible by the active database role for a request are available for querying.',
                    learnMoreLink: '#',
                    examples: [
                        {
                            title: 'Read all rows',
                            code: ex.readAllRows,
                        },
                        {
                            title: 'Specific columns',
                            code: ex.specificColumns,
                        },
                        {
                            title: 'With filters',
                            code: ex.withFilters,
                        },
                        {
                            title: 'Foreign tables',
                            code: ex.foreignTables,
                        },                        
                    ],
                },
                {
                    title: 'Insert records',
                    desc: 'All views and tables in the public schema accessible by the active database role for a request are available for querying.',
                    learnMoreLink: '#',
                    examples: [
                        {
                            title: 'Read all rows',
                            code: ex.readAllRows,
                        },
                        {
                            title: 'Specific columns',
                            code: ex.specificColumns,
                        },
                        {
                            title: 'With filters',
                            code: ex.withFilters,
                        },
                        {
                            title: 'Foreign tables',
                            code: ex.foreignTables,
                        },                        
                    ],
                },
                {
                    title: 'Update records',
                    desc: 'All views and tables in the public schema accessible by the active database role for a request are available for querying.',
                    learnMoreLink: '#',
                    examples: [
                        {
                            title: 'Read all rows',
                            code: ex.readAllRows,
                        },
                        {
                            title: 'Specific columns',
                            code: ex.specificColumns,
                        },
                        {
                            title: 'With filters',
                            code: ex.withFilters,
                        },
                        {
                            title: 'Foreign tables',
                            code: ex.foreignTables,
                        },                        
                    ],
                },
                {
                    title: 'Delete records',
                    desc: 'All views and tables in the public schema accessible by the active database role for a request are available for querying.',
                    learnMoreLink: '#',
                    examples: [
                        {
                            title: 'Read all rows',
                            code: ex.readAllRows,
                        },
                        {
                            title: 'Specific columns',
                            code: ex.specificColumns,
                        },
                        {
                            title: 'With filters',
                            code: ex.withFilters,
                        },
                        {
                            title: 'Foreign tables',
                            code: ex.foreignTables,
                        },                        
                    ],
                },
            ]
        case docsSubSections.SUBSCRIPTIONS:
            return [
                {
                    title: 'Subscribe to changes',
                    desc: 'All views and tables in the public schema accessible by the active database role for a request are available for querying.',
                    learnMoreLink: '#',
                    examples: [
                        {
                            title: 'Read all rows',
                            code: ex.subscribeToUpdates,
                            showOutput: true,
                            generateOutput: () => {
                                const oldPosition = ex.aavePosition
                                    // .replace()

                                const newPosition = ex.aavePosition
                                    // .replace()

                                return ex.eventOutput
                                    .replace('{{event}}', 'UPDATE')
                                    .replace('{{timestamp}}', (new Date()).toISOString())
                                    .replace('{{table}}', 'positions')
                                    .replace('{{new}}', newPosition)
                                    .replace('{{old}}', oldPosition)
                            }
                        },
                        {
                            title: 'Specific columns',
                            code: ex.subscribeToUpdates,
                            showOutput: true,
                            generateOutput: () => {
                                const oldPosition = ex.aavePosition
                                    // .replace()

                                const newPosition = ex.aavePosition
                                    // .replace()

                                return ex.eventOutput
                                    .replace('{{event}}', 'UPDATE')
                                    .replace('{{timestamp}}', (new Date()).toISOString())
                                    .replace('{{table}}', 'positions')
                                    .replace('{{new}}', newPosition)
                                    .replace('{{old}}', oldPosition)
                            }
                        },
                        {
                            title: 'With filters',
                            code: ex.subscribeToUpdates,
                            showOutput: true,
                            generateOutput: () => {
                                const oldPosition = ex.aavePosition
                                    // .replace()

                                const newPosition = ex.aavePosition
                                    // .replace()

                                return ex.eventOutput
                                    .replace('{{event}}', 'UPDATE')
                                    .replace('{{timestamp}}', (new Date()).toISOString())
                                    .replace('{{table}}', 'positions')
                                    .replace('{{new}}', newPosition)
                                    .replace('{{old}}', oldPosition)
                            }
                        },
                        {
                            title: 'Foreign tables',
                            code: ex.subscribeToUpdates,
                            showOutput: true,
                            generateOutput: () => {
                                const oldPosition = ex.aavePosition
                                    // .replace()

                                const newPosition = ex.aavePosition
                                    // .replace()

                                return ex.eventOutput
                                    .replace('{{event}}', 'UPDATE')
                                    .replace('{{timestamp}}', (new Date()).toISOString())
                                    .replace('{{table}}', 'positions')
                                    .replace('{{new}}', newPosition)
                                    .replace('{{old}}', oldPosition)
                            }
                        },                        
                    ],
                },
            ]
        default:
            return []
    }
}

function DocsBody(props) {
    const { currentSubSection } = props
    const headerTitle = useMemo(() => getHeaderTitle(currentSubSection), [currentSubSection])
    const headerSubtitle = useMemo(() => getHeaderSubtitle(currentSubSection), [currentSubSection])
    const sections = useMemo(() => getSections(currentSubSection), [currentSubSection])
    
    const renderHeader = useCallback(() => (
        <div className={pcn('__header')}>
            <div className={pcn('__header-liner')}>
                <div className={pcn('__header-title')}>
                    { headerTitle }
                </div>
                <div className={pcn('__header-subtitle')}>
                    { headerSubtitle }
                </div>
            </div>
            <div className={pcn('__header-buttons')}>
                <div className={pcn('__header-buttons-top')}>
                    <a dangerouslySetInnerHTML={{ __html: npmIcon }}></a>
                    <a dangerouslySetInnerHTML={{ __html: githubIcon }}></a>
                </div>
                <div className={pcn('__header-buttons-bottom')}>
                    <button className={pcn('__lang-select')}>
                        <span>JavaScript</span>
                        <span dangerouslySetInnerHTML={{ __html: caretIcon }}></span>
                    </button>
                </div>
            </div>
        </div>
    ), [headerTitle, headerSubtitle])

    return (
        <div className={cn(className)}>
            { renderHeader() }
            { sections.map((sectionProps, i) => (
                <DocsSection key={`${currentSubSection}-${i}`} { ...sectionProps } />
            ))}
        </div>
    )
}

export default DocsBody