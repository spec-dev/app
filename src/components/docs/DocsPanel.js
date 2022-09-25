import React, { useCallback } from 'react'
import { getPCN } from '../../utils/classes'
import { paths, docsSubSections } from '../../utils/nav'
import { Link } from 'react-router-dom'
import bookIcon from '../../svgs/book'
import guideIcon from '../../svgs/guide'

const className = 'docs-panel'
const pcn = getPCN(className)

const sections = [
    {
        title: 'Getting Started',
        id: 'getting-started',
        items: [
            {
                title: 'Introduction',
                subSection: docsSubSections.GETTING_STARTED,
                to: paths.toDocs(docsSubSections.GETTING_STARTED)
            },
            {
                title: 'Authentication',
                subSection: docsSubSections.AUTH,
                to: paths.toDocs(docsSubSections.AUTH)
            },
        ],
    },
    {
        title: 'Table APIs',
        id: 'table-apis',
        items: [
            {
                title: 'Introduction',
                subSection: docsSubSections.TABLE_APIS,
                to: paths.toDocs(docsSubSections.TABLE_APIS)
            },
            {
                title: 'REST API',
                subSection: docsSubSections.REST_API,
                to: paths.toDocs(docsSubSections.REST_API)
            },
            {
                title: 'Subscriptions API',
                subSection: docsSubSections.SUBSCRIPTIONS,
                to: paths.toDocs(docsSubSections.SUBSCRIPTIONS)
            },
        ],
    },
    {
        title: 'More',
        id: 'more',
        items: [
            {
                title: 'Guides',
                to: paths.GUIDES,
                isExternal: true,
                icon: guideIcon,
            },
            {
                title: 'API Reference',
                to: paths.API_REFERENCE,
                isExternal: true,
                icon: bookIcon,
            },
        ],
    },
]

function DocsPanel(props) {
    const { currentSubSection } = props

    const renderExtLink = useCallback((item) => (
        <a 
            className={pcn(
                '__section-link', 
                item.icon ? '__section-link--with-icon' : '',
            )}
            key={item.title}
            href={item.to}
            target='_blank'>
            { item.icon && <span dangerouslySetInnerHTML={{ __html: item.icon }}></span> }
            <span>{item.title}</span>
        </a>
    ), [])

    const renderLocalLink = useCallback((item) => (
        <Link 
            className={pcn(
                '__section-link', 
                item.subSection === currentSubSection ? '__section-link--current' : ''
            )}
            key={item.subSection}
            to={item.to}>
            <span>{item.title}</span>
        </Link>
    ), [currentSubSection])

    const renderSection = useCallback((section) => {
        return (
            <div key={section.id} className={pcn('__section', `__section--${section.id}`)}>
                <div className={pcn('__section-title')}>{section.title}</div>
                <div className={pcn('__section-body')}>
                    { section.items.map(item => item.isExternal ? renderExtLink(item) : renderLocalLink(item) ) }
                </div>
            </div>)
    }, [currentSubSection, renderExtLink, renderLocalLink])

    return (
        <div className={className}>
            <div className={pcn('__liner')}>
                { sections.map(renderSection) }
            </div>
        </div>
    )
}

export default DocsPanel