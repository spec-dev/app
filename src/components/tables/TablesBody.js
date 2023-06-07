import React, {
    useCallback,
    useMemo,
    useState,
    useRef,
    useEffect,
    useImperativeHandle,
    forwardRef,
} from 'react'
import $ from 'jquery'
import { cn, getPCN } from '../../utils/classes'
import Slider from '../shared/sliders/Slider'
import NewLiveColumnPanel, { referrers } from '../shared/panels/NewLiveColumnPanel'
import CountUp from 'react-countup'
import NewColumnDropdown from '../shared/dropdowns/NewColumnDropdown'
import pm from '../../managers/project/projectManager'
import { selectTableRecords, selectTableCount } from '../../sql'
import { sum } from '../../utils/math'
import { displayColType, isJSONColumn } from '../../utils/colTypes'
import { getNewCount, tableCounts } from '../../utils/counts'
import { stringify } from '../../utils/json'
import { loadAllLiveObjects } from '../../utils/liveObjects'
import EditColumnPanel from '../shared/panels/EditColumnPanel'
import { MultiGrid, InfiniteLoader, AutoSizer } from 'react-virtualized'

import { getLiveColumnsForTable, getLiveColumnLinksOnTable } from '../../utils/config'
import {
    filterIcon,
    blistIcon,
    historyIcon,
    modelRelationshipIcon,
    keyIcon,
    checkIcon,
    specIcon,
    linkIcon,
} from '../../svgs/icons'
import Flipper from '../shared/Flipper'
import { pendingSeeds } from '../../utils/pendingSeeds'
import constants from '../../constants'
import { noop } from '../../utils/nodash'
import { hasTableBeenSeeded, markTableAsSeeded } from '../../utils/cache'
import logger from '../../utils/logger'

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
    },
}

const colWidthConfig = {
    DEFAULT_OFFSET: 25,
    PIXELS_PER_CHAR: 7,
    IDEAL_NAME_TYPE_GUTTER: 35,
    CHECK_COLUMN_WIDTH: 47,
    NEW_COLUMN_WIDTH: 105,
    MIN_WIDTH: 100,
}

const ROW_HEIGHT = 36

const getColHeaderIcon = (isLinkColumn, isPrimaryKey, isForeignKey) => {
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

const didColumnsChange = (newCols, oldCols) => {
    if (newCols.length !== oldCols.length) return true

    for (let i = 0; i < newCols.length; i++) {
        const newCol = newCols[i]
        const oldCol = oldCols[i]

        if (newCol.name !== oldCol.name || newCol.data_type !== oldCol.data_type) {
            return true
        }
    }

    return false
}

const getColumnWidths = (table, liveColumns) => {
    if (!table?.columns) return []

    const widths = []
    for (const col of table.columns) {
        let numChars = col.name.length
        const liveColumnData = liveColumns[col.name]
        const numColTypeChars = (liveColumnData?.givenName || displayColType(col.data_type)).length
        numChars += numColTypeChars
        const colWidth =
            colWidthConfig.DEFAULT_OFFSET +
            numChars * colWidthConfig.PIXELS_PER_CHAR +
            colWidthConfig.IDEAL_NAME_TYPE_GUTTER
        widths.push(Math.max(colWidth, colWidthConfig.MIN_WIDTH))
    }

    return widths
}

const defaultInitialStatus = (initialSeedCursor, schema, tableName) => {
    const tablePath = [schema, tableName].join('.')
    if (pendingSeeds.has(tablePath)) {
        pendingSeeds.delete(tablePath)
        return tableStatus.BACKFILLING.id
    }

    if (!initialSeedCursor) return tableStatus.IN_SYNC.id
    return tableStatus.BACKFILLING.id
}

const defaultSortRules = (primaryKeyColNames) =>
    Array.from(primaryKeyColNames).map((column) => ({ column, order: 'asc' }))

const timing = {
    rowFadeInDelay: 32,
}

function TablesBody(props, ref) {
    // Props.
    const { schema, config = {}, tablesLoaded, refetchTables = noop } = props

    // State.
    const [table, setTable] = useState(props.table || {})
    const [status, setStatus] = useState(
        props.status || defaultInitialStatus(props.seedCursor, schema, table?.name)
    )
    const [records, setRecords] = useState(props.records || null)
    const [count, setCount] = useState(
        table?.name ? tableCounts[[schema, table.name].join('.')] || null : null
    )
    const [liveDataPanelReferrer, setLiveDataPanelReferrer] = useState(referrers.ADD_LIVE_DATA)

    const [hoveredRow, setHoveredRow] = useState(null)

    // Constraints.
    const primaryKeyColNames = useMemo(
        () => new Set((table?.primary_keys || []).map((pk) => pk.name)),
        [table]
    )
    const foreignKeyColNames = useMemo(
        () =>
            new Set(
                (table?.relationships || [])
                    .filter((rel) => rel.source_table_name === table.name)
                    .map((rel) => rel.source_column_name)
            ),
        [table]
    )

    const sortRules = useMemo(() => defaultSortRules(primaryKeyColNames), [primaryKeyColNames])

    // Live column info.
    const liveColumns = useMemo(() => compileLiveColumnDataForTable(table, config), [table, config])
    const hasLiveColumns = useMemo(
        () => Object.keys(((config?.tables || {})[schema] || {})[table.name] || {}).length > 0,
        [config, schema, table]
    )

    // Sizing.
    const columnWidths = useMemo(() => getColumnWidths(table, liveColumns), [table, liveColumns])

    const mainWidth = useMemo(() =>
        sum(
            [
                // colWidthConfig.CHECK_COLUMN_WIDTH,
                ...columnWidths.slice(1),
                colWidthConfig.NEW_COLUMN_WIDTH,
            ],
            [columnWidths]
        )
    )

    // Refs.
    const newLiveColumnSliderRef = useRef()
    const newLiveColumnPanelRef = useRef()
    const editColumnSliderRef = useRef()
    const editColumnPanelRef = useRef()
    const newColumnDropdownRef = useRef()
    const shouldShowLiveDataPanel = useRef(false)
    const extendTableDropdownRef = useRef()
    const configureEditColumnPanelArgs = useRef([])
    const transformObjectSliderRef = useRef()
    const hookSliderRef = useRef()
    const hasEagerLoadedAllLiveObjects = useRef(false)
    const seedCursor = useRef(props.seedCursor || null)
    const backfillingCallback = useRef(null)
    const backfillingTimer = useRef(null)
    const fadeInRowIndexesRange = useRef([])
    const tablesBodyRef = useRef()
    const prevCount = useRef(
        table?.name ? tableCounts[[schema, table.name].join('.')] || null : null
    )
    const fadeInTimer = useRef(null)
    const removeAccentTimer = useRef(null)
    const removePopulatingTimer = useRef(null)
    const nextPageFetchOffset = useRef(null)
    const mainRef = useRef()
    const prevScrollY = useRef(0)
    const resetScroll = useRef(false)
    const isFirstSeed = useRef(false)

    const addTransform = useCallback((liveObjectSpec) => {
        window.liveObjectSpec = liveObjectSpec
        transformObjectSliderRef.current?.show()
    }, [])

    const addHook = useCallback((liveObjectSpec) => {
        window.liveObjectSpec = liveObjectSpec
        hookSliderRef.current?.show()
    }, [])

    const onSaveLiveColumns = useCallback(() => {
        newLiveColumnSliderRef.current?.hide()
    }, [])

    const showLiveDataPanel = useCallback(
        (referrer) => {
            if (liveDataPanelReferrer === referrer) {
                newLiveColumnSliderRef.current?.show()
            } else {
                shouldShowLiveDataPanel.current = true
                setLiveDataPanelReferrer(referrer)
            }
        },
        [liveDataPanelReferrer]
    )

    const onNewLiveColumnSliderShown = useCallback(() => {
        setTimeout(() => {
            newLiveColumnPanelRef.current?.focusSearchBar()
        }, 400)
    }, [])

    const onClickExtendTable = useCallback(() => {
        extendTableDropdownRef.current?.show()
    }, [])

    const onSelectNewColumnType = useCallback(
        ({ id }) => {
            if (id === 'live') {
                showLiveDataPanel(referrers.NEW_LIVE_COLUMN)
            }
        },
        [showLiveDataPanel]
    )

    const showEditColumnSlider = useCallback((column, cb) => {
        if (editColumnPanelRef.current) {
            editColumnPanelRef.current.configure(column, cb)
        } else {
            configureEditColumnPanelArgs.current = [column, cb]
        }
        editColumnSliderRef.current?.show()
    }, [])

    const loadPageRecords = useCallback(
        async (trackChanges) => {
            let sortBy = sortRules
            if (!sortBy.length && primaryKeyColNames.size) {
                sortBy = defaultSortRules(primaryKeyColNames)
            }

            const offset = 0
            const limit = Math.max(records?.length || 0, constants.RECORDS_PER_PAGE)

            const { rows: data, error } = await pm.query(
                selectTableRecords(table.name, sortBy, offset, limit)
            )

            if (error) {
                logger.error(error)
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
                    const rowsPerTableHeight = Math.ceil(
                        $(`.${pcn('__main')}`).height() / ROW_HEIGHT
                    )
                    const rowDelta = numRowsOnPage - prevNumRowsOnPage
                    fadeInRowIndexesRange.current = [
                        prevNumRowsOnPage,
                        prevNumRowsOnPage + Math.max(rowDelta, rowsPerTableHeight),
                    ]
                }
            }

            setRecords(data)
        },
        [schema, table.name, sortRules, primaryKeyColNames, records?.length]
    )

    const fetchNextPage = useCallback(async () => {
        if (!records?.length) return
        if (nextPageFetchOffset.current && records.length <= nextPageFetchOffset.current) {
            return
        }
        nextPageFetchOffset.current = records.length

        let sortBy = sortRules
        if (!sortBy.length && primaryKeyColNames.size) {
            sortBy = defaultSortRules(primaryKeyColNames)
        }

        const { rows: data, error } = await pm.query(
            selectTableRecords(table.name, sortBy, records.length, constants.RECORDS_PER_PAGE)
        )

        if (error) {
            logger.error(error)
            return
        }

        setRecords([...records, ...data])
    }, [schema, table.name, sortRules, records, primaryKeyColNames])

    const loadRecordCount = useCallback(async () => {
        const tablePath = [schema, table.name].join('.')
        const { rows: data, error } = await pm.query(selectTableCount(tablePath))
        if (error) {
            logger.error(error)
            return
        }

        const countResult = (data[0] || {}).count || 0
        if (hasLiveColumns) {
            tableCounts[tablePath] = countResult
        }

        prevCount.current = countResult
        setCount(countResult)
    }, [schema, table])

    const onDataChange = useCallback(
        async (events) => {
            const tablePath = [schema, table.name].join('.')
            if (!tableCounts.hasOwnProperty(tablePath)) {
                tableCounts[tablePath] = getNewCount(count, events)
            }

            if (records !== null && records.length < constants.RECORDS_PER_PAGE) {
                await loadPageRecords(true)
            }

            if (status === tableStatus.BACKFILLING.id) {
                const cb = () => {
                    setStatus(tableStatus.POPULATING.id)
                    setCount(tableCounts[tablePath])
                }
                if (backfillingTimer.current) {
                    backfillingCallback.current = cb
                } else {
                    setTimeout(() => {
                        cb()
                    }, 100)
                }
            } else {
                setCount(tableCounts[tablePath])
            }
        },
        [loadPageRecords, status, schema, table, count, records]
    )

    useImperativeHandle(
        ref,
        () => ({
            onDataChange: (events) => onDataChange(events),
            onNewLiveTable: () => showLiveDataPanel(referrers.NEW_LIVE_TABLE),
        }),
        [onDataChange, showLiveDataPanel]
    )

    useEffect(() => {
        if (props.table?.name !== table.name) {
            if (backfillingTimer.current) {
                clearTimeout(backfillingTimer.current)
                backfillingTimer.current = null
                backfillingCallback.current = null
            }
            if (fadeInTimer.current) {
                clearTimeout(fadeInTimer.current)
                fadeInTimer.current = null
            }
            if (removeAccentTimer.current) {
                clearTimeout(removeAccentTimer.current)
                removeAccentTimer.current = null
            }
            if (removePopulatingTimer.current) {
                clearTimeout(removePopulatingTimer.current)
                removePopulatingTimer.current = null
            }
            fadeInRowIndexesRange.current = []
            nextPageFetchOffset.current = null
            setTable(props.table || {})

            const initialStatus = props.table
                ? defaultInitialStatus(props.seedCursor, schema, props.table.name)
                : tableStatus.IN_SYNC.id

            if (props.table && initialStatus === tableStatus.BACKFILLING.id) {
                isFirstSeed.current = !hasTableBeenSeeded(props.table.id)
            }
            setStatus(initialStatus)
            const nextCount = props.table?.name
                ? tableCounts[[schema, props.table.name].join('.')] || null
                : null
            prevCount.current = nextCount
            setCount(nextCount)
            resetScroll.current = true
            setRecords(null)
            return
        }

        if (props.table && didColumnsChange(props.table.columns, table.columns)) {
            if (backfillingTimer.current) {
                clearTimeout(backfillingTimer.current)
                backfillingTimer.current = null
                backfillingCallback.current = null
            }
            if (fadeInTimer.current) {
                clearTimeout(fadeInTimer.current)
                fadeInTimer.current = null
            }
            if (removeAccentTimer.current) {
                clearTimeout(removeAccentTimer.current)
                removeAccentTimer.current = null
            }
            if (removePopulatingTimer.current) {
                clearTimeout(removePopulatingTimer.current)
                removePopulatingTimer.current = null
            }
            fadeInRowIndexesRange.current = []
            nextPageFetchOffset.current = null
            const newColsExist = props.table.columns.length > table.columns.length
            setTable(props.table)
            setStatus(defaultInitialStatus(props.seedCursor, schema, props.table.name))
        }
    }, [schema, table, props.table, props.seedCursor, primaryKeyColNames, mainWidth])

    useEffect(() => {
        if (table?.name && records === null) {
            if (count === null) {
                loadRecordCount()
            } else {
                prevCount.current = count
            }
            loadPageRecords()
        }
        if (!hasEagerLoadedAllLiveObjects.current) {
            hasEagerLoadedAllLiveObjects.current = true
            loadAllLiveObjects()
        }
    }, [table, records, count, loadPageRecords, loadRecordCount])

    useEffect(() => {
        if (resetScroll.current) {
            resetScroll.current = false
            prevScrollY.current = 0
            if (mainRef.current) {
                $(mainRef.current).scrollLeft(0)
                $(mainRef.current).scrollTop(0)
            }
        }
    }, [records?.length])

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
            if (backfillingTimer.current === null && removePopulatingTimer.current === null) {
                setTimeout(() => {
                    setStatus(tableStatus.IN_SYNC.id)
                }, 1000)
            }
        }
    }, [props.seedCursor])

    useEffect(() => {
        if (shouldShowLiveDataPanel.current) {
            shouldShowLiveDataPanel.current = false
            newLiveColumnSliderRef.current?.show()
        }
    })

    useEffect(() => {
        if (status === tableStatus.POPULATING.id) {
            const fadeInIndexes = fadeInRowIndexesRange.current || []
            const from = fadeInIndexes[0] || 0
            const to = fadeInIndexes[1] || 0
            const numNewRecords = to - from
            removePopulatingTimer.current = setTimeout(
                () => {
                    removePopulatingTimer.current = null
                    if (!seedCursor.current) {
                        setStatus(tableStatus.IN_SYNC.id)
                    }
                },
                numNewRecords ? numNewRecords * timing.rowFadeInDelay : 0
            )
        }
    }, [status])

    useEffect(() => {
        if (status === tableStatus.IN_SYNC.id) {
            if (fadeInRowIndexesRange.current?.length) {
                if (isFirstSeed.current) {
                    isFirstSeed.current = false
                    markTableAsSeeded(props.table.id)
                    fadeInRowIndexesRange.current = []
                } else {
                    fadeInTimer.current = setTimeout(() => {
                        $(`.${pcn('__row')}--new`).css('opacity', 1)
                        fadeInRowIndexesRange.current = []
                        removeAccentTimer.current = setTimeout(() => {
                            $(`.${pcn('__row')}--new`).removeClass(`${pcn('__row')}--new-accent`)
                        }, 500)
                    }, 10)
                }
            }
        }
    })

    const renderStatus = useCallback(
        () => (
            <div className={pcn('__header-status-container')}>
                <div className={pcn('__header-status', `__header-status--backfilling`)}>
                    <span>
                        {isFirstSeed.current ? tableStatus.BACKFILLING.title : 'Syncing...'}
                    </span>
                </div>
                <div className={pcn('__header-status', `__header-status--in-sync`)}>
                    <span
                        className={pcn('__header-status-icon', '__header-status-icon--check')}
                        dangerouslySetInnerHTML={{ __html: checkIcon }}
                    ></span>
                    <span>{tableStatus.IN_SYNC.title}</span>
                </div>
            </div>
        ),
        []
    )

    const renderNumRecords = useCallback(
        (mod) => {
            let start = prevCount.current || 0
            let end = count || 0

            if (start !== end) {
                prevCount.current = end
            }

            let duration = 0
            if (end > start) {
                duration = (end - start) / 1000
                const fadeInIndexes = fadeInRowIndexesRange.current || []
                const from = fadeInIndexes[0] || 0
                const to = fadeInIndexes[1] || 0
                const numNewRecords = to - from
                if (numNewRecords) {
                    duration = (numNewRecords * timing.rowFadeInDelay) / 1000
                }
            }

            return (
                <div className={pcn(`__${mod}-num-records`)}>
                    <CountUp start={start} end={end} delay={0} duration={duration} separator=",">
                        {({ countUpRef }) => (
                            <span>
                                <span
                                    style={count === null ? { display: 'none' } : {}}
                                    ref={countUpRef}
                                ></span>
                                <span>{`${count === null ? '-- ' : ''}Record${
                                    count !== 1 ? 's' : ''
                                }`}</span>
                            </span>
                        )}
                    </CountUp>
                </div>
            )
        },
        [count]
    )

    const renderFilterButton = useCallback(
        () => (
            <div className={pcn('__filter-button')}>
                <span dangerouslySetInnerHTML={{ __html: filterIcon }}></span>
                <span>Filter</span>
            </div>
        ),
        []
    )

    const renderSortButton = useCallback(
        () => (
            <div className={pcn('__sort-button')}>
                <span dangerouslySetInnerHTML={{ __html: blistIcon }}></span>
                <span>Sorts</span>
            </div>
        ),
        []
    )

    const renderLinkObjectButton = useCallback(
        () => (
            <div className={pcn('__header-new-col-button')}>
                <span
                    id="newColDropdownTarget"
                    onClick={() => showLiveDataPanel(referrers.ADD_LIVE_DATA)}
                >
                    <span>+</span>
                    <span>Add Live Data</span>
                </span>
            </div>
        ),
        [showLiveDataPanel]
    )

    const renderCell = useCallback(
        ({ columnIndex, key, rowIndex, style }) => {
            rowIndex -= 1
            columnIndex -= 1

            const hoverClass = hoveredRow === rowIndex ? '__cell--hover' : ''
            const handleMouseOver = () => {
                console.log('handleMouseOver', rowIndex)
                setHoveredRow(rowIndex)
            }
            const handleMouseOut = () => {
                setHoveredRow(null)
            }

            const renderNewColumn = () => (
                <div
                    key={key}
                    style={style}
                    className={pcn('__col-header', '__col-header--new-col', hoverClass)}
                    onMouseOver={handleMouseOver}
                    onMouseOut={handleMouseOut}
                >
                    <span
                        id="extendTableDropdownTarget"
                        onClick={() => showLiveDataPanel(referrers.NEW_LIVE_COLUMN)}
                    >
                        <span>+</span>
                    </span>
                    <NewColumnDropdown
                        key="extendTableDropdown"
                        id="extendTableDropdown"
                        onSelectOption={onSelectNewColumnType}
                        ref={extendTableDropdownRef}
                    />
                </div>
            )

            const renderCheckColumn = () => (
                <div
                    key={key}
                    style={style}
                    className={pcn('__col-header', '__col-header--check-col', hoverClass)}
                    onMouseOver={handleMouseOver}
                    onMouseOut={handleMouseOut}
                >
                    <span></span>
                </div>
            )

            const renderHeader = () => {
                const col = table.columns[columnIndex]
                const liveColumnData = liveColumns[col.name]
                const isLiveOrLinkColumn = !!liveColumnData
                const isLinkColumn = liveColumnData?.isLinkColumn
                const isPrimaryKey = primaryKeyColNames.has(col.name)
                const isForeignKey = foreignKeyColNames.has(col.name)
                const [icon, mod] = getColHeaderIcon(isLinkColumn, isPrimaryKey, isForeignKey)
                const colType = liveColumnData?.givenName || displayColType(col.data_type)

                return (
                    <div
                        key={key}
                        style={style}
                        className={pcn(
                            '__col-header',
                            isLiveOrLinkColumn ? '__col-header--live' : '',
                            hoverClass
                        )}
                        onMouseOver={handleMouseOver}
                        onMouseOut={handleMouseOut}
                    >
                        {icon && (
                            <span
                                className={pcn(
                                    '__col-header-type-icon',
                                    `__col-header-type-icon--${mod}`
                                )}
                                dangerouslySetInnerHTML={{ __html: icon }}
                            ></span>
                        )}
                        {!icon &&
                            isLiveOrLinkColumn &&
                            !isLinkColumn &&
                            (status === tableStatus.IN_SYNC.id || !isFirstSeed.current) && (
                                <span className="blink-indicator">
                                    <span></span>
                                </span>
                            )}
                        {!icon &&
                            isLiveOrLinkColumn &&
                            !isLinkColumn &&
                            status !== tableStatus.IN_SYNC.id &&
                            isFirstSeed.current && (
                                <span
                                    className={pcn(
                                        '__col-header-type-icon',
                                        `__col-header-type-icon--circle`
                                    )}
                                >
                                    <span></span>
                                </span>
                            )}
                        <span className={pcn('__col-header-name')}>{col.name}</span>
                        <span className={pcn('__col-header-type')}>
                            <span>{colType}</span>
                        </span>
                    </div>
                )
            }

            const renderCheckCell = () => (
                <div
                    key={key}
                    style={style}
                    className={pcn('__cell', '__cell--check-col', hoverClass)}
                    onMouseOver={handleMouseOver}
                    onMouseOut={handleMouseOut}
                >
                    <span></span>
                </div>
            )

            const renderBlankCell = () => (
                <div
                    key={key}
                    style={style}
                    className={pcn('__cell', hoverClass)}
                    onMouseOver={handleMouseOver}
                    onMouseOut={handleMouseOut}
                ></div>
            )

            const renderRecordCell = () => {
                let record = records[rowIndex]
                let columnName = table.columns[columnIndex].name
                const liveColumnData = liveColumns[columnName]
                const isLiveOrLinkColumn = !!liveColumnData
                const isLinkColumn = liveColumnData?.isLinkColumn
                const isPrimaryKey = primaryKeyColNames.has(columnName)
                let value = record[columnName]

                if (value === null || !record.hasOwnProperty(columnName)) {
                    value = 'NULL'
                } else if (value === true || value === false) {
                    value = value.toString()
                } else if (isJSONColumn(columnIndex)) {
                    value = stringify(value)
                } else if (value === 0) {
                    value = value
                } else if (!value) {
                    value = ''
                }

                return (
                    <div
                        key={key}
                        style={style}
                        className={pcn(
                            '__cell',
                            isLiveOrLinkColumn ? '__cell--live' : '',
                            isLinkColumn ? '__cell--live-link' : '',
                            value === 'NULL' ? '__cell--null' : '',
                            isPrimaryKey ? '__cell--primary' : '',
                            hoverClass
                        )}
                        onMouseOver={handleMouseOver}
                        onMouseOut={handleMouseOut}
                    >
                        <span>
                            {/* <Flipper value={value} /> */}
                            {value}
                        </span>
                    </div>
                )
            }

            if (columnIndex === table.columns.length && rowIndex === -1) {
                return renderNewColumn()
            }

            if (rowIndex === -1 && columnIndex === -1) {
                return renderCheckColumn()
            }

            if (rowIndex === -1) {
                return renderHeader()
            }

            if (records === null) {
                return []
            }

            if (columnIndex === -1) {
                return renderCheckCell()
            }

            if (columnIndex === table.columns.length) {
                return renderBlankCell()
            }

            return renderRecordCell()
        },
        [
            table,
            records,
            liveColumns,
            status,
            foreignKeyColNames,
            primaryKeyColNames,
            onSelectNewColumnType,
            showLiveDataPanel,
            hoveredRow,
        ]
    )
    const renderTableLoading = useCallback(() => {
        let maxWidth = mainWidth
        if (mainRef.current) {
            maxWidth = Math.min(mainRef.current.offsetWidth, maxWidth)
        }
        return (
            <div className={pcn('__table-loading')} style={{ maxWidth: `${maxWidth}px` }}>
                <div className="indeterminate"></div>
            </div>
        )
    }, [mainWidth])

    const renderEmptySchema = useCallback(
        () => (
            <div className={pcn('__empty')}>
                <div className={pcn('__empty-liner')}>
                    <div
                        className={pcn('__empty-icon')}
                        dangerouslySetInnerHTML={{ __html: specIcon }}
                    ></div>
                    <div className={pcn('__empty-text')}>
                        <div>Your Postgres instance is empty.</div>
                        <div>Let's change that.</div>
                    </div>
                    <button
                        className={pcn('__empty-button')}
                        onClick={() => showLiveDataPanel(referrers.NEW_LIVE_TABLE)}
                    >
                        <span>New Live Table</span>
                    </button>
                </div>
            </div>
        ),
        [showLiveDataPanel]
    )

    return (
        <div
            className={cn(
                className,
                `${className}--${status}`,
                records === null ? `${className}--loading` : ''
            )}
            ref={tablesBodyRef}
        >
            {tablesLoaded && !table?.name && renderEmptySchema()}
            {table?.name && (
                <div className={pcn('__header')}>
                    <div className={pcn('__header-left')}>
                        <div className={pcn('__header-left-liner')}>
                            <div className={pcn('__header-left-top')}>
                                <div className={pcn('__table-name')}>
                                    <span>{table.name}</span>
                                </div>
                                <div className={pcn('__table-desc')}>
                                    <span>{table.comment || <i>No description</i>}</span>
                                </div>
                            </div>
                            <div className={pcn('__header-left-bottom')}>
                                {hasLiveColumns && renderStatus()}
                                {renderNumRecords('header')}
                                {renderFilterButton()}
                                {renderSortButton()}
                                {renderLinkObjectButton()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {table?.name && (
                <div className={pcn('__main')} ref={mainRef} style={{ overflow: 'hidden' }}>
                    {status === tableStatus.BACKFILLING.id &&
                        isFirstSeed.current &&
                        renderTableLoading()}

                    <AutoSizer>
                        {({ height, width }) => {
                            return (
                                <InfiniteLoader
                                    isRowLoaded={({ index }) => {
                                        return index < records.length - 1
                                    }}
                                    loadMoreRows={() => {
                                        fetchNextPage()
                                    }}
                                    rowCount={records?.length ?? 0}
                                >
                                    {({ onRowsRendered, registerChild }) => {
                                        return (
                                            <MultiGrid
                                                ref={registerChild}
                                                fixedColumnCount={2}
                                                fixedRowCount={1}
                                                cellRenderer={renderCell}
                                                columnWidth={({ index }) => {
                                                    if (index === 0) {
                                                        return colWidthConfig.CHECK_COLUMN_WIDTH
                                                    }
                                                    if (index === table.columns.length + 1) {
                                                        return colWidthConfig.CHECK_COLUMN_WIDTH
                                                    }
                                                    return columnWidths[index - 1]
                                                }}
                                                columnCount={table.columns.length + 2}
                                                height={height}
                                                width={width}
                                                rowHeight={ROW_HEIGHT}
                                                rowCount={(records?.length ?? 0) + 1}
                                                onSectionRendered={({
                                                    rowStartIndex,
                                                    rowStopIndex,
                                                }) => {
                                                    onRowsRendered({
                                                        startIndex: rowStartIndex,
                                                        stopIndex: rowStopIndex,
                                                    })
                                                }}
                                            />
                                        )
                                    }}
                                </InfiniteLoader>
                            )
                        }}
                    </AutoSizer>
                </div>
            )}
            <Slider
                id="newLiveColumnSlider"
                ref={newLiveColumnSliderRef}
                onShown={onNewLiveColumnSliderShown}
            >
                <NewLiveColumnPanel
                    table={table}
                    schema={schema}
                    config={config}
                    tableLiveColumns={liveColumns}
                    referrer={liveDataPanelReferrer}
                    onSave={onSaveLiveColumns}
                    onCancel={() => newLiveColumnSliderRef.current?.hide()}
                    addTransform={addTransform}
                    addHook={addHook}
                    refetchTables={refetchTables}
                    editColumn={showEditColumnSlider}
                    ref={newLiveColumnPanelRef}
                />
            </Slider>
            <Slider
                id="editColumnSlider"
                faster={true}
                willHide={() => editColumnPanelRef.current?.willHide()}
                ref={editColumnSliderRef}
            >
                <EditColumnPanel
                    schema={schema}
                    onCancel={() => editColumnSliderRef.current?.hide()}
                    onDone={() => editColumnSliderRef.current?.hide()}
                    ref={(r) => {
                        editColumnPanelRef.current = r
                        if (
                            editColumnPanelRef.current &&
                            !!configureEditColumnPanelArgs.current?.length
                        ) {
                            editColumnPanelRef.current.configure(
                                ...configureEditColumnPanelArgs.current
                            )
                            configureEditColumnPanelArgs.current = []
                        }
                    }}
                />
            </Slider>
        </div>
    )
}

TablesBody = forwardRef(TablesBody)
export default TablesBody
