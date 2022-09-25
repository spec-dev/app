import React, { useCallback } from 'react'
import { getPCN } from '../../utils/classes'
import { paths, liveObjectsSubSections } from '../../utils/nav'
import { Link } from 'react-router-dom'

const className = 'live-objects-panel'
const pcn = getPCN(className)

const sections = [
    {
        title: 'General',
        id: 'general',
        items: [
            {
                title: 'Ecosystem',
                subSection: liveObjectsSubSections.OBJECT_ECOSYSTEM,
                to: paths.toLiveObjects(liveObjectsSubSections.OBJECT_ECOSYSTEM)
            },
        ],
    },
    {
        title: 'My Objects',
        id: 'my-objects',
        items: [
            {
                title: 'Published',
                subSection: liveObjectsSubSections.PUBLISHED,
                to: paths.toLiveObjects(liveObjectsSubSections.PUBLISHED)
            },
            {
                title: 'Local',
                subSection: liveObjectsSubSections.LOCAL,
                to: paths.toLiveObjects(liveObjectsSubSections.LOCAL)
            },
        ],
    },
]

function LiveObjectsPanel(props) {
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
            <div className={pcn('__new-object-button')}>
                <span>
                    <span>+</span>
                    <span>New Object</span>
                </span>
            </div>
        </div>
    )
}

export default LiveObjectsPanel