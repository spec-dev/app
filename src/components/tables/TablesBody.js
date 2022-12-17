import React, { useCallback, useMemo, useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import $ from 'jquery'
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
import { sum } from '../../utils/math'
import { getAllLiveObjects, loadAllLiveObjects } from '../../utils/liveObjects'
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
import Flipper from '../shared/Flipper'
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
    DEFAULT_OFFSET: 25,
    PIXELS_PER_CHAR: 7,
    IDEAL_NAME_TYPE_GUTTER: 35,
    CHECK_COLUMN_WIDTH: 47,
    MIN_WIDTH: 100,
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

const getColumnWidths = (table, liveColumns) => {
    if (!table?.columns) return []
    
    const widths = []
    for (const col of table.columns) {
        let numChars = col.name.length
        const liveColumnData = liveColumns[col.name]
        const numColTypeChars = (liveColumnData?.givenName || abbrevColType(col.data_type)).length
        numChars += numColTypeChars
        const colWidth = (
            colWidthConfig.DEFAULT_OFFSET +
            (numChars * colWidthConfig.PIXELS_PER_CHAR) + 
            colWidthConfig.IDEAL_NAME_TYPE_GUTTER
        )
        widths.push(Math.max(colWidth, colWidthConfig.MIN_WIDTH))
    }

    return widths
}

const defaultInitialStatus = (initialSeedCursor) => {
    if (!initialSeedCursor) return tableStatus.IN_SYNC.id
    return initialSeedCursor.cursor && initialSeedCursor.cursor > 0
        ? tableStatus.POPULATING.id
        : tableStatus.BACKFILLING.id
}

const defaultSortRules = (primaryKeyColNames) => (
    Array.from(primaryKeyColNames).map(column => ({ column, order: 'asc' }))
) 

const timing = {
    rowFadeInDelay: 33,
}

function TablesBody(props, ref) {
    // Props.
    const { schema, config = {} } = props

    // State.
    const [table, setTable] = useState(props.table || {})
    const [status, setStatus] = useState(props.status || defaultInitialStatus(props.seedCursor))
    const [records, setRecords] = useState(props.records || null)

    // Constraints.
    const primaryKeyColNames = useMemo(() => new Set((table?.primary_keys || []).map(pk => pk.name)), [table])
    const foreignKeyColNames = useMemo(() => new Set((table?.relationships || []).filter(
        rel => rel.source_table_name === table.name
    ).map(rel => rel.source_column_name)), [table])

    // Sort & filter rules.
    const [sortRules, setSortRules] = useState(defaultSortRules(primaryKeyColNames))
    
    // Live column info.
    const liveColumns = useMemo(() => compileLiveColumnDataForTable(table, config), [table, config])
    const hasLiveColumns = useMemo(() => Object.keys((
        (config?.tables || {})[schema] || {})[table.name] || {}
    ).length > 0, [config, schema, table])

    // Sizing.
    const columnWidths = useMemo(() => getColumnWidths(table, liveColumns), [table, liveColumns])
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
    const hasEagerLoadedAllLiveObjects = useRef(false)
    const seedCursor = useRef(props.seedCursor || null)
    const backfillingCallback = useRef(null)
    const backfillingTimer = useRef(null)
    const fadeInRowIndexesRange = useRef([])
    const tablesBodyRef = useRef()

    const addTransform = useCallback(liveObjectSpec => {
        window.liveObjectSpec = liveObjectSpec
        transformObjectSliderRef.current?.show()
    }, [])

    const addHook = useCallback(liveObjectSpec => {
        window.liveObjectSpec = liveObjectSpec
        hookSliderRef.current?.show()
    }, [])

    const onSaveLiveColumns = useCallback(() => {
        newLiveColumnSliderRef.current?.hide()
    }, [])

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

    const loadPageRecords = useCallback(async (trackChanges) => {
        let sortBy = sortRules
        if (!sortBy.length && primaryKeyColNames.size) {
            sortBy = defaultSortRules(primaryKeyColNames)
        }
    
        const { data, ok } = await api.meta.query({ 
            query: selectPageRecords(table.name, sortBy)
        })

        if (!ok) {
            // TODO: Log/display error
            fadeInRowIndexesRange.current = []
            setRecords([])
            return
        }

        if (trackChanges && !fadeInRowIndexesRange.current?.length) {
            const prevNumRowsOnPage = records?.length || 0
            const numRowsOnPage = data.length
    
            if (numRowsOnPage <= prevNumRowsOnPage) {
                fadeInRowIndexesRange.current = []
            } else {
                fadeInRowIndexesRange.current = [prevNumRowsOnPage, numRowsOnPage - prevNumRowsOnPage]
            }    
        }

        setRecords(data)
    }, [table, sortRules, primaryKeyColNames, records, status])

    const onDataChange = useCallback(async (events) => {
        await loadPageRecords(true)

        if (status === tableStatus.BACKFILLING.id) {
            const cb = () => {
                setStatus(tableStatus.POPULATING.id)

                const fadeInIndexes = fadeInRowIndexesRange.current || []
                const from = fadeInIndexes[0] || 0
                const to = fadeInIndexes[1] || 0
                const numNewRecords = to - from

                setTimeout(() => {
                    if (seedCursor.current) {
                        $(tablesBodyRef.current).removeClass(`${className}--populating-page`)
                    } else {
                        setStatus(tableStatus.IN_SYNC.id)
                    }
                }, numNewRecords ? (numNewRecords * timing.rowFadeInDelay) : 0)
            }

            if (backfillingTimer.current) {
                backfillingCallback.current = cb
            } else {
                cb()
            }
        }
    }, [loadPageRecords, status])

    useImperativeHandle(ref, () => ({
        onDataChange: events => onDataChange(events),
    }), [onDataChange])

    useEffect(() => {
        if (!props.table) return
        if (props.table.name !== table.name) {
            setTable(props.table)
            setRecords(null)
            return
        }
    }, [table, props.table])
    
    useEffect(() => {
        if (table?.name && records === null) {
            loadPageRecords()
        }
        if (table?.name && !hasEagerLoadedAllLiveObjects.current) {
            hasEagerLoadedAllLiveObjects.current = true
            loadAllLiveObjects()
        }
    }, [table, records, loadPageRecords])

    useEffect(() => {
        if (props.seedCursor) {
            // New seed.
            if (seedCursor.current === null || seedCursor.current.id !== props.seedCursor.id) {
                seedCursor.current = props.seedCursor
                setStatus(tableStatus.BACKFILLING.id)

                backfillingCallback.current = null
                backfillingTimer.current = setTimeout(() => {
                    backfillingTimer.current = null
                    backfillingCallback.current && backfillingCallback.current()
                    backfillingCallback.current = null
                }, 2000)
            }
            // Seed updated.
            else if (seedCursor.current.id === props.seedCursor.id) {
                seedCursor.current = props.seedCursor
            }
        }
        // Seed complete.
        else if (seedCursor.current) {
            seedCursor.current = null
        }
    }, [props.seedCursor])

    useEffect(() => {
        if (status === tableStatus.IN_SYNC.id) {
            if (fadeInRowIndexesRange.current?.length) {
                fadeInRowIndexesRange.current = []
                setTimeout(() => {
                    $(`.${pcn('__row')}--new`).css('opacity', 1)
                    setTimeout(() => {
                        $(`.${pcn('__row')}--new`).removeClass(`${pcn('__row')}--new-accent`)
                    }, 2000)
                }, 10)
            }
        }
    })

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
                <span>Add Live Data</span>
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
                    key={`${table.name}-${col.name}`}
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
                    key={`${table.name}-${col.name}`}
                    className={pcn(
                        '__cell', 
                        isLiveOrLinkColumn ? '__cell--live' : '',
                        isLinkColumn ? '__cell--live-link' : '',
                        value === 'NULL' ? '__cell--null' : '',
                        isPrimaryKey ? '__cell--primary' : '',
                    )}>
                    <span>
                        <Flipper value={value}/>
                    </span>
                </div>
            ))
        })

        const isNew = fadeInRowIndexesRange.current 
            && fadeInRowIndexesRange.current.length 
            && i >= fadeInRowIndexesRange.current[0] 
            && i <= fadeInRowIndexesRange.current[1]

        const delay = (isNew ? Math.max((i - fadeInRowIndexesRange.current[0]), 0) : 0) * timing.rowFadeInDelay
        const isInSync = status === tableStatus.IN_SYNC.id

        return (
            <div
                key={i}
                className={pcn(
                    '__row',
                    isNew  ? '__row--new' : '',
                    isNew && isInSync ? '__row--new-accent' : ''
                )}
                style={ isNew 
                    ? { 
                        transition: `opacity 0.25s ease ${delay}ms`, 
                        gridTemplateColumns: gridTemplateColumnsValue,
                        ...(isInSync ? { opacity: 0 } : {}),
                    } 
                    : { gridTemplateColumns: gridTemplateColumnsValue } 
                }>
                { cells }
            </div>
        )
    }) || [], [table, status, records, hasLiveColumns, liveColumns, gridTemplateColumnsValue])

    const renderTableLoading = useCallback(() => {
        const maxWidth = sum([colWidthConfig.CHECK_COLUMN_WIDTH, ...columnWidths])
        return (
            <div className={pcn('__table-loading')} style={{ maxWidth: `${maxWidth}px` }}>
                <div className='indeterminate'></div>
            </div>
        )
    }, [columnWidths])

    if (!table || !Object.keys(table).length) {
        return <div className={className}></div>
    }

    return (
        <div className={cn(
            className,
            `${className}--${status}`,
            status === tableStatus.POPULATING.id ? `${className}--populating-page` : '',
            records === null ? `${className}--loading` : '',
        )} ref={tablesBodyRef}>
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
                    { renderTableLoading() }
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
                    schema={schema}
                    onSave={onSaveLiveColumns}
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

TablesBody = forwardRef(TablesBody)
export default TablesBody