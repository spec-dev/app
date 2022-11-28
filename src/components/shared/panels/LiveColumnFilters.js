import React, { useMemo, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import { getPCN } from '../../../utils/classes'
import TextInput from '../../shared/inputs/TextInput'
import SelectInput from '../../shared/inputs/SelectInput'
import { filterOps } from '../../../utils/filters'
import closeIcon from '../../../svgs/close'
import { getSchema } from '../../../utils/schema'

const className = 'live-column-filters'
const pcn = getPCN(className)

const filterOpOptions = Object.values(filterOps).map(op => ({
    value: op.toLowerCase(), 
    label: op,
}))

function LiveColumnFilters(props, ref) {
    const { liveObjectVersion = {}, schema, } = props
    const [filters, setFilters] = useState(props.filters || [{}])
    const propertyOptions = useMemo(() => (liveObjectVersion.properties || []).map(p => (
        { value: p.name, label: `.${p.name}` }
    )), [liveObjectVersion])
    const columnPathOptions = useMemo(() => (getSchema(schema) || [])
        .map(table => table.columns.map(c => [table.name, c.name].join('.')))
        .flat()
        .map(colPath => ({ value: colPath, label: colPath })), 
    [schema])

    useImperativeHandle(ref, () => ({
        serialize: () => filters
    }), [filters])

    const setFilterData = useCallback((idx, key, value) => {
        const newFilters = []
        let filter
        for (let i = 0; i < filters.length; i++) {
            filter = filters[i]
            if (i === idx) {
                filter[key] = value
            }
            newFilters.push(filter)
        }
        setFilters(newFilters)
    }, [filters, liveObjectVersion])

    const addNewFilter = useCallback(() => {
        setFilters(prevState => [ ...prevState, {}])
    }, [])

    const removeFilter = useCallback((idx) => {
        const newFilters = []
        for (let i = 0; i < filters.length; i++) {
            if (i === idx) {
                continue
            }
            newFilters.push(filters[i])
        }
        setFilters(newFilters)
    }, [filters])

    const renderFilterInputs = useCallback(() => filters.map((filter, i) => (
        <div key={i} className={pcn('__filter-input')}>
            <SelectInput
                className={pcn(
                    '__filter-input-field', 
                    '__filter-input-field--property', 
                )}
                classNamePrefix='spec'
                value={filter.property}
                options={propertyOptions}
                placeholder='.property'
                isRequired={true}
                updateFromAbove={true}
                onChange={value => setFilterData(i, 'property', value)}
            />
            <SelectInput
                className={pcn(
                    '__filter-input-field', 
                    '__filter-input-field--op', 
                )}
                classNamePrefix='spec'
                value={filter.op || filterOps.IN.toLowerCase()}
                options={filterOpOptions}
                placeholder='op'
                isRequired={true}
                updateFromAbove={true}
                onChange={value => setFilterData(i, 'op', value)}
            />
            <SelectInput
                className={pcn(
                    '__filter-input-field', 
                    '__filter-input-field--value', 
                )}
                classNamePrefix='spec'
                value={filter.value}
                options={columnPathOptions}
                placeholder='column_path'
                isRequired={true}
                updateFromAbove={true}
                onChange={value => setFilterData(i, 'value', value)}
            />
            <div
                className={pcn('__filter-input-icon-button', '__filter-input-icon-button--remove')}
                onClick={() => removeFilter(i)}
                dangerouslySetInnerHTML={{ __html: closeIcon }}>
            </div>
        </div>
    )), [filters, setFilterData, propertyOptions, removeFilter])

    return (
        <div className={className}>
            <div className={pcn('__liner')}>
                <div className={pcn('__filter-inputs')}>
                    { renderFilterInputs() }
                </div>
                <div className={pcn('__action-buttons')}>
                    <button onClick={addNewFilter}>
                        <span>AND</span>
                    </button>
                    {/* <button onClick={addNewFilter}>
                        <span>OR</span>
                    </button> */}
                </div>
            </div>
        </div>
    )
}

LiveColumnFilters = forwardRef(LiveColumnFilters)
export default LiveColumnFilters