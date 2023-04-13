import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { cn, getPCN } from '../../utils/classes'
import { paths, sections } from '../../utils/nav'
import TablesPanel from '../tables/TablesPanel'
import TablesBody from '../tables/TablesBody'
import { Link } from 'react-router-dom'
import { getCurrentProject, getCurrentSchemaName } from '../../utils/cache'
import { getSchema, resolveSchema } from '../../utils/schema'
import { updateTableCountWithEvents } from '../../utils/counts'
import { getSeedCursors } from '../../utils/queries'
import { getConfig } from '../../utils/config'
import styles from '../../utils/styles'
import { loader } from '@monaco-editor/react'
import { useHistory } from 'react-router-dom'
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
import api from '../../utils/api'
import Database from 'tauri-plugin-sql-api'
import { appWindow as tauri } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/tauri'

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
    const history = useHistory()
    const params = (props.match || {}).params || {}
    const projectId = useMemo(() => params.projectId, [params])
    const currentSection = useMemo(() => params.section || sections.TABLES, [params])
    const currentSubSection = useMemo(() => params.subSection || null, [params])
    const currentProject = useMemo(() => getCurrentProject(), [projectId])

    const [config, setConfig] = useState(null)
    const [seedCursors, setSeedCursors] = useState([])
    const [currentSchemaName, _] = useState(getCurrentSchemaName())
    const [tables, setTables] = useState(getSchema(currentSchemaName))

    const tableNames = useMemo(() => tables?.map(t => t.name) || null, [tables])
    const tablesBodyRef = useRef()
    const monaco = useRef()
    const navToTable = useRef()

    const currentTable = useMemo(() => {
        if (currentSection !== sections.TABLES) return null
        if (!tables) return null
        return tables.find(t => t.name === currentSubSection) || tables[0]
    }, [projectId, currentSection, currentSubSection, tables])
    
    const currentTableIndex = useMemo(() => {
        if (!tableNames || !currentTable) return 0
        return Math.max(tableNames.indexOf(currentTable.name), 0)
    }, [tableNames, currentTable])

    const refetchTables = useCallback(async (andNavToTable) => {
        const result = await resolveSchema(currentSchemaName)
        if (!result.ok) {
            // Show error
            return
        }

        if (andNavToTable) {
            navToTable.current = andNavToTable
        }

        setTables(result.data)
    }, [currentSchemaName])

    const onSeedCursorsChange = useCallback(events => {
        const eventsBySeedCursorId = {}
        for (const event of events) {
            const seedCursorId = event.data?.id
            if (!seedCursorId) continue
            eventsBySeedCursorId[seedCursorId] = event
        }
        
        const currentSeedCursorIds = seedCursors.map(sc => sc.id)
        const newSeedCursors = []
        for (const seedCursor of seedCursors) {
            const event = eventsBySeedCursorId[seedCursor.id]
            if (!event || event.operation === 'UPDATE') {
                newSeedCursors.push(seedCursor)
            }
        }

        // We only care about newly inserted "seed-table" seed cursors.
        events.filter(
            e => e.operation === 'INSERT' && 
            e.data?.job_type === 'seed-table'
        ).forEach(event => {
            newSeedCursors.push(event.data)
        })

        // Ignore updates to existing seed cursors 'cursor' position.
        const changed = currentSeedCursorIds.sort().join(',') !== newSeedCursors.map(sc => sc.id).sort().join(',')
        if (!changed) return

        setSeedCursors(newSeedCursors)
    }, [seedCursors])

    const onTableDataChange = useCallback(events => {
        if (!currentSchemaName || !currentTable?.name) return
        
        const firstEvent = events[0] || {}
        const eventSchema = firstEvent.schema
        const eventTable = firstEvent.table

        updateTableCountWithEvents(events, [eventSchema, eventTable].join('.'))

        if (eventSchema === currentSchemaName && eventTable === currentTable.name) {
            tablesBodyRef.current?.onDataChange(events)
        }
    }, [currentSchemaName, currentTable])

    const loadMonaco = useCallback(async () => {
        if (monaco.current) return
        monaco.current = await loader.init()
        monaco.current.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: true,
            noSyntaxValidation: true,
        });
        monaco.current.editor.defineTheme('spec', styles.editor.theme)
    }, [])
    
    useEffect(() => {
        loadMonaco()
    }, [])

    useEffect(async () => {
        const unsubscribe = await tauri.listen('data:change', (event) => {
            console.log('Event', JSON.parse(event?.payload?.message || '{}'))
        })

        const promise = invoke('listen', { url: 'postgres://benwhittle:@localhost:5432/station' })

        return [unsubscribe, promise]
    }, [])
    
    // useEffect(async () => {
    //     if (currentSection === sections.TABLES && !tables) {
    //         const [tablesResult, seedCursorsResult, configData] = await Promise.all([
    //             resolveSchema(getCurrentSchemaName()),
    //             getSeedCursors(),
    //             getConfig(),
    //         ])
    //         if (!tablesResult.ok) {
    //             // TODO: Show error.
    //             return
    //         }
    //         if (!seedCursorsResult.ok) {
    //             // TODO: Show error.
    //             return
    //         }
    //         if (!configData) {
    //             // TODO: Show error
    //             return
    //         }

    //         setSeedCursors(seedCursorsResult.data)
    //         setConfig(configData)
    //         setTables(tablesResult.data)

    //         api.metaSocket.onConfigUpdate = newConfig => setConfig(newConfig)
    //     }
    //     api.metaSocket.onSeedChange = events => events && onSeedCursorsChange(events)
    //     api.metaSocket.onTableDataChange = events => events && onTableDataChange(events) 
    // }, [projectId, currentSection, tables, onSeedCursorsChange, onTableDataChange])

    useEffect(() => {
        if (navToTable.current) {
            const toPath = paths.toTable(projectId, navToTable.current.name)
            navToTable.current = null
            history.push(toPath)
        }
    })

    const renderSideNav = useCallback(() => (
        <div className={pcn('__side-nav')}>
            <div className={pcn('__side-nav-liner')}>
                <div dangerouslySetInnerHTML={{ __html: specIcon }}></div>
                <div dangerouslySetInnerHTML={{ __html: homeIcon }}></div>
                <span></span>
                <Link
                    className={ currentSection === sections.TABLES ? '--selected' : '' } 
                    dangerouslySetInnerHTML={{ __html: tableEditorIcon }}
                    // TODO: This needs to be set to the last visited table
                    to={paths.toTables(projectId)}>
                </Link>
                <div>
                    <span>{'{}'}</span>
                </div>
                <div dangerouslySetInnerHTML={{ __html: terminalIcon }}></div>
                <div dangerouslySetInnerHTML={{ __html: dbIcon }}></div>
                <span></span>
                <div dangerouslySetInnerHTML={{ __html: blistIcon }}></div>
                <div dangerouslySetInnerHTML={{ __html: barChartIcon }}></div>
                <div dangerouslySetInnerHTML={{ __html: documentIcon }}></div>
                <div dangerouslySetInnerHTML={{ __html: gearIcon }}></div>
                <div dangerouslySetInnerHTML={{ __html: userIcon }}></div>
            </div>
        </div>
    ), [currentSection, projectId])

    const renderSidePanelBodyComp = useCallback(() => {
        switch (currentSection) {
            case sections.TABLES:
                return (
                    <TablesPanel
                        projectId={projectId}
                        tableNames={tableNames}
                        currentTableIndex={currentTableIndex}
                        seedCursors={seedCursors}
                        onNewLiveTable={() => tablesBodyRef.current?.onNewLiveTable()}
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
                        schema={currentSchemaName}
                        table={currentTable}
                        tablesLoaded={Array.isArray(tables)}
                        config={config}
                        refetchTables={refetchTables}
                        seedCursor={(seedCursors || []).find(sc => (
                            sc.spec.table_path === `${currentSchemaName}.${currentTable?.name}`
                        ))}
                        ref={tablesBodyRef}
                    />
                )
            default:
                return null
        }
    }, [currentSection, currentTable, config, seedCursors, currentSchemaName, refetchTables])

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