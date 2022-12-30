import React, { useMemo, useRef, useCallback, useState, forwardRef, useImperativeHandle, useEffect } from 'react'
import { getPCN, cn } from '../../../utils/classes'
import $ from 'jquery'
import SelectInput from '../../shared/inputs/SelectInput'
import { filterOps } from '../../../utils/filters'
import closeIcon from '../../../svgs/close'
import { getSchema } from '../../../utils/schema'
import useMeasure from 'react-use-measure'
import { animated, useSpring } from 'react-spring'
import { cloneDeep } from 'lodash-es'

const className = 'live-column-filters'
const pcn = getPCN(className)

const filterOpOptions = [
    filterOps.IN_COLUMN,
    filterOps.EQUALS,
    filterOps.IS_ONE_OF,
].map(op => ({
    value: op.toLowerCase(), 
    label: op,
}))

function LiveColumnFilters(props, ref) {
    const { liveObjectVersion = {}, schema, useFilters } = props
    const [filters, setFilters] = useState(props.filters || [[{}]])
    const useFiltersRef = useRef(useFilters)
    const overflow = useRef('hidden')
    const containerRef = useRef()
    const [linerRef, { height }] = useMeasure()
    const extraConfig = !useFilters || !useFiltersRef.current ? {} : { duration: 0 }

    const updateOverflow = useCallback((value) => {
        value = useFilters ? value : 'hidden'
        containerRef.current && $(containerRef.current).css('overflow', value)
        overflow.current = value
    }, [useFilters, filters.length])

    const containerProps = useSpring({ 
        height: useFilters ? height : 0, 
        config: {
            tension: 385,
            friction: 32,
            ...extraConfig
        },
        onRest: () => updateOverflow('visible'),
        onStart: () => updateOverflow('hidden')
    })

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

    const setFilterData = useCallback((i, j, key, value) => {
        const newFilters = cloneDeep(filters)
        newFilters[i][j][key] = value
        setFilters(newFilters)
    }, [filters, liveObjectVersion])

    const removeFilter = useCallback((i, j) => {
        const newFilters = cloneDeep(filters)
        if (i > 0 && filters[i].length === 1) {
            newFilters.splice(i, 1)
        } else {
            newFilters[i].splice(j, 1)
        }
        setFilters(newFilters)
    }, [filters])
    
    useEffect(() => {
        useFiltersRef.current = useFilters
    }, [useFilters])

    const renderValueSingleValueComp = useCallback(({ innerProps, data }) => {
        const [table, column] = (data?.value || '').split('.')
        return (
            <span
                className='spec__single-value'
                { ...innerProps }>
                <span>{column}</span>
                <span>{table}</span>
            </span>
        )
    }, [])

    const renderValueOption = useCallback(({ innerRef, innerProps, data, isFocused, isSelected }) => {
        const [table, column] = (data?.value || '').split('.')
        return (
            <span
                className={cn(
                    'spec__option',
                    isFocused ? 'spec__option--is-focused' : '',
                    isSelected ? 'spec__option--is-selected' : '',
                )}
                { ...innerProps }
                ref={innerRef}>
                <span>{column}</span>
                <span>{table}</span>
            </span>
        )
    }, [])

    const renderFilterInput = useCallback((filter, i, j) => {
        const disabledPropertyOptions = filters[i]
            .filter((_, k) => k !== j)
            .map(v => v.property)
            .filter(p => !!p)

        return (
            <div key={`${i}-${j}`} className={pcn('__filter-input')}>
                <SelectInput
                    className={pcn(
                        '__filter-input-field', 
                        '__filter-input-field--property', 
                    )}
                    classNamePrefix='spec'
                    value={filter.property}
                    options={propertyOptions}
                    disabledOptions={disabledPropertyOptions}
                    placeholder='.property'
                    isRequired={true}
                    updateFromAbove={true}
                    onChange={value => setFilterData(i, j, 'property', value)}
                />
                <SelectInput
                    className={pcn(
                        '__filter-input-field',
                        '__filter-input-field--op', 
                    )}
                    classNamePrefix='spec'
                    value={filter.op || filterOps.IN_COLUMN.toLowerCase()}
                    options={filterOpOptions}
                    placeholder='op'
                    isRequired={true}
                    updateFromAbove={true}
                    onChange={value => setFilterData(i, j, 'op', value)}
                />
                <SelectInput
                    className={pcn(
                        '__filter-input-field', 
                        '__filter-input-field--value', 
                    )}
                    classNamePrefix='spec'
                    value={filter.value}
                    options={columnPathOptions}
                    placeholder='column'
                    isRequired={true}
                    updateFromAbove={true}
                    onChange={value => setFilterData(i, j, 'value', value)}
                    comps={{
                        SingleValue: renderValueSingleValueComp,
                        Option: renderValueOption
                    }}
                />
                <div
                    className={pcn('__filter-input-icon-button', '__filter-input-icon-button--remove')}
                    onClick={() => removeFilter(i, j)}
                    dangerouslySetInnerHTML={{ __html: closeIcon }}>
                </div>
            </div>
        )
    }, [filters, setFilterData, propertyOptions, removeFilter])

    const renderFilterGroups = useCallback(() => filters.map((filter, i) => (
        <div className={pcn('__filter-inputs')} key={i}>
            { filter.map((obj, j) => renderFilterInput(obj, i, j))}
            <div className={pcn('__action-buttons')}>
                <button onClick={() => {
                    const newFilters = cloneDeep(filters)
                    newFilters[i].push({})
                    setFilters(newFilters)
                }}>
                    <span>AND</span>
                </button>
                <button onClick={() => {
                    const newFilters = cloneDeep(filters)
                    newFilters.splice(i + 1, 0, [{}])
                    setFilters(newFilters)
                }}>
                    <span>OR</span>
                </button>
            </div>
        </div>
    )), [filters, renderFilterInput])

    return (
        <animated.div
            className={className}
            style={{ ...containerProps, overflow: overflow.current }}
            ref={containerRef}>
            <div className={pcn('__liner')} ref={linerRef}>
                { renderFilterGroups() }
            </div>
        </animated.div>
    )
}

LiveColumnFilters = forwardRef(LiveColumnFilters)
export default LiveColumnFilters