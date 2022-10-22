import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { cn, getPCN } from '../../utils/classes'
import { paths, sections } from '../../utils/nav'
import TablesPanel from '../tables/TablesPanel'
import TablesBody from '../tables/TablesBody'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import { getCurrentProject, getCurrentSchemaName } from '../../utils/cache'
import { getSchema, resolveSchema } from '../../utils/schema'
import {
    barChartIcon,
    blistIcon,
    dbIcon,
    documentIcon,
    gearIcon,
    homeIcon,
    tableEditorIcon,
    terminalIcon,
    userIcon,
    specIcon,
    helpIcon,
    bubbleIcon,
} from '../../svgs/icons'

const className = 'dashboard'
const pcn = getPCN(className)

const getSidePanelHeaderTitle = section => {
    switch (section) {
        case sections.TABLES:
            return 'Tables'
        default:
            return ''
    }
}

function DashboardPage(props) {
    const params = (props.match || {}).params || {}

    const projectId = useMemo(() => params.projectId, [params])
    const currentSection = useMemo(() => params.section || sections.TABLES, [params])
    const currentSubSection = useMemo(() => params.subSection || null, [params])
    const currentProject = useMemo(() => getCurrentProject(), [projectId])

    const [tables, setTables] = useState(getSchema(getCurrentSchemaName()))
    const tableNames = useMemo(() => tables?.map(t => t.name) || null, [tables])

    const currentTable = useMemo(() => {
        if (currentSection !== sections.TABLES) return null
        return tables?.find(t => t.name === currentSubSection) || null
    }, [projectId, currentSection, currentSubSection, tables])
    
    const currentTableIndex = useMemo(() => {
        if (!tableNames || !currentTable) return 0
        return Math.max(tableNames.indexOf(currentTable.name), 0)
    }, [tableNames, currentTable])

    useEffect(async () => {
        if (currentSection === sections.TABLES && !tables) {
            const { data, ok } = await resolveSchema(getCurrentSchemaName())
            if (!ok) {
                // TODO: Show error.
                return
            }
            setTables(data)
        }
    }, [projectId, currentSection, tables])

    const renderSideNav = useCallback(() => (
        <div className={pcn('__side-nav')}>
            <div className={pcn('__side-nav-liner')}>
                <Link dangerouslySetInnerHTML={{ __html: specIcon }}></Link>
                <Link dangerouslySetInnerHTML={{ __html: homeIcon }}></Link>
                <span></span>
                <Link
                    className={ currentSection === sections.TABLES ? '--selected' : '' } 
                    dangerouslySetInnerHTML={{ __html: tableEditorIcon }}
                    // TODO: This needs to be set to the last visited table
                    to={paths.toTables()}>
                </Link>
                <Link>
                    <span>{'{}'}</span>
                </Link>
                <Link dangerouslySetInnerHTML={{ __html: terminalIcon }}></Link>
                <Link dangerouslySetInnerHTML={{ __html: dbIcon }}></Link>
                <span></span>
                <Link dangerouslySetInnerHTML={{ __html: blistIcon }}></Link>
                <Link dangerouslySetInnerHTML={{ __html: barChartIcon }}></Link>
                <Link dangerouslySetInnerHTML={{ __html: documentIcon }}></Link>
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
                        projectId={projectId}
                        tableNames={tableNames}
                        currentTableIndex={currentTableIndex}
                    />
                )
            default:
                return null
        }
    }, [currentSection, tableNames, currentTableIndex])

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
                return (
                    <TablesBody
                        table={currentTable}
                    />
                )
            default:
                return null
        }
    }, [currentSection, currentTable])

    const renderHeaderProjectPath = useCallback(() => currentProject?.org && currentProject?.name ? (
        <div className={pcn('__project-path')}>
            <span>{ currentProject.org }</span>
            <span>/</span>
            <span>{ currentProject.name }</span>
        </div>
    ) : null, [currentProject])

    const renderContent = useCallback(() => (
        <div className={pcn('__content')}>
            <div className={pcn('__content-liner')}>
                <div className={pcn('__content-header')}>
                    <div className={pcn('__content-header-left')}>
                        { renderHeaderProjectPath() }
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
    ), [currentTable, renderHeaderProjectPath, renderContentBodyComp])

    return (
        <div className={className}>
            <div className={pcn('__liner')}>
                { renderSideNav() }
                { renderSidePanel() }
                { renderContent() }
            </div>
        </div>
    )
}

export default DashboardPage