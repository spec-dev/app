import React, { useCallback } from 'react'
import { cn, getPCN } from '../../utils/classes'
import { paths, sections, docsSubSections, liveObjectsSubSections } from '../../utils/nav'
import TablesPanel from '../tables/TablesPanel'
import TablesBody from '../tables/TablesBody'
import barChartIcon from '../../svgs/bar-chart'
import blistIcon from '../../svgs/blist'
import dbIcon from '../../svgs/db'
import docIcon from '../../svgs/document'
import gearIcon from '../../svgs/gear'
import homeIcon from '../../svgs/home'
import tableEditorIcon from '../../svgs/table-editor'
import terminalIcon from '../../svgs/terminal'
import userIcon from '../../svgs/user'
import specIcon from '../../svgs/spec-icon'
import helpIcon from '../../svgs/help'
import bubbleIcon from '../../svgs/bubble'
import { getTable, orderedTableNames } from '../../data/dapps'
import { Link } from 'react-router-dom'
import DocsPanel from '../docs/DocsPanel'
import DocsBody from '../docs/DocsBody'
import LiveObjectsPanel from '../live-objects/LiveObjectsPanel'
import LiveObjectsBody from '../live-objects/LiveObjectsBody'

const className = 'dashboard'
const pcn = getPCN(className)

const getSidePanelHeaderTitle = section => {
    switch (section) {
        case sections.TABLES:
            return 'Table Editor'
        case sections.DOCS:
            return 'API Docs'
        case sections.LIVE_OBJECTS:
            return 'Live Objects'
        default:
            return ''
    }
}

function DashboardPage(props) {
    const params = (props.match || {}).params || {}
    const projectId = params.projectId
    const currentSection = params.section || sections.TABLES
    const currentSubSection = params.subSection || null
    const currentMod = params.mod || null
    const currentTableIndex = Math.max(currentSubSection ? orderedTableNames.indexOf(currentSubSection) : 0, 0)
    const currentTableName = orderedTableNames[currentTableIndex]
    const currentTable = getTable(currentTableName)

    const renderSideNav = useCallback(() => (
        <div className={pcn('__side-nav')}>
            <div className={pcn('__side-nav-liner')}>
                <Link dangerouslySetInnerHTML={{ __html: specIcon }}></Link>
                <Link dangerouslySetInnerHTML={{ __html: homeIcon }}></Link>
                <span></span>
                <Link
                    className={ currentSection === sections.TABLES ? '--selected' : '' } 
                    dangerouslySetInnerHTML={{ __html: tableEditorIcon }}
                    to={paths.toTable('marketplace_listings')}>
                </Link>
                <Link
                    className={ currentSection === sections.LIVE_OBJECTS ? '--selected' : '' } 
                    to={paths.toLiveObjects(liveObjectsSubSections.OBJECT_ECOSYSTEM)}>
                    <span>{'{}'}</span>
                </Link>
                <Link dangerouslySetInnerHTML={{ __html: terminalIcon }}></Link>
                <Link dangerouslySetInnerHTML={{ __html: dbIcon }}></Link>
                <span></span>
                <Link dangerouslySetInnerHTML={{ __html: blistIcon }}></Link>
                <Link dangerouslySetInnerHTML={{ __html: barChartIcon }}></Link>
                <Link
                    className={ currentSection === sections.DOCS ? '--selected' : '' } 
                    dangerouslySetInnerHTML={{ __html: docIcon }}
                    to={paths.toDocs(docsSubSections.REST_API)}>
                </Link>
                <Link dangerouslySetInnerHTML={{ __html: gearIcon }}></Link>
                <Link dangerouslySetInnerHTML={{ __html: userIcon }}></Link>
            </div>
        </div>
    ), [currentSection])

    const renderSidePanelBodyComp = useCallback(() => {
        switch (currentSection) {
            case sections.TABLES:
                return (
                    <TablesPanel
                        tableNames={orderedTableNames}
                        currentTableIndex={currentTableIndex}
                    />
                )
            case sections.DOCS:
                return (
                    <DocsPanel
                        currentSubSection={currentSubSection}
                    />
                )
            case sections.LIVE_OBJECTS:
                return (
                    <LiveObjectsPanel
                        currentSubSection={currentSubSection}
                    />
                )
            default:
                return null
        }
    }, [orderedTableNames, currentTableIndex, currentSection, currentSubSection, currentMod])

    const renderSidePanel = useCallback(() => (
        <div className={pcn('__side-panel')}>
            <div className={pcn('__side-panel-liner')}>
                <div className={pcn('__side-panel-header')}>
                    <span>{ getSidePanelHeaderTitle(currentSection) }</span>
                </div>
                <div className={pcn('__side-panel-body')}>
                    { renderSidePanelBodyComp() }
                </div>
            </div>
        </div>
    ), [renderSidePanelBodyComp, currentSection])

    const renderContentBodyComp = useCallback(() => {
        switch (currentSection) {
            case sections.TABLES:
                return <TablesBody table={currentTable} />
            case sections.DOCS:
                return (
                    <DocsBody currentSubSection={currentSubSection} />
                )
            case sections.LIVE_OBJECTS:
                return (
                    <LiveObjectsBody
                        currentSubSection={currentSubSection}
                        currentMod={currentMod}
                    />
                )
            default:
                return null
        }
    }, [currentTable, currentSection, currentSubSection, currentMod])

    const renderContent = useCallback(() => (
        <div className={pcn('__content')}>
            <div className={pcn('__content-liner')}>
                <div className={pcn('__content-header')}>
                    <div className={pcn('__content-header-left')}>
                        <div className={pcn('__project-path')}>
                            <span>my-org</span>
                            <span>/</span>
                            <span>my-project</span>
                        </div>
                        { currentMod === 'flow' &&
                            <div className={pcn('__side-panel-header')}>
                                <span>Live Object &mdash; Data Flow</span>
                            </div>
                        }
                    </div>
                    <div className={pcn('__content-header-right')}>
                        <div className={pcn('__header-buttons')}>
                            <div className={pcn('__header-button')}>
                                <span dangerouslySetInnerHTML={{ __html: helpIcon }}></span>
                                <span>Help</span>
                            </div>
                            <div className={pcn('__header-button')}>
                                <span dangerouslySetInnerHTML={{ __html: bubbleIcon }}></span>
                                <span>Feedback</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={pcn('__content-body')}>
                    { renderContentBodyComp() }
                </div>
            </div>
        </div>
    ), [currentTable, renderContentBodyComp, currentMod])

    return (
        <div className={cn(className, currentMod === 'flow' ? pcn('--no-side-panel') : '')}>
            <div className={pcn('__liner')}>
                { renderSideNav() }
                { renderSidePanel() }
                { renderContent() }
            </div>
        </div>
    )
}

export default DashboardPage