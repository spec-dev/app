import React, { useCallback, useRef } from 'react'
import { getPCN } from '../../utils/classes'
import NewTableDropdown from '../shared/dropdowns/NewTableDropdown'
import { paths } from '../../utils/nav'
import { getFromStorage, setToStorage } from '../../utils/cache'
import { Link, useHistory } from 'react-router-dom'
import dropdownCaretsIcon from '../../svgs/dropdown-carets'
import Slider from '../shared/sliders/Slider'
import SelectLiveColumnFormatterPanel from '../shared/panels/SelectLiveColumnFormatterPanel'
import NewLiveTablePanel from '../shared/panels/NewLiveTablePanel'
import { tables } from '../../data/dapps'

const className = 'tables-panel'
const pcn = getPCN(className)

function TablesPanel(props) {
    let history = useHistory()
    const { currentTableIndex = 0, tableNames } = props
    const newTableDropdownRef = useRef()
    const newLiveTableSliderRef = useRef()
    const newLiveTablePanelRef = useRef()
    const selectLiveColumnFormatterPanelRef = useRef()
    const selectLiveColumnFormatterSliderRef = useRef()
    const configureLiveColumnFormatterArgs = useRef([])
    const showNFTsTable = getFromStorage('showNFTsTable') === true
    const sliderNeedsHiding = useRef(false)

    const setNewLiveTableSliderRef = useCallback(r => {
        newLiveTableSliderRef.current = r

        if (newLiveTableSliderRef.current && sliderNeedsHiding.current) {
            sliderNeedsHiding.current = false

            setTimeout(() => {
                newLiveTableSliderRef.current.hide()
            }, 5)
        }
    }, [])

    const onClickNewTable = useCallback(() => {
        newTableDropdownRef.current?.show()
    }, [])

    const onSelectNewTableType = useCallback(({ id }) => {
        if (id === 'live') {
            newLiveTableSliderRef.current?.show()
        }
    }, [])

    const onNewLiveTableSliderShown = useCallback(() => {
        setTimeout(() => {
            newLiveTablePanelRef.current?.focusSearchBar()
        }, 400)
    }, [])

    const onCreateNewLiveTable = useCallback(() => {
        setToStorage('showNFTsTable', true)
        setToStorage(tables.nfts.name, {
            ...tables.nfts,
            status: {
                id: 'backfilling',
                title: 'Backfilling...',
            },
        })

        // Hide slider.
        sliderNeedsHiding.current = true

        // Nav to nfts table.
        history.push(paths.toTable(tables.nfts.name))
    }, [])

    const selectLiveColumnFormatter = useCallback((liveObjectSpec, property, cb) => {
        if (selectLiveColumnFormatterPanelRef.current) {
            selectLiveColumnFormatterPanelRef.current.configure(liveObjectSpec, property, cb)
        } else {
            configureLiveColumnFormatterArgs.current = [liveObjectSpec, property, cb]
        }
        selectLiveColumnFormatterSliderRef.current?.show()
    }, [])

    const renderTableItems = useCallback(() => tableNames.map((name, i) => (
        <Link
            key={i}
            id={`${name}TableListItem`}
            className={pcn(
                '__table-item',
                i === currentTableIndex ? '__table-item--selected' : '',
                name === 'nfts' && !showNFTsTable ? '__table-item--hide' : '',
            )}
            to={paths.toTable(name)}>
            <span>{name}</span>
        </Link>
    )), [tableNames, currentTableIndex])

    return (
        <div className={className}>
            <div className={pcn('__liner')}>
                <div className={pcn('__section', '__section--schema')}>
                    <div className={pcn('__section-title')}>Schema</div>
                    <div className={pcn('__section-body')}>
                        <div id='schemaDropdown'>
                            <span>public</span>
                            <span dangerouslySetInnerHTML={{ __html: dropdownCaretsIcon }}></span>
                        </div>
                    </div>
                </div>
                <div className={pcn('__section', '__section--tables')}>
                    <div className={pcn('__section-title')}>Tables</div>
                    <div className={pcn('__section-body')}>
                        { renderTableItems() }
                    </div>
                </div>
            </div>
            <div className={pcn('__new-table-button')}>
                <span id='newTableDropdownTarget' onClick={onClickNewTable}>
                    <span>+</span>
                    <span>New Table</span>
                </span>
                <NewTableDropdown
                    key='newTableDropdown'
                    id='newTableDropdown'
                    onSelectOption={onSelectNewTableType}
                    ref={newTableDropdownRef}
                />
            </div>
            <Slider
                id='newLiveTableSlider'
                ref={setNewLiveTableSliderRef}
                onShown={onNewLiveTableSliderShown}>
                <NewLiveTablePanel
                    onCreate={onCreateNewLiveTable}
                    onCancel={() => newLiveTableSliderRef.current?.hide()}
                    selectLiveColumnFormatter={selectLiveColumnFormatter}
                    ref={newLiveTablePanelRef}
                />
            </Slider>
            <Slider
                id='newTable-selectLiveColumnFormatterSlider'
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
        </div>
    )
}

export default TablesPanel