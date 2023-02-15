import React, { useCallback, useMemo, useRef } from 'react'
import { getPCN } from '../../utils/classes'
import { paths } from '../../utils/nav'
import { noop } from '../../utils/nodash'
import { Link } from 'react-router-dom'
import NewTableDropdown from '../shared/dropdowns/NewTableDropdown'
import dropdownCaretsIcon from '../../svgs/dropdown-carets'

const className = 'tables-panel'
const pcn = getPCN(className)

function TablesPanel(props) {
    const { projectId, onNewLiveTable = noop } = props
    const currentTableIndex = useMemo(() => props.currentTableIndex || 0, [props])
    const tableNames = useMemo(() => props.tableNames || [], [props])
    const newTableDropdownRef = useRef()

    const onClickNewTable = useCallback(() => {
        newTableDropdownRef.current?.show()
    }, [])

    const onSelectNewTableType = useCallback(({ id }) => {
        if (id === 'live') {
            onNewLiveTable()
        }
    }, [onNewLiveTable])

    const renderTableItems = useCallback(() => tableNames.map((name, i) => (
        <Link
            key={i}
            id={`${name}TableListItem`}
            className={pcn(
                '__table-item',
                i === currentTableIndex ? '__table-item--selected' : '',
            )}
            to={paths.toTable(projectId, name)}>
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
                <span id='newTableDropdownTarget' onClick={onNewLiveTable}>
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
        </div>
    )
}

export default TablesPanel