import React, { useMemo, useRef, useCallback, useState, forwardRef, useImperativeHandle, useEffect } from 'react'
import { getPCN, cn } from '../../../utils/classes'
import $ from 'jquery'
import SelectInput from '../../shared/inputs/SelectInput'
import { columnOps, filterOptions, filterOps, multiValueOps } from '../../../utils/filters'
import { propertyIsEnum, formatPropertyOptionsForSelection, resolvedPropertyType } from '../../../utils/liveObjects'
import closeIcon from '../../../svgs/close'
import { getSchema } from '../../../utils/schema'
import { cloneDeep } from 'lodash-es'
import hljs from 'highlight.js/lib/core'
import TimestampInput from '../inputs/TimestampInput'
import { parse, stringify } from '../../../utils/json'
import { noop } from '../../../utils/nodash'
import { chainNames } from '../../../utils/chains'
import CodeInput from '../inputs/CodeInput'
import { colTypeIcon, displayColType } from '../../../utils/colTypes'
import AnimateHeight from 'react-animate-height'
import {
    NUMBER,
    STRING,
    BOOLEAN,
    TIMESTAMP,
    CHAIN_ID,
    BLOCK_HASH,
    BLOCK_NUMBER,
    TRANSACTION_HASH,
    ADDRESS,
    BIGINT,
    BIGFLOAT,
} from '../../../utils/propertyTypes'
import AddForeignKeyPrompt from '../prompts/AddForeignKeyPrompt'

const className = 'live-column-filters'
const pcn = getPCN(className)

const filterablePropertyTypes = new Set([
    NUMBER,
    STRING,
    BOOLEAN,
    TIMESTAMP,
    CHAIN_ID,
    BLOCK_HASH,
    BLOCK_NUMBER,
    TRANSACTION_HASH,
    ADDRESS,
    BIGINT,
    BIGFLOAT,
    'enum'
])

const getFilterOptions = propertyType => {
    return propertyType === TIMESTAMP
        ? filterOptions.filter(opt => !multiValueOps.has(opt.value))
        : filterOptions
}

function LiveColumnFilters(props, ref) {
    const { liveObjectVersion = {}, schema, tableName, isNewTable, useFilters, addForeignKeyRefToTable = noop} = props
    const [filters, setFilters] = useState(props.filters || [[{ op: filterOps.EQUAL_TO }]])
    const [showForeignKeyAdditionPrompt, setShowForeignKeyAdditionPrompt] = useState(null)
    const useFiltersRef = useRef(useFilters)
    const inputRefs = useRef({})
    const andButtonRefs = useRef({})
    const focusOnLastPropertyInput = useRef(null)
    const filterLengths = useRef([])
    const tablePathsPromptedAboutForeignKeys = useRef(new Set())
    const promptForeignKeyAddition = useRef(null)
    const fkPromptContainerRef = useRef(null)

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
        .map(table => table.columns.map(col => ({ 
            colPath: [schema, table.name, col.name].join('.'),
            colType: displayColType(col.data_type),
        })))
        .flat()
        .map(({ colPath, colType }) => ({ value: colPath, label: colPath, type: colType })), 
    [schema])

    const firstForeignSelectedColFilter = useMemo(() => filters.flat().find(f => 
        columnOps.has(f.op) && 
        !!f.value && 
        (isNewTable || !f.value.startsWith(`${schema}.${tableName}.`))
    ), [filters, isNewTable, schema, tableName])

    const disabledColumnPaths = useMemo(() => {
        if (!firstForeignSelectedColFilter) return []
        const [colSchemaName, colTableName, _] = firstForeignSelectedColFilter.value.split('.')
        const firstForeignSelectedTablePath = [colSchemaName, colTableName].join('.')

        const disabled = []
        for (const { value: colPath } of columnPathOptions) {
            const [colSchemaName, colTableName, _] = colPath.split('.')
            const colTablePath = [colSchemaName, colTableName].join('.')

            // on current table
            if (!isNewTable && colSchemaName === schema && colTableName === tableName) {
                continue
            }

            // on alredy chosen foreign table
            if (colTablePath === firstForeignSelectedTablePath) {
                continue
            }

            disabled.push(colPath)
        }
        return disabled
    }, [firstForeignSelectedColFilter, columnPathOptions, schema, tableName, isNewTable])

    useImperativeHandle(ref, () => ({
        serialize: () => {
            const currentFilters = cloneDeep(filters || [])
            const finalFilters = []
            for (const group of currentFilters) {
                const finalGroup = []
                for (const filter of (group || [])) {
                    if (!!filter.property && !!filter.op && filter.hasOwnProperty('value')) {
                        if (!columnOps.has(filter.op)) {
                            let value = filter.value
                            try {
                                value = JSON.parse(value)
                            } catch (err) {
                                value = value
                            }
                            if (typeof value === 'number') {
                                value = value.toString()
                            }
                            filter.value = value
                        }
                        finalGroup.push(filter)
                    }
                }
                finalGroup.length && finalFilters.push(finalGroup)
            }
            return finalFilters
        }
    }), [filters])

    const setInputRef = useCallback((i, j, key, r) => {
        if (!r) return
        inputRefs.current[`${i}-${j}-${key}`] = r
    }, [])

    const setFilterData = useCallback((i, j, key, value) => {
        const newFilters = cloneDeep(filters)

        if (key === 'op') {
            const filter = newFilters[i][j]
            const prevOp = newFilters[i][j].op
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
                } else if (property.type === TIMESTAMP) {
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
        } else {
            const isColumnOp = columnOps.has(newFilters[i][j].op)
            const isForeignColPath = isColumnOp && value && (isNewTable || !value.startsWith(`${schema}.${tableName}.`))
            if (!firstForeignSelectedColFilter && isForeignColPath && !!newFilters[i][j].property) {
                const [colSchemaName, colTableName, _] = value.split('.')
                const colTablePath = [colSchemaName, colTableName].join('.')
                const selectedTable = (getSchema(colSchemaName) || []).find(table => table.name === colTableName)
                const numPrimaryKeysOnSelectedTable = (selectedTable?.primary_keys || []).length

                // TODO: Check to make sure foreign key hasn't already been added in the columns section.
                if (numPrimaryKeysOnSelectedTable === 1 && !tablePathsPromptedAboutForeignKeys.current.has(colTablePath)) {
                    tablePathsPromptedAboutForeignKeys.current.add(colTablePath)
                    promptForeignKeyAddition.current = [
                        i, 
                        j,
                        [colSchemaName, colTableName, selectedTable.primary_keys[0].name].join('.')
                    ]
                }
            }
        }

        newFilters[i][j][key] = value
        setFilters(newFilters)
    }, [filters, liveObjectVersion, firstForeignSelectedColFilter])

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
    
    const onAddForeignKeyRefToTable = useCallback((foreignKeyColName, targetColPath, closePrompt) => {
        setTimeout(closePrompt, 1000)
        addForeignKeyRefToTable(foreignKeyColName, targetColPath)
    }, [addForeignKeyRefToTable])

    useEffect(() => {
        useFiltersRef.current = useFilters
    }, [useFilters])

    useEffect(() => {
        filterLengths.current = filters.map(inner => inner?.length || 0)
    }, [filters])

    // useEffect(() => {
    //     if (focusOnLastPropertyInput.current !== null) {
    //         const i = focusOnLastPropertyInput.current
    //         focusOnLastPropertyInput.current = null
    //         const j = (filters[i] || []).length - 1
    //         if (j < 0) return
    //         setTimeout(() => {
    //             const propertyRef = inputRefs.current[`${i}-${j}-property`]
    //             propertyRef?.focus()    
    //         }, 20)
    //     }
    // }, [filters])

    useEffect(() => {
        if (promptForeignKeyAddition.current && firstForeignSelectedColFilter) {
            const [i, j, foreignTablePkColPath] = promptForeignKeyAddition.current
            promptForeignKeyAddition.current = null
            setShowForeignKeyAdditionPrompt([i, j, foreignTablePkColPath, 'will-open'])      
        }
    }, [firstForeignSelectedColFilter])

    useEffect(() => {
        if (!showForeignKeyAdditionPrompt?.length) return
        const [i, j, foreignTablePkColPath, mod] = showForeignKeyAdditionPrompt
        if (mod === 'will-open') {
            setTimeout(() => {
                setShowForeignKeyAdditionPrompt([i, j, foreignTablePkColPath, 'open'])
            }, 30)
        } else if (mod === 'open') {
            setTimeout(() => $(fkPromptContainerRef.current).css('overflow', 'visible'), 550)
        }
    }, [showForeignKeyAdditionPrompt])

    const renderColumnValueSingleValue = useCallback(({ innerProps, data }) => {
        const [_, table, column] = (data?.value || '').split('.')
        const tablePath = [table, column].join('.')
        const icon = colTypeIcon(data.type)
        return (
            <span
                className='spec__single-value'
                { ...innerProps }>
                <span dangerouslySetInnerHTML={{ __html: icon }}></span>
                <span>{tablePath}</span>
            </span>
        )
    }, [])

    const renderColumnValueOption = useCallback(({ innerRef, innerProps, data, isFocused, isSelected, isDisabled }) => {
        const [_, table, column] = (data?.value || '').split('.')
        const tablePath = [table, column].join('.')
        const icon = colTypeIcon(data.type)
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
                <span dangerouslySetInnerHTML={{ __html: icon }}></span>
                <span>{tablePath}</span>
            </span>
        )
    }, [])

    const renderOpValue = useCallback(({ innerProps, data, children }) => {
        return (
            <span
                className={cn(
                    'spec__single-value',
                )}
                { ...innerProps }>
                { data.displayLabel }
            </span>
        )
    }, [])

    const renderOpOption = useCallback(({ innerRef, innerProps, data, children, isFocused, isSelected }) => {
        return (
            <span
                className={cn(
                    'spec__option',
                    isFocused ? 'spec__option--is-focused' : '',
                    isSelected ? 'spec__option--is-selected' : '',
                )}
                { ...innerProps }
                ref={innerRef}>
                { data.displayLabel }
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
                {/* <span>{data.type || ''}</span> */}
                <span></span>
            </span>
        )
    }, [])

    const renderColumnValueInput = useCallback((filter, i, j, showingPrompt) => (
        <SelectInput
            className={pcn(
                '__filter-input-field', 
                '__filter-input-field--value', 
                '__filter-input-field--col-value',
                showingPrompt ? '__filter-input-field--showing-prompt' : '',
            )}
            classNamePrefix='spec'
            value={filter.value}
            options={columnPathOptions}
            disabledOptions={disabledColumnPaths}
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
    ), [
        renderColumnValueSingleValue, 
        renderColumnValueOption, 
        setFilterData, 
        setInputRef, 
        columnPathOptions, 
        disabledColumnPaths,
    ])

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

    const renderValueInput = useCallback((filter, i, j, showingPrompt) => {
        const op = filter.op

        // Column selection
        if (columnOps.has(op)) {
            return renderColumnValueInput(filter, i, j, showingPrompt)
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

        // Enums, booleans, and chain ids.
        const isChainId = property.type === CHAIN_ID
        if (propertyIsEnum(property) || isChainId) {
            let options = formatPropertyOptionsForSelection(property)
            if (isChainId) {
                const supportedChainIds = Object.keys(liveObjectVersion.config.chains || {}).map(v => v.toString())
                options = supportedChainIds.map(chainId => ({
                    value: chainId,
                    name: chainNames[chainId],
                    type: 'string',
                }))
            }

            return multiValueOps.has(op) 
                ? renderMultiValueInput(filter, options, i, j)
                : renderSingleValueInput(filter, options, i, j)
        }

        // Timestamps.
        if (property.type === TIMESTAMP) {
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

    const renderAddForeignKeyPrompt = useCallback((filter, foreignTablePkColPath, mod, i, j) => {
        const id = `${i}-${j}-prompt-fk`
        const close = () => setShowForeignKeyAdditionPrompt([i, j, foreignTablePkColPath, 'close'])
        const [foreignSchema, foreignTableName, _] = foreignTablePkColPath.split('.')
        const foreignTablePath = [foreignSchema, foreignTableName].join('.')
        const foreignTable = (getSchema(foreignSchema) || []).find(table => table.name === foreignTableName)
        const singleUniqueColPaths = (foreignTable?.unique_columns || [])
            .filter(colGroup => colGroup.length === 1)
            .flat()
            .map(colName => [foreignTablePath, colName].join('.'))

        return (
            <div
                id={id}
                key={id}
                className={pcn('__prompt', '__prompt--fk', `__prompt--${mod}`)}
                ref={fkPromptContainerRef}>
                <AddForeignKeyPrompt
                    filterProperty={filter.property}
                    filterColPath={filter.value}
                    foreignTablePkColPath={foreignTablePkColPath}
                    refKeyOptions={singleUniqueColPaths}
                    onYes={(foreignKeyColName, targetColPath) => {
                        $(fkPromptContainerRef.current).css('overflow', 'hidden')
                        onAddForeignKeyRefToTable(foreignKeyColName, targetColPath, close)
                    }}
                    onNo={() => {
                        $(fkPromptContainerRef.current).css('overflow', 'hidden')
                        close()
                    }}
                />
            </div>
        )
    }, [onAddForeignKeyRefToTable, columnPathOptions])

    const renderFilterInput = useCallback((filter, i, j) => {
        const alreadySelectedPropertyValues = filters[i]
            .filter((_, k) => k !== j)
            .map(v => v.property)
            .filter(p => !!p)

        const property = filter.property
            ? (liveObjectVersion.properties || []).find(p => p.name === filter.property)
            : null

        let promptAboutForeignKey = false
        let foreignTablePkColPath = ''
        let mod = ''
        if (showForeignKeyAdditionPrompt?.length) {
            const [k, l, m, n] = showForeignKeyAdditionPrompt
            foreignTablePkColPath = m
            mod = n
            if (i === k && j === l && filter.value) {
                // HACK
                // promptAboutForeignKey = true
            }
        }

        const filterInput = (
            <div key={`${i}-${j}`} className={pcn('__filter-input')}>
                <SelectInput
                    className={pcn(
                        '__filter-input-field', 
                        '__filter-input-field--property', 
                    )}
                    classNamePrefix='spec'
                    value={filter.property}
                    options={propertyOptions}
                    disabledOptions={alreadySelectedPropertyValues}
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
                    value={filter.op}
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
                { renderValueInput(filter, i, j, promptAboutForeignKey && mod === 'open') }
                <div
                    className={pcn('__filter-input-icon-button', '__filter-input-icon-button--remove')}
                    onClick={() => removeFilter(i, j)}
                    dangerouslySetInnerHTML={{ __html: closeIcon }}>
                </div>
            </div>
        )

        if (!promptAboutForeignKey) {
            return filterInput
        }

        return [
            filterInput,
            renderAddForeignKeyPrompt(filter, foreignTablePkColPath, mod, i, j),
        ]
    }, [
        filters, 
        liveObjectVersion,
        propertyOptions, 
        showForeignKeyAdditionPrompt,
        setFilterData,
        removeFilter,
        renderOpValue,
        renderOpOption,
        renderPropertySingleValue,
        renderPropertyOption,
        renderValueInput,
        renderAddForeignKeyPrompt,
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
                        newFilters[i].push({ op: filterOps.EQUAL_TO })
                        focusOnLastPropertyInput.current = i
                        setFilters(newFilters)
                    }}>
                    <span>AND</span>
                </button>
                <button onClick={() => {
                    const newFilters = cloneDeep(filters)
                    newFilters.splice(i + 1, 0, [{ op: filterOps.EQUAL_TO }])
                    focusOnLastPropertyInput.current = i + 1
                    setFilters(newFilters)
                }}>
                    <span>OR</span>
                </button>
            </div>
        </div>
    )), [filters, renderFilterInput, setAndButtonRef])

    return (
        <AnimateHeight
            className={className}
            height={useFilters ? 'auto' : 0}
            duration={useFilters ? 400 : 375}
            easing={'cubic-bezier(.16,1,.3,1)'}
            onHeightAnimationStart={() => {
                $(`.${className}`).css('overflow', 'hidden')
            }}
            onHeightAnimationEnd={() => {
                $(`.${className}`).css('overflow', useFilters ? 'visible' : 'hidden')
            }}>
            <div className={pcn('__liner')}>
                { renderFilterGroups() }
            </div>
        </AnimateHeight>
    )
}

LiveColumnFilters = forwardRef(LiveColumnFilters)
export default LiveColumnFilters