import React, { useCallback, useState, useRef, useEffect } from 'react'
import { cn, getPCN } from '../../utils/classes'
import filterIcon from '../../svgs/filter'
import blistIcon from '../../svgs/blist'
import searchIcon from '../../svgs/search'
import lockIcon from '../../svgs/lock'
import historyIcon from '../../svgs/history'
import modelRelationshipIcon from '../../svgs/model-relationship'
import keyIcon from '../../svgs/key'
import checkIcon from '../../svgs/check'
import linkIcon from '../../svgs/link'
import NewColumnDropdown from '../../components/shared/dropdowns/NewColumnDropdown'
import Slider from '../shared/sliders/Slider'
import SelectLiveColumnFormatterPanel from '../shared/panels/SelectLiveColumnFormatterPanel'
import TransformObjectPanel from '../shared/panels/TransformObjectPanel'
import HookPanel from '../shared/panels/HookPanel'
import NewLiveColumnPanel from '../shared/panels/NewLiveColumnPanel'
import { cloneDeep } from 'lodash-es'
import CountUp from 'react-countup'
import { getFromStorage, setToStorage } from '../../utils/cache'

const className = 'tables-body'
const pcn = getPCN(className)

const status = {
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

const getStatusIcon = statusId => {
    switch (statusId) {
        case status.IN_SYNC.id:
            return (
                <span
                    className={pcn('__header-status-icon', '__header-status-icon--check')}
                    dangerouslySetInnerHTML={{ __html: checkIcon }}>
                </span>
            )
        default:
            return null
    }
}

const getColHeaderIcon = (col, table) => {
    if (table.name === 'marketplaces' && col.name === 'address' && !!((getFromStorage('marketplace_listings') || {}).name)) {
        return [linkIcon, 'link']
    }

    if (table.name === 'collections' && col.name === 'contract_address' && !!((getFromStorage('assets') || {}).name)) {
        return [linkIcon, 'link']
    }
    
    if (col.isLiveLinkColumn && col.liveSource && table.status !== null) {
        return [linkIcon, 'link']
    }

    if (col.isPrimaryKey) {
        return [keyIcon, 'key']
    }

    if (col.isForeignKey) {
        return [modelRelationshipIcon, 'rel']
    }

    return [null, null]
}

const getColType = (col, table) => {
    // if (table.name === 'marketplaces' && col.name === 'address' && !!((getFromStorage('marketplace_listings') || {}).name)) {
    //     return (
    //         <span className={pcn('__col-header-type')}>
    //             <span>Listing</span>
    //         </span>
    //     )
    // }

    // if (table.name === 'collections' && col.name === 'contract_address' && !!((getFromStorage('assets') || {}).name)) {
    //     return (
    //         <span className={pcn('__col-header-type')}>
    //             <span>NFTAsset</span>
    //         </span>
    //     )
    // }

    if (!col.liveSource || table.status === null) {
        return <span className={pcn('__col-header-type')}>{ col.type }</span>
    }

    let colType = table.liveObjectSpec?.name
    if (colType === 'ENS Profile' && col.name === 'address' && !!((getFromStorage('nfts') || {}).name)) {
        colType += ', NFT'
        if (table.status === null) {
            return <span className={pcn('__col-header-type')}>{ col.type }</span>
        }
    }

    return (
        <span className={pcn('__col-header-type')}>
            <span>{ colType }</span>
        </span>
    )
}

const timing = {
    rowFadeInDelay: 35,
}

function TablesBody(props) {
    const [table, setTable] = useState(props.table || {})
    const newColumnDropdownRef = useRef()
    const extendTableDropdownRef = useRef()
    const newLiveColumnSliderRef = useRef()
    const newLiveColumnPanelRef = useRef()
    const selectLiveColumnFormatterPanelRef = useRef()
    const selectLiveColumnFormatterSliderRef = useRef()
    const configureLiveColumnFormatterArgs = useRef([])
    const transformObjectSliderRef = useRef()
    const transformObjectPanelRef = useRef()
    const hookSliderRef = useRef()

    const onClickLinkObjectButton = useCallback(() => {
        newColumnDropdownRef.current?.show()
    }, [])

    const onClickExtendTable = useCallback(() => {
        extendTableDropdownRef.current?.show()
    }, [])

    const onSelectNewColumnType = useCallback(({ id }) => {
        if (id === 'live') {
            newLiveColumnSliderRef.current?.show()
        }
    }, [])

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
        newTable.status = status.BACKFILLING
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

    useEffect(() => {
        if (!props.table) return
        
        if (props.table.name !== table.name) {
            setTable(props.table)
            return
        }

        // Backfilling -> Populating
        if (table.status?.id === status.BACKFILLING.id) {
            setTimeout(() => {
                const newTable = cloneDeep(table)
                newTable.status = status.POPULATING
                setTable(newTable)
                setToStorage(newTable.name, newTable)
            }, 2200)
        }
        // Populating -> In-Sync
        else if (table.status?.id === status.POPULATING.id) {
            setTimeout(() => {
                const newTable = cloneDeep(table)
                newTable.status = status.IN_SYNC
                setTable(newTable)
                setToStorage(newTable.name, newTable)
            }, (table.records?.length || 0) * timing.rowFadeInDelay + 400)
        }
    }, [table, props.table])

    const renderStatus = useCallback(() => (
        <div className={pcn('__header-status-container')}>
            <div className={pcn('__header-status', `__header-status--backfilling`)}>
                <span>{ status.BACKFILLING.title }</span>
            </div>
            <div className={pcn('__header-status', `__header-status--in-sync`)}>
                <span
                    className={pcn('__header-status-icon', '__header-status-icon--check')}
                    dangerouslySetInnerHTML={{ __html: checkIcon }}>
                </span>
                <span>{ status.IN_SYNC.title }</span>
            </div>
        </div>
    ), [table])

    const renderNumRecords = useCallback((mod) => {
        const numRecords = table.records?.length || 0
        const isPlural = table.isLiveTable && table.status === null ? true : numRecords !== 1

        let start = 0
        let end = 0
        if (table.status?.id === status.POPULATING.id) {
            end = numRecords
        } else if (table.status?.id === status.IN_SYNC.id) {
            start = numRecords
            end = numRecords
        } else if (table.status === null) {
            start = table.isLiveTable ? 0 : numRecords
            end = table.isLiveTable ? 0 : numRecords
        }

        return (
            <div className={pcn(`__${mod}-num-records`)}>
                <CountUp start={start} end={end} delay={0} duration={(numRecords * timing.rowFadeInDelay) / 1000}>
                    {({ countUpRef }) => (
                        <span>
                            <span ref={countUpRef}></span>
                            <span>{ `Record${isPlural ? 's' : ''}` }</span>
                        </span>
                    )}
                </CountUp>
            </div>
        )
    }, [table])

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

    const renderSearchButton = useCallback(() => (
        <div className={pcn('__search-button')}>
            <span dangerouslySetInnerHTML={{ __html: searchIcon }}></span>
            <span>Search</span>
        </div>
    ), [])

    const renderLinkObjectButton = useCallback(() => (
        <div className={pcn('__header-new-col-button')}>
            <span id='newColDropdownTarget' onClick={() => onSelectNewColumnType({ id: 'live' })}>
                <span>+</span>
                <span>Link Live Data</span>
            </span>
        </div>
    ), [onSelectNewColumnType])

    const renderRLSStatus = useCallback(() => (
        <div className={pcn('__rls-status')}>
            <span dangerouslySetInnerHTML={{ __html: lockIcon }}></span>
            <span>RLS Enabled</span>
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
            const [icon, mod] = getColHeaderIcon(col, table)
            const colType = getColType(col, table)

            if (col.hide) {
                return
            }
        
            let forceGreen = false
            // if (table.name === 'marketplaces' && col.name === 'address' && !!((getFromStorage('marketplace_listings') || {}).name)) {
            //     forceGreen = true
            // }
            // else if (table.name === 'collections' && col.name === 'contract_address' && !!((getFromStorage('assets') || {}).name)) {
            //     forceGreen = true
            // }
            
            colHeaders.push((
                <div
                    key={col.name}
                    className={pcn(
                        '__col-header',
                        `__col-header--${table.name}-${col.hide === false ? col.liveSource : col.name}`,
                        !!col.liveSource && table.status !== null ? '__col-header--live' : '',
                        col.isLiveLinkColumn && table.status !== null ? '__col-header--live-link' : '',
                        col.isPrimaryKey ? '__col-header--primary' : '',
                        forceGreen ? '__col-header--force-green' : '',

                    )}>
                    { icon &&
                        <span
                            className={pcn('__col-header-type-icon', `__col-header-type-icon--${mod}`)}
                            dangerouslySetInnerHTML={{ __html: icon }}>
                        </span>
                    }
                    { !icon && !col.isLiveLinkColumn && !!col.liveSource && table.status?.id === status.IN_SYNC.id &&
                        <span className='blink-indicator'><span></span></span>
                    }
                    { !icon && !col.isLiveLinkColumn && !!col.liveSource && (table.status?.id === status.BACKFILLING.id || table.status?.id === status.POPULATING.id) &&
                        <span className={pcn('__col-header-type-icon', `__col-header-type-icon--circle`)}><span></span></span>
                    }
                    <span className={pcn('__col-header-name')}>{col.name}</span>
                    { colType }
                </div>
            ))
        })

        colHeaders.push((
            <div key='add' className={pcn('__col-header', '__col-header--new-col')}>
                <span id='extendTableDropdownTarget' onClick={onClickExtendTable}>
                    <span>+</span>
                </span>
                <NewColumnDropdown
                    key='extendTableDropdown'
                    id='extendTableDropdown'
                    onSelectOption={onSelectNewColumnType}
                    ref={extendTableDropdownRef}
                />
            </div>
        ))

        return colHeaders
    }, [table, onClickExtendTable, onSelectNewColumnType])

    const renderRecords = useCallback(() => table.records?.map((record, i) => {
        const cells = [(
            <div key='check' className={pcn('__cell', '__cell--check-col')}>
                <span></span>
            </div>
        )]

        const delay = i * timing.rowFadeInDelay

        table.columns.forEach(col => {
            if (col.hide) {
                return
            }

            let value = record[col.hide === false ? col.liveSource : col.name]
            if (value === null) {
                value = 'NULL'
            } 
            else if (value === true || value === false) {
                value = value.toString()
            }
            else if (!value) {
                value = ''
            }

            cells.push((
                <div
                    key={col.name}
                    className={pcn(
                        '__cell', 
                        `__cell--${table.name}-${col.hide === false ? col.liveSource : col.name}`,
                        !!col.liveSource && table.status !== null ? '__cell--live' : '',
                        col.isLiveLinkColumn && table.status !== null ? '__cell--live-link' : '',
                        value === 'NULL' ? '__cell--null' : '',
                        col.isPrimaryKey ? '__cell--primary' : '',
                    )}>
                    <span style={{ transition: `opacity 0.25s ease ${table.isLiveTable ? 0 : delay}ms, color 0.25s ease 0s` }}>
                        { value }
                    </span>
                </div>
            ))
        })

        cells.push((<div key='empty' className={pcn('__cell')}></div>))

        return (
            <div
                key={i}    
                className={pcn('__row')}
                style={ table.isLiveTable && table.status?.id === status.POPULATING.id 
                    ? { transition: `opacity 0.25s ease ${delay}ms` } 
                    : {} 
                }>
                { cells }
            </div>
        )
    }) || [], [table])

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
            `${className}--${table.name}`,
            `${className}--${table.status?.id}`,
            table.isLiveTable ? `${className}--live-table` : '',
        )}>
            <div className={pcn('__header')}>
                <div className={pcn('__header-left')}>
                    <div className={pcn('__header-left-liner')}>
                        <div className={pcn('__header-left-top')}>
                            <div className={pcn('__table-name')}>
                                <span>{ table.name }</span>
                            </div>
                            <div className={pcn('__table-desc')}>
                                <span>{ table.desc || <i>No description</i> }</span>
                            </div>
                        </div>
                        <div className={pcn('__header-left-bottom')}>
                            { table.status && renderStatus() }
                            { renderNumRecords('header') }
                            { renderFilterButton() }
                            { renderSortButton() }
                            { renderSearchButton() }
                            { renderLinkObjectButton() }
                        </div>
                    </div>
                </div>
                <div className={pcn('__header-right')}>
                    <div className={pcn('__header-right-liner')}>
                        <div className={pcn('__header-right-top')}>
                            { renderRLSStatus() }
                        </div>
                        <div className={pcn('__header-right-bottom')}>
                            { renderHistoryButton() }
                        </div>
                    </div>
                </div>
            </div>
            <div className={pcn('__main')}>
                <div className={pcn('__col-headers')}>
                    { table.status?.id === status.BACKFILLING.id && renderTableLoading() }
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