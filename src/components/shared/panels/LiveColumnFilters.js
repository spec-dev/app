import React, { useMemo, useRef, useCallback, useState, forwardRef, useImperativeHandle, useEffect } from 'react'
import { getPCN, cn } from '../../../utils/classes'
import $ from 'jquery'
import SelectInput from '../../shared/inputs/SelectInput'
import { columnOps, filterOpEnglish, filterOptions, multiValueOps } from '../../../utils/filters'
import { propertyIsEnum, formatPropertyOptionsForSelection, resolvedPropertyType } from '../../../utils/liveObjects'
import closeIcon from '../../../svgs/close'
import { getSchema } from '../../../utils/schema'
import useMeasure from 'react-use-measure'
import { animated, useSpring } from 'react-spring'
import { cloneDeep } from 'lodash-es'
import hljs from 'highlight.js/lib/core'
import TextInput from '../inputs/TextInput'
import TimestampInput from '../inputs/TimestampInput'
import { noMod } from '../../../utils/formatters'
import { parse, stringify } from '../../../utils/json'
import CodeInput from '../inputs/CodeInput'

const className = 'live-column-filters'
const pcn = getPCN(className)

const filterablePropertyTypes = new Set([
    'number',
    'string',
    'boolean',
    'enum',
    'Timestamp',
])

const getFilterOptions = propertyType => {
    return propertyType === 'Timestamp'
        ? filterOptions.filter(opt => !multiValueOps.has(opt.value))
        : filterOptions
}

function LiveColumnFilters(props, ref) {
    const { liveObjectVersion = {}, schema, useFilters } = props
    const [filters, setFilters] = useState(props.filters || [[{}]])
    const useFiltersRef = useRef(useFilters)
    const overflow = useRef('hidden')
    const containerRef = useRef()
    const inputRefs = useRef({})
    const andButtonRefs = useRef({})
    const focusOnLastPropertyInput = useRef(null)
    const filterLengths = useRef([])
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

    const propertyOptions = useMemo(() => (liveObjectVersion.properties || []).map(p => {
        const example = (liveObjectVersion.example || {})[p.name] || null
        const resolvedType = resolvedPropertyType(p, example)
        if (!filterablePropertyTypes.has(resolvedType)) return null
        return { 
            value: p.name, 
            label: `.${p.name}`,
            type: p.type,
            example,
        }
    }).filter(v => !!v), [liveObjectVersion])
    
    const columnPathOptions = useMemo(() => (getSchema(schema) || [])
        .map(table => table.columns.map(c => [table.name, c.name].join('.')))
        .flat()
        .map(colPath => ({ value: colPath, label: colPath })), 
    [schema])

    useImperativeHandle(ref, () => ({
        serialize: () => filters
    }), [filters])

    const setInputRef = useCallback((i, j, key, r) => {
        if (!r) return
        inputRefs.current[`${i}-${j}-${key}`] = r
    }, [])

    const setFilterData = useCallback((i, j, key, value) => {
        const newFilters = cloneDeep(filters)

        if (key === 'op') {
            const filter = newFilters[i][j]
            const prevOp = newFilters[i][j].op || filterOpEnglish.IN_COLUMN
            const filterValue = newFilters[i][j].value
            const newOp = value
            const prevOpWasMulti = multiValueOps.has(prevOp)
            const newOpIsMulti = multiValueOps.has(newOp)
            const property = filter.property
                ? (liveObjectVersion.properties || []).find(p => p.name === filter.property)
                : null

            if (columnOps.has(prevOp) && columnOps.has(newOp)) {
                // ignore
            } else if (property) {
                if (propertyIsEnum(property)) { 
                    if (prevOpWasMulti && !newOpIsMulti && Array.isArray(filterValue) && filterValue.length) {
                        newFilters[i][j].value = filterValue[0]
                    } else if (!prevOpWasMulti && newOpIsMulti && filterValue !== null) {
                        newFilters[i][j].value = [filterValue]
                    } else if (prevOpWasMulti !== newOpIsMulti) {
                        newFilters[i][j].value = null
                    }
                } else if (property.type === 'Timestamp') {

                    if (columnOps.has(prevOp) !== columnOps.has(newOp) && prevOpWasMulti !== newOpIsMulti) {
                        newFilters[i][j].value = null
                    }
                } else {
                    if (columnOps.has(prevOp) !== columnOps.has(newOp)) {
                        newFilters[i][j].value = null
                    } else {
                        if (prevOpWasMulti && !newOpIsMulti && filterValue) {
                            const parsedFilterValue = parse(filterValue, [])
                            if (Array.isArray(parsedFilterValue) && parsedFilterValue.length) {
                                newFilters[i][j].value = stringify(parsedFilterValue[0], null)
                            }
                        } else if (!prevOpWasMulti && newOpIsMulti && filterValue !== null) {
                            newFilters[i][j].value = `[${filterValue}]`
                        } else if (prevOpWasMulti !== newOpIsMulti) {
                            newFilters[i][j].value = null
                        }
                    }
                }
            } else {
                newFilters[i][j].value = null
            }

            if (value) {
                setTimeout(() => {
                    const valueInputRef = inputRefs.current[`${i}-${j}-value`]
                    valueInputRef && valueInputRef.focus()
                }, 10)
            }
        } else if (key === 'property') {
            newFilters[i][j].value = null

            if (value) {
                setTimeout(() => {
                    const opInputRef = inputRefs.current[`${i}-${j}-op`]
                    opInputRef && opInputRef.focus()
                }, 10)
            }
        }

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

    const onTabOffCodeInput = useCallback((i, j) => {
        if (j === filterLengths.current[i] - 1) {
            andButtonRefs.current[i].focus()
        } else {
            const nextPropertyInputRef = inputRefs.current[`${i}-${j + 1}-property`]
            nextPropertyInputRef?.focus()
        }
    }, [])
    
    const setAndButtonRef = useCallback((i, ref) => {
        if (!ref) return
        andButtonRefs.current[i] = ref
    }, [])
    
    useEffect(() => {
        useFiltersRef.current = useFilters
    }, [useFilters])

    useEffect(() => {
        filterLengths.current = filters.map(inner => inner?.length || 0)
    }, [filters])

    useEffect(() => {
        if (focusOnLastPropertyInput.current !== null) {
            const i = focusOnLastPropertyInput.current
            focusOnLastPropertyInput.current = null
            const j = (filters[i] || []).length - 1
            if (j < 0) return
            setTimeout(() => {
                const propertyRef = inputRefs.current[`${i}-${j}-property`]
                propertyRef?.focus()    
            }, 0)
        }
    }, [filters])

    const renderColumnValueSingleValue = useCallback(({ innerProps, data }) => {
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

    const renderColumnValueOption = useCallback(({ innerRef, innerProps, data, isFocused, isSelected }) => {
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

    const renderOpValue = useCallback(({ innerProps, children }) => {
        return (
            <span
                className={cn(
                    'spec__single-value',
                )}
                { ...innerProps }>
                { children }
            </span>
        )
    }, [])

    const renderOpOption = useCallback(({ innerRef, innerProps, children, isFocused, isSelected }) => {
        return (
            <span
                className={cn(
                    'spec__option',
                    isFocused ? 'spec__option--is-focused' : '',
                    isSelected ? 'spec__option--is-selected' : '',
                )}
                { ...innerProps }
                ref={innerRef}>
                { children }
            </span>
        )
    }, [])

    const renderSingleValueSingleValue = useCallback(({ innerProps, data }) => {
        const annotation = (data.type === 'boolean' ? '' : data.label) || ''
        let value = data.value
        let valueProps = { children: value }
        if (['number', 'string', 'boolean'].includes(data.type)) {
            valueProps = {
                dangerouslySetInnerHTML: {
                    __html: hljs.highlight(JSON.stringify(data.value), { language: 'typescript' }).value
                }
            }
        }
        return (
            <span
                className='spec__single-value'
                { ...innerProps }>
                <span { ...valueProps }></span>
                <span>{annotation}</span>
            </span>
        )
    }, [])

    const renderSingleValueOption = useCallback(({ innerRef, innerProps, data, isFocused, isSelected }) => {
        const annotation = (data.type === 'boolean' ? '' : data.label) || ''
        let value = data.value
        let valueProps = { children: value }
        if (['number', 'string', 'boolean'].includes(data.type)) {
            valueProps = {
                dangerouslySetInnerHTML: {
                    __html: hljs.highlight(JSON.stringify(data.value), { language: 'typescript' }).value
                }
            }
        }
        return (
            <span
                className={cn(
                    'spec__option',
                    isFocused ? 'spec__option--is-focused' : '',
                    isSelected ? 'spec__option--is-selected' : '',
                )}
                { ...innerProps }
                ref={innerRef}>
                <span { ...valueProps }></span>
                <span>{annotation}</span>
            </span>
        )
    }, [])

    const renderPropertySingleValue = useCallback(({ innerProps, data }) => {
        return (
            <span
                className='spec__single-value'
                { ...innerProps }>
                <span>{data.label}</span>
                <span>{data.type || ''}</span>
            </span>
        )
    }, [])

    const renderPropertyOption = useCallback(({ innerRef, innerProps, data, isFocused, isSelected, isDisabled }) => {
        return (
            <span
                className={cn(
                    'spec__option',
                    isFocused ? 'spec__option--is-focused' : '',
                    isSelected ? 'spec__option--is-selected' : '',
                    isDisabled ? 'spec__option--is-disabled' : '',
                )}
                { ...innerProps }
                ref={innerRef}>
                <span>{data.label}</span>
                <span>{data.type || ''}</span>
            </span>
        )
    }, [])

    const renderColumnValueInput = useCallback((filter, i, j) => (
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
                SingleValue: renderColumnValueSingleValue,
                Option: renderColumnValueOption,
            }}
            ref={r => setInputRef(i, j, 'value', r)}
        />
    ), [renderColumnValueSingleValue, renderColumnValueOption, setFilterData, setInputRef])

    const renderMultiValueRemove = useCallback(({ innerProps }) => (
        <div
            className='spec__multi-value__remove'
            dangerouslySetInnerHTML={{ __html: closeIcon }}
            { ...innerProps }>
        </div>
    ), [])

    const renderMultiValueLabel = useCallback(({ data, innerProps }) => {
        let value = data.value
        let valueProps = { children: value }
        if (['number', 'string', 'boolean'].includes(data.type)) {
            valueProps = {
                dangerouslySetInnerHTML: {
                    __html: hljs.highlight(JSON.stringify(data.value), { language: 'typescript' }).value
                }
            }
        }
        return (
            <div
                className='spec__multi-value__label'
                { ...innerProps }>
                <span { ...valueProps }></span>
            </div>
        )
    }, [])

    const renderMultiValueInput = useCallback((filter, options, i, j) => (
        <SelectInput
            className={pcn(
                '__filter-input-field', 
                '__filter-input-field--value', 
            )}
            classNamePrefix='spec'
            value={filter.value}
            options={options}
            placeholder='values'
            isRequired={true}
            updateFromAbove={true}
            isMulti={true}
            onChange={value => setFilterData(i, j, 'value', value)}
            comps={{
                Option: renderSingleValueOption,
                MultiValueLabel: renderMultiValueLabel,
                MultiValueRemove: renderMultiValueRemove,
            }}
            ref={r => setInputRef(i, j, 'value', r)}
        />
    ), [setFilterData, renderSingleValueOption, renderMultiValueLabel, renderMultiValueRemove, setInputRef])

    const renderSingleValueInput = useCallback((filter, options, i, j) => (
        <SelectInput
            className={pcn(
                '__filter-input-field',
                '__filter-input-field--value',
            )}
            classNamePrefix='spec'
            value={filter.value}
            options={options}
            placeholder='value'
            isRequired={true}
            updateFromAbove={true}
            onChange={value => setFilterData(i, j, 'value', value)}
            comps={{
                SingleValue: renderSingleValueSingleValue,
                Option: renderSingleValueOption,
            }}
            ref={r => setInputRef(i, j, 'value', r)}
        />
    ), [setFilterData, setInputRef])

    const renderCodeTextInput = useCallback((filter, i, j, property, opIsMulti) => {
        const example = (liveObjectVersion.example || {})[property.name] || null
        const resolvedType = resolvedPropertyType(property, example)
        const isNumber = resolvedType === 'number'

        let value = filter.value
        let placeholder = ''
        if (opIsMulti) {
            placeholder = isNumber ? '[1, 2, 3]' : '["a", "b", "c"]'
        } else {
            placeholder = isNumber ? 'number' : '""'
        }
        if (value === null) {
            if (isNumber) {
                value = opIsMulti ? '[]' : ''
            } else {
                value = opIsMulti ? '[""]' : '""'
            }
        }

        return (
            <CodeInput
                id={`filter-${i}-${j}`}
                className={pcn(
                    '__filter-input-field',
                    '__filter-input-field--value',
                    '__code-input-field',
                )}
                value={value}
                placeholder={placeholder}
                isRequired={true}
                updateFromAbove={true}
                onChange={val => setFilterData(i, j, 'value', val)}
                onTab={() => onTabOffCodeInput(i, j)}
                ref={r => setInputRef(i, j, 'value', r)}
            />
        )
    }, [liveObjectVersion, setFilterData, onTabOffCodeInput])

    const renderTimestampInput = useCallback((filter, i, j) => (
        <TimestampInput
            className={pcn(
                '__filter-input-field',
                '__filter-input-field--value',
                '__timestamp-input-field',
            )}
            value={filter.value}
            isRequired={true}
            onChange={val => setFilterData(i, j, 'value', val)}
            ref={r => setInputRef(i, j, 'value', r)}
        />
    ), [setFilterData, setInputRef])

    const renderValueInput = useCallback((filter, i, j) => {
        const op = filter.op || filterOpEnglish.IN_COLUMN

        // Column selection
        if (columnOps.has(op)) {
            return renderColumnValueInput(filter, i, j)
        }

        const property = filter.property
            ? (liveObjectVersion.properties || []).find(p => p.name === filter.property)
            : null

        // Show disabled placeholder input until property is selected.
        if (!property) {
            return (
                <div className={pcn(
                    '__filter-input-field', 
                    '__filter-input-field--value', 
                    '__disabled-value-ph',
                )}>
                    <span>value</span>
                </div>
            )
        }

        // Enums and booleans.
        if (propertyIsEnum(property)) {
            let options = formatPropertyOptionsForSelection(property)
            if (property.type === 'ChainId') {
                const supportedChainIds = liveObjectVersion.config.chains || {}
                options = options.filter(opt => supportedChainIds.hasOwnProperty(opt.value))
            }

            return multiValueOps.has(op) 
                ? renderMultiValueInput(filter, options, i, j)
                : renderSingleValueInput(filter, options, i, j)
        }

        // Timestamps.
        if (property.type === 'Timestamp') {
            return renderTimestampInput(filter, i, j)
        }

        // Numbers and strings.
        return renderCodeTextInput(filter, i, j, property, multiValueOps.has(op))
    }, [
        renderColumnValueInput, 
        renderMultiValueInput, 
        renderSingleValueInput,
        renderCodeTextInput,
        renderTimestampInput,
        liveObjectVersion,
    ])

    const renderFilterInput = useCallback((filter, i, j) => {
        const disabledPropertyOptions = filters[i]
            .filter((_, k) => k !== j)
            .map(v => v.property)
            .filter(p => !!p)

        const property = filter.property
            ? (liveObjectVersion.properties || []).find(p => p.name === filter.property)
            : null

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
                    comps={{
                        SingleValue: renderPropertySingleValue,
                        Option: renderPropertyOption,
                    }}
                    ref={r => setInputRef(i, j, 'property', r)}
                />
                <SelectInput
                    className={pcn(
                        '__filter-input-field',
                        '__filter-input-field--op', 
                    )}
                    classNamePrefix='spec'
                    value={filter.op || filterOpEnglish.IN_COLUMN}
                    options={getFilterOptions(property?.type)}
                    placeholder='op'
                    isRequired={true}
                    updateFromAbove={true}
                    onChange={value => setFilterData(i, j, 'op', value)}
                    comps={{
                        SingleValue: renderOpValue,
                        Option: renderOpOption,
                    }}
                    ref={r => setInputRef(i, j, 'op', r)}
                />
                { renderValueInput(filter, i, j) }
                <div
                    className={pcn('__filter-input-icon-button', '__filter-input-icon-button--remove')}
                    onClick={() => removeFilter(i, j)}
                    dangerouslySetInnerHTML={{ __html: closeIcon }}>
                </div>
            </div>
        )
    }, [
        filters, 
        liveObjectVersion,
        propertyOptions, 
        setFilterData,
        removeFilter,
        renderOpValue,
        renderOpOption,
        renderPropertySingleValue,
        renderPropertyOption,
        renderValueInput,
        setInputRef,
    ])

    const renderFilterGroups = useCallback(() => filters.map((filter, i) => (
        <div className={pcn('__filter-inputs')} key={i}>
            { filter.map((obj, j) => renderFilterInput(obj, i, j))}
            <div className={pcn('__action-buttons')}>
                <button
                    ref={r => setAndButtonRef(i, r)}
                    onClick={() => {
                        const newFilters = cloneDeep(filters)
                        newFilters[i].push({})
                        focusOnLastPropertyInput.current = i
                        setFilters(newFilters)
                    }}>
                    <span>AND</span>
                </button>
                <button onClick={() => {
                    const newFilters = cloneDeep(filters)
                    newFilters.splice(i + 1, 0, [{}])
                    focusOnLastPropertyInput.current = i + 1
                    setFilters(newFilters)
                }}>
                    <span>OR</span>
                </button>
            </div>
        </div>
    )), [filters, renderFilterInput, setAndButtonRef])

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