import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react'
import { cn, getPCN } from '../../utils/classes'
import Slider from '../shared/sliders/Slider'
import SelectLiveColumnFormatterPanel from '../shared/panels/SelectLiveColumnFormatterPanel'
import TransformObjectPanel from '../shared/panels/TransformObjectPanel'
import HookPanel from '../shared/panels/HookPanel'
import NewLiveColumnPanel from '../shared/panels/NewLiveColumnPanel'
import { cloneDeep } from 'lodash-es'
import CountUp from 'react-countup'
import { setToStorage } from '../../utils/cache'
import { selectPageRecords } from '../../utils/queries'
import { abbrevColType } from '../../utils/formatters'
import { getLiveColumnsForTable, getLiveColumnLinksOnTable } from '../../utils/config'
import {
    filterIcon,
    blistIcon,
    historyIcon,
    modelRelationshipIcon,
    keyIcon,
    checkIcon,
    linkIcon,
} from '../../svgs/icons'
import api from '../../utils/api'

const className = 'tables-body'
const pcn = getPCN(className)

export const tableStatus = {
    BACKFILLING: {
        id: 'backfilling',
        title: 'Backfilling...',
    },
    POPULATING: {
        id: 'populating',
        title: 'Backfilling...',
    },
    IN_SYNC: {
        id: 'in-sync',
        title: 'In Sync',
    }
}

const colWidthConfig = {
    PIXELS_PER_CHAR: 8,
    ICON_OFFSET: 25,
    IDEAL_NAME_TYPE_GUTTER: 50,
    CHECK_COLUMN_WIDTH: 47,
}

const getColHeaderIcon = (
    isLinkColumn,
    isPrimaryKey,
    isForeignKey,
) => {
    if (isLinkColumn) {
        return [linkIcon, 'link']
    }
    if (isPrimaryKey) {
        return [keyIcon, 'key']
    }
    if (isForeignKey) {
        return [modelRelationshipIcon, 'rel']
    }
    return [null, null]
}

const compileLiveColumnDataForTable = (table, config) => {
    if (!table?.name) return {}

    // Get the live columns and link columns related to this table.
    const liveColumns = getLiveColumnsForTable(table.schema, table.name, config)
    const linkColumns = getLiveColumnLinksOnTable(table.schema, table.name, config)

    for (const linkColumn of linkColumns) {
        liveColumns[linkColumn.column] = {
            ...(liveColumns[linkColumn.column] || linkColumn.liveObject),
            targetTablePath: linkColumn.targetTablePath,
            isLinkColumn: true,
            isSeedColumn: !!linkColumn.isSeedColumn,
        }
    }

    return liveColumns
}

const getColumnWidths = (table, liveColumns, primaryKeyColNames, foreignKeyColNames) => {
    if (!table?.columns) return []
    
    const widths = []
    for (const col of table.columns) {
        let numChars = col.name.length
        const liveColumnData = liveColumns[col.name]
        const isLiveOrLinkColumn = !!liveColumnData
        const isPrimaryKey = primaryKeyColNames.has(col.name)
        const isForeignKey = foreignKeyColNames.has(col.name)
        const hasIcon = isLiveOrLinkColumn || isPrimaryKey || isForeignKey
        const numColTypeChars = (liveColumnData?.givenName || abbrevColType(col.data_type)).length
        numChars += numColTypeChars
        const colWidth = (
            (numChars * colWidthConfig.PIXELS_PER_CHAR) + 
            (hasIcon ? colWidthConfig.ICON_OFFSET : 0) +
            colWidthConfig.IDEAL_NAME_TYPE_GUTTER
        )
        widths.push(colWidth)
    }

    return widths
}

const timing = {
    rowFadeInDelay: 35,
}

function TablesBody(props) {
    // Props.
    const { schema, config = {}, seedCursors = [] } = props

    // State.
    const [table, setTable] = useState(props.table || {})
    const [status, setStatus] = useState(props.status || tableStatus.IN_SYNC.id)
    const [records, setRecords] = useState(props.records || null)

    // Constraints.
    const primaryKeyColNames = useMemo(() => new Set((table?.primary_keys || []).map(pk => pk.name)), [table])
    const foreignKeyColNames = useMemo(() => new Set((table?.relationships || []).filter(
        rel => rel.source_table_name === table.name
    ).map(rel => rel.source_column_name)), [table])
    
    // Live column info.
    const liveColumns = useMemo(() => compileLiveColumnDataForTable(table, config), [table, config])
    const hasLiveColumns = useMemo(() => Object.keys((
        (config?.tables || {})[schema] || {})[table.name] || {}
    ).length > 0, [config, schema, table])

    // Sizing.
    const columnWidths = useMemo(() => getColumnWidths(
        table, 
        liveColumns,
        primaryKeyColNames,
        foreignKeyColNames,
    ), [table, liveColumns])
    const gridTemplateColumnsValue = useMemo(() => [
        colWidthConfig.CHECK_COLUMN_WIDTH, ...columnWidths
    ].map(w => `${w}px`).join(' '), [columnWidths])

    // Refs.
    const newLiveColumnSliderRef = useRef()
    const newLiveColumnPanelRef = useRef()
    const selectLiveColumnFormatterPanelRef = useRef()
    const selectLiveColumnFormatterSliderRef = useRef()
    const configureLiveColumnFormatterArgs = useRef([])
    const transformObjectSliderRef = useRef()
    const transformObjectPanelRef = useRef()
    const hookSliderRef = useRef()

    const addTransform = useCallback(liveObjectSpec => {
        window.liveObjectSpec = liveObjectSpec
        transformObjectSliderRef.current?.show()
    }, [])

    const addHook = useCallback(liveObjectSpec => {
        window.liveObjectSpec = liveObjectSpec
        hookSliderRef.current?.show()
    }, [])

    const onCreateNewLiveColumns = useCallback((liveObjectSpec, addedCols) => {
        const newTable = cloneDeep(table)
        const liveSourcesSelected = {}
        for (let c of addedCols) {
            liveSourcesSelected[c.formatter?.config?.key ? c.formatter.config.key : c.dataSource] = c
        }

        let newCols = []
        for (let col of newTable.columns) {
            // Put live source on linked column.
            if (col.isLiveLinkColumn) {
                col.liveSource = liveObjectSpec.name
            } else if (col.hide && col.liveSource && liveSourcesSelected[col.liveSource]) {
                col.hide = false
                col.name = liveSourcesSelected[col.liveSource].columnName
            }
            newCols.push(col)
        }

        // Update table.
        newTable.columns = newCols
        newTable.status = tableStatus.BACKFILLING
        newTable.liveObjectSpec = liveObjectSpec

        setTable(newTable)
        setToStorage(newTable.name, newTable)

        // Hide slider.
        setTimeout(() => {
            newLiveColumnSliderRef.current?.hide()
        }, 1)
    }, [table])

    const onNewLiveColumnSliderShown = useCallback(() => {
        setTimeout(() => {
            newLiveColumnPanelRef.current?.focusSearchBar()
        }, 400)
    }, [])

    const selectLiveColumnFormatter = useCallback((liveObjectSpec, property, cb) => {
        if (selectLiveColumnFormatterPanelRef.current) {
            selectLiveColumnFormatterPanelRef.current.configure(liveObjectSpec, property, cb)
        } else {
            configureLiveColumnFormatterArgs.current = [liveObjectSpec, property, cb]
        }
        selectLiveColumnFormatterSliderRef.current?.show()
    }, [])

    const loadPageRecords = useCallback(async () => {
        const { data, ok } = await api.meta.query({ query: selectPageRecords(table.name, 0) })
        if (!ok) {
            // TODO: Log/display error
            setRecords([])
            return
        }
        setRecords(data)
    }, [table])

    useEffect(() => {
        if (!props.table) return
        if (props.table.name !== table.name) {
            setTable(props.table)
            setRecords(null)
            return
        }

        // Backfilling -> Populating
        if (status === tableStatus.BACKFILLING.id) {
            setTimeout(() => {
                const newTable = cloneDeep(table)
                newTable.status = tableStatus.POPULATING
                setTable(newTable)
                setToStorage(newTable.name, newTable)
            }, 2200)
        }
        // Populating -> In-Sync
        else if (status === tableStatus.POPULATING.id) {
            setTimeout(() => {
                const newTable = cloneDeep(table)
                newTable.status = tableStatus.IN_SYNC
                setTable(newTable)
                setToStorage(newTable.name, newTable)
            }, (records?.length || 0) * timing.rowFadeInDelay + 400)
        }
    }, [table, props.table, status, records])

    useEffect(() => {
        if (table?.name && records === null) {
            loadPageRecords()
        }
    }, [table, records, loadPageRecords])

    const renderStatus = useCallback(() => (
        <div className={pcn('__header-status-container')}>
            <div className={pcn('__header-status', `__header-status--backfilling`)}>
                <span>{ tableStatus.BACKFILLING.title }</span>
            </div>
            <div className={pcn('__header-status', `__header-status--in-sync`)}>
                <span
                    className={pcn('__header-status-icon', '__header-status-icon--check')}
                    dangerouslySetInnerHTML={{ __html: checkIcon }}>
                </span>
                <span>{ tableStatus.IN_SYNC.title }</span>
            </div>
        </div>
    ), [])

    const renderNumRecords = useCallback((mod) => {
        const numRecords = records?.length || 0

        let start = 0
        let end = 0
        if (status === tableStatus.POPULATING.id) {
            end = numRecords
        } else if (status === tableStatus.IN_SYNC.id) {
            start = numRecords
            end = numRecords
        }

        let style = {}
        if (records === null) {
            style = { display: 'none' }
        }

        return (
            <div className={pcn(`__${mod}-num-records`)}>
                <CountUp start={start} end={end} delay={0} duration={(numRecords * timing.rowFadeInDelay) / 1000}>
                    {({ countUpRef }) => (
                        <span>
                            <span style={style} ref={countUpRef}></span>
                            <span>{ `${records === null ? '-- ' : ''}Record${numRecords !== 1 ? 's' : ''}` }</span>
                        </span>
                    )}
                </CountUp>
            </div>
        )
    }, [table, status, records])

    const renderFilterButton = useCallback(() => (
        <div className={pcn('__filter-button')}>
            <span dangerouslySetInnerHTML={{ __html: filterIcon }}></span>
            <span>Filter</span>
        </div>
    ), [])

    const renderSortButton = useCallback(() => (
        <div className={pcn('__sort-button')}>
            <span dangerouslySetInnerHTML={{ __html: blistIcon }}></span>
            <span>Sort</span>
        </div>
    ), [])

    const renderLinkObjectButton = useCallback(() => (
        <div className={pcn('__header-new-col-button')}>
            <span id='newColDropdownTarget' onClick={() => newLiveColumnSliderRef.current?.show() }>
                <span>+</span>
                <span>Link Live Data</span>
            </span>
        </div>
    ), [])

    const renderHistoryButton = useCallback(() => (
        <div className={pcn('__history-button')}>
            <span dangerouslySetInnerHTML={{ __html: historyIcon }}></span>
            <span>History</span>
        </div>
    ), [])

    const renderColHeaders = useCallback(() => {
        const colHeaders = [(
            <div key='check' className={pcn('__col-header', '__col-header--check-col')}>
                <span></span>
            </div>
        )]

        table.columns.forEach(col => {
            const liveColumnData = liveColumns[col.name]
            const isLiveOrLinkColumn = !!liveColumnData
            const isLinkColumn = liveColumnData?.isLinkColumn
            const isPrimaryKey = primaryKeyColNames.has(col.name)
            const isForeignKey = foreignKeyColNames.has(col.name)
            const [icon, mod] = getColHeaderIcon(isLinkColumn, isPrimaryKey, isForeignKey)
            const colType = liveColumnData?.givenName || abbrevColType(col.data_type)
            
            colHeaders.push((
                <div
                    key={col.name}
                    className={pcn(
                        '__col-header',
                        isLiveOrLinkColumn ? '__col-header--live' : '',
                        isLinkColumn ? '__col-header--live-link' : '',
                        isPrimaryKey ? '__col-header--primary' : '',
                    )}>
                    { icon &&
                        <span
                            className={pcn('__col-header-type-icon', `__col-header-type-icon--${mod}`)}
                            dangerouslySetInnerHTML={{ __html: icon }}>
                        </span>
                    }
                    { !icon && isLiveOrLinkColumn && !isLinkColumn && status === tableStatus.IN_SYNC.id &&
                        <span className='blink-indicator'><span></span></span>
                    }
                    { !icon && isLiveOrLinkColumn && !isLinkColumn && status !== tableStatus.IN_SYNC.id &&
                        <span className={pcn('__col-header-type-icon', `__col-header-type-icon--circle`)}><span></span></span>
                    }
                    <span className={pcn('__col-header-name')}>{col.name}</span>
                    <span className={pcn('__col-header-type')}>
                        <span>{ colType }</span>
                    </span>
                </div>
            ))
        })
        
        return colHeaders
    }, [table, status, liveColumns])

    const renderRecords = useCallback(() => records?.map((record, i) => {
        const cells = [(
            <div key='check' className={pcn('__cell', '__cell--check-col')}>
                <span></span>
            </div>
        )]

        const delay = i * timing.rowFadeInDelay

        table.columns.forEach(col => {
            let value = record[col.name]
            if (value === null) {
                value = 'NULL'
            } else if (value === true || value === false) {
                value = value.toString()
            } else if (!value) {
                value = ''
            }

            const liveColumnData = liveColumns[col.name]
            const isLiveOrLinkColumn = !!liveColumnData
            const isLinkColumn = liveColumnData?.isLinkColumn
            const isPrimaryKey = primaryKeyColNames.has(col.name)

            cells.push((
                <div
                    key={col.name}
                    className={pcn(
                        '__cell', 
                        isLiveOrLinkColumn ? '__cell--live' : '',
                        isLinkColumn ? '__cell--live-link' : '',
                        value === 'NULL' ? '__cell--null' : '',
                        isPrimaryKey ? '__cell--primary' : '',
                    )}>
                    <span style={{ transition: `opacity 0.25s ease ${hasLiveColumns ? 0 : delay}ms, color 0.25s ease 0s` }}>
                        { value }
                    </span>
                </div>
            ))
        })

        return (
            <div
                key={i}
                className={pcn('__row')}
                style={ hasLiveColumns && status === tableStatus.POPULATING.id 
                    ? { transition: `opacity 0.25s ease ${delay}ms`, gridTemplateColumns: gridTemplateColumnsValue } 
                    : { gridTemplateColumns: gridTemplateColumnsValue } 
                }>
                { cells }
            </div>
        )
    }) || [], [table, status, records, hasLiveColumns, liveColumns, gridTemplateColumnsValue])

    const renderTableLoading = useCallback(() => (
        <div className={pcn('__table-loading')}>
            <div className='indeterminate'></div>
        </div>
    ), [])

    if (!table || !Object.keys(table).length) {
        return <div className={className}></div>
    }

    return (
        <div className={cn(
            className,
            `${className}--${status}`,
            records === null ? `${className}--loading` : '',
        )}>
            <div className={pcn('__header')}>
                <div className={pcn('__header-left')}>
                    <div className={pcn('__header-left-liner')}>
                        <div className={pcn('__header-left-top')}>
                            <div className={pcn('__table-name')}>
                                <span>{ table.name }</span>
                            </div>
                            <div className={pcn('__table-desc')}>
                                <span>{ table.comment || <i>No description</i> }</span>
                            </div>
                        </div>
                        <div className={pcn('__header-left-bottom')}>
                            { hasLiveColumns && renderStatus() }
                            { renderNumRecords('header') }
                            { renderFilterButton() }
                            { renderSortButton() }
                            { renderLinkObjectButton() }
                        </div>
                    </div>
                </div>
                <div className={pcn('__header-right')}>
                    <div className={pcn('__header-right-liner')}>
                        <div className={pcn('__header-right-bottom')}>
                            { renderHistoryButton() }
                        </div>
                    </div>
                </div>
            </div>
            <div className={pcn('__main')}>
                <div className={pcn('__col-headers')} style={{ gridTemplateColumns: gridTemplateColumnsValue }}>
                    { status === tableStatus.BACKFILLING.id && renderTableLoading() }
                    { renderColHeaders() }
                </div>
                <div className={pcn('__records')}>
                    { renderRecords() }
                </div>
            </div>
            <div className={pcn('__footer')}>
                <div className={pcn('__footer-liner')}>
                    <div className={pcn('__footer-num-records')}>
                        { renderNumRecords('footer') }
                    </div>    
                </div>
            </div>
            <Slider
                id='newLiveColumnSlider'
                ref={newLiveColumnSliderRef}
                onShown={onNewLiveColumnSliderShown}>
                <NewLiveColumnPanel
                    table={table}
                    onCreate={onCreateNewLiveColumns}
                    onCancel={() => newLiveColumnSliderRef.current?.hide()}
                    selectLiveColumnFormatter={selectLiveColumnFormatter}
                    addTransform={addTransform}
                    addHook={addHook}
                    ref={newLiveColumnPanelRef}
                />
            </Slider>
            <Slider
                id='selectLiveColumnFormatterSlider'
                ref={selectLiveColumnFormatterSliderRef}>
                <SelectLiveColumnFormatterPanel
                    onDone={() => selectLiveColumnFormatterSliderRef.current?.hide()}
                    ref={r => {
                        selectLiveColumnFormatterPanelRef.current = r
                        if (selectLiveColumnFormatterPanelRef.current &&
                            configureLiveColumnFormatterArgs.current?.length > 0) {
                            selectLiveColumnFormatterPanelRef.current.configure(...configureLiveColumnFormatterArgs.current)
                        }
                    }}
                />
            </Slider>
            <Slider
                id='transformObjectSlider'
                ref={transformObjectSliderRef}>
                <TransformObjectPanel
                    onCancel={() => transformObjectSliderRef.current?.hide()}
                    onDone={() => transformObjectSliderRef.current?.hide()}
                    ref={transformObjectPanelRef}
                />
            </Slider>
            <Slider
                id='hookSlider'
                ref={hookSliderRef}>
                <HookPanel
                    onCancel={() => hookSliderRef.current?.hide()}
                    onDone={() => hookSliderRef.current?.hide()}
                />
            </Slider>
        </div>
    )
}

export default TablesBody