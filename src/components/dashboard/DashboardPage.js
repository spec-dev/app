import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { getPCN } from '../../utils/classes'
import { paths, sections } from '../../utils/nav'
import TablesPanel from '../tables/TablesPanel'
import TablesBody from '../tables/TablesBody'
import { Link } from 'react-router-dom'
import { resolveSchema, DEFAULT_SCHEMA_NAME, specTableNames } from '../../utils/schema'
import { updateTableCountWithEvents } from '../../utils/counts'
import { selectSeedCursors } from '../../sql'
import pm from '../../managers/project/projectManager'
import styles from '../../utils/styles'
import { useHistory } from 'react-router-dom'
import { loader } from '@monaco-editor/react'
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
import useCurrentProject from '../../hooks/useCurrentProject'
import logger from '../../utils/logger'

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
    // Location props.
    const history = useHistory()
    const params = (props.match || {}).params || {}
    const currentSection = useMemo(() => params.section || sections.TABLES, [params])
    const currentSubSection = useMemo(() => params.subSection || null, [params])

    // Current project & associated vars.
    const project = useCurrentProject()
    const config = useMemo(() => project?.config, [project])

    const [seedCursors, setSeedCursors] = useState([])
    const [currentSchemaName, _] = useState(DEFAULT_SCHEMA_NAME)
    const [tables, setTables] = useState(null)

    const tableNames = useMemo(() => tables?.map(t => t.name) || null, [tables])
    const tablesBodyRef = useRef()
    const monaco = useRef()
    const navToTable = useRef()

    const currentTable = useMemo(() => {
        if (currentSection !== sections.TABLES) return null
        if (!tables) return null
        return tables.find(t => t.name === currentSubSection) || tables[0]
    }, [currentSection, currentSubSection, tables])
    
    const currentTableIndex = useMemo(() => {
        if (!tableNames || !currentTable) return 0
        return Math.max(tableNames.indexOf(currentTable.name), 0)
    }, [tableNames, currentTable])

    const refetchTables = useCallback(async (andNavToTable) => {
        logger.info('Fetching tables...')
        const { rows, error } = await resolveSchema(currentSchemaName)
        if (error) {
            logger.error(error)
            return
        }

        if (andNavToTable) {
            navToTable.current = andNavToTable
        }

        setTables(rows)
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

    useEffect(async () => {
        if (monaco.current) return
        monaco.current = await loader.init()
        monaco.current.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: true,
            noSyntaxValidation: true,
        });
        monaco.current.editor.defineTheme('spec', styles.editor.theme)
    }, [])

    useEffect(() => {
        pm.onDataChange = events => {
            console.log('events', events)
            if (!events.length) return
            console.log('Received', events[0].table, events.length)
            const isSeedCursorEvents = events[0].table === specTableNames.SEED_CURSORS
            isSeedCursorEvents ? onSeedCursorsChange(events) : onTableDataChange(events)
        }
    }, [onSeedCursorsChange, onTableDataChange])

    useEffect(async () => {
        if (!project?.id || !project?.env) return

        if (currentSection === sections.TABLES) {
            const { rows, error } = await pm.query(selectSeedCursors())
            if (error) {
                logger.error(error)
                return
            }
            setSeedCursors(rows)
            await refetchTables()
        }
    }, [project?.id, project?.env, refetchTables])

    useEffect(() => {
        if (navToTable.current) {
            const toPath = paths.toTable(navToTable.current.name)
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
                    to={paths.tables}>
                </Link>
                <div>
                    <span>{'{}'}</span>
                </div>
                <span></span>
                <div dangerouslySetInnerHTML={{ __html: blistIcon }}></div>
                <div dangerouslySetInnerHTML={{ __html: documentIcon }}></div>
                <div dangerouslySetInnerHTML={{ __html: gearIcon }}></div>
                <div dangerouslySetInnerHTML={{ __html: userIcon }}></div>
            </div>
        </div>
    ), [currentSection])

    const renderSidePanelBodyComp = useCallback(() => {
        switch (currentSection) {
            case sections.TABLES:
                return (
                    <TablesPanel
                        projectId={project?.id}
                        tableNames={tableNames}
                        currentTableIndex={currentTableIndex}
                        seedCursors={seedCursors}
                        onNewLiveTable={() => tablesBodyRef.current?.onNewLiveTable()}
                    />
                )
            default:
                return null
        }
    }, [currentSection, project, tableNames, currentTableIndex, seedCursors])

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
    }, [currentSection, currentTable, Array.isArray(tables), config, seedCursors, currentSchemaName, refetchTables])

    const renderHeaderProjectPath = useCallback(() => project?.org && project?.name ? (
        <div className={pcn('__project-path')}>
            <span>{ 'my' || project.org }</span>
            <span>/</span>
            <span>{ 'project' || project.name }</span>
        </div>
    ) : null, [project])

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