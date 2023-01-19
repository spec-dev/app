import React, { useMemo, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import { cn, getPCN } from '../../../utils/classes'
import TextInput from '../../shared/inputs/TextInput'
import SelectInput from '../../shared/inputs/SelectInput'
import { noop } from '../../../utils/nodash'
import { camelToSnake, snakeToCamel } from '../../../utils/formatters'
import gearIcon from '../../../svgs/gear-thin'
import closeIcon from '../../../svgs/close'
import transformIcon from '../../../svgs/transform'
import triangleIcon from '../../../svgs/triangle'
import { referrers as purposes } from './NewLiveColumnPanel'
import { hEllipsisIcon, keyIcon, modelRelationshipIcon, caretDownIcon, filterControlsIcon } from '../../../svgs/icons'
import { INTEGER, SERIAL, colTypeIcon, displayColType, isColSerial } from '../../../utils/colTypes'
import { guessColTypeFromProperty } from '../../../utils/propertyTypes'
import { getLiveColumnsForTable } from '../../../utils/config'
import short from 'short-uuid'
import ColumnTypeInput from '../inputs/ColumnTypeInput'

const className = 'editable-live-columns'
const pcn = getPCN(className)

const formatNewTableInitialColumns = (liveObjectVersion) => {
    const propertyColumns = (liveObjectVersion.properties || []).map((property, i)=> {
        const colName = camelToSnake(property.name)
        const colType = guessColTypeFromProperty(property)

        return {
            id: short.generate(),
            isNew: true,
            ordinal_position: i + 2,
            name: colName,
            data_type: colType,
            liveColumn: {
                property: property.name,
            },
        }
    })

    return [
        {
            isNew: true,
            id: short.generate(),
            ordinal_position: 1,
            name: 'id',
            data_type: INTEGER,
            isPrimaryKey: true,
            isSerial: true,
        },
        ...propertyColumns,
    ]
}

const formatInitialColumns = (
    table, 
    isNewTable, 
    liveObjectVersion, 
    primaryKeyColNames, 
    foreignKeys, 
    config,
    purpose,
) => {
    if (isNewTable) {
        return formatNewTableInitialColumns(liveObjectVersion)
    }

    const existingLiveColumns = getLiveColumnsForTable(table.schema, table.name, config)
    const propertyNames = new Set(liveObjectVersion.properties?.map(p => p.name) || [])

    let columns = (table.columns || []).map(col => {
        col.isPrimaryKey = primaryKeyColNames.has(col.name)
        col.relationship = foreignKeys[col.name] || null
        col.isSerial = isColSerial(col)

        const existingLiveCol = existingLiveColumns[col.name]
        if (existingLiveCol) {
            const { nsp, name, version } = existingLiveCol

            if (nsp === liveObjectVersion.nsp && 
                name === liveObjectVersion.name && 
                version === liveObjectVersion.version
            ) {
                col.liveColumn = {
                    property: existingLiveCol.property
                }
            } else {
                col.liveColumn = {
                    liveObjectVersionName: name,
                    property: existingLiveCol.property,
                    isDisabled: true,
                }
            }
        } else {
            const camelCaseColName = snakeToCamel(col.name)
            if (propertyNames.has(camelCaseColName)) {
                col.liveColumn = {
                    property: camelCaseColName,
                }
            }
        }
        return col
    })

    columns = columns.sort((a, b) => (
        Number(b.isPrimaryKey) - Number(a.isPrimaryKey) ||
        a.ordinal_position - b.ordinal_position
    ))
    
    if (purpose === purposes.NEW_LIVE_COLUMN) {
        columns.push({
            id: short.generate(),
            isNew: true,
            ordinal_position: columns.length + 1,
            name: null,
            data_type: null,
        })
    }

    return columns
}

function EditableLiveColumns(props, ref) {
    const { table, liveObjectVersion = {}, config, purpose } = props
    const isNewTable = useMemo(() => purpose === purposes.NEW_LIVE_TABLE, [purpose])
    const primaryKeyColNames = useMemo(() => new Set((table.primary_keys || []).map(pk => pk.name)), [table])
    const foreignKeys = useMemo(() => {
        const fks = {}
        for (const rel of (table.relationships || [])) {
            if (rel.source_table_name === table.name) {
                fks[rel.source_column_name] = rel
            }
        }
        return fks
    }, [table])
    const uniqueColGroups = useMemo(() => table.unique_columns || [], [table])
    const nonUniqueIndexes = useMemo(() => table.non_unique_indexes || [], [table])

    const [tableName, setTableName] = useState(isNewTable ? liveObjectVersion.config?.tableName : table.name)
    const [columns, setColumns] = useState(formatInitialColumns(
        table, 
        isNewTable, 
        liveObjectVersion,
        primaryKeyColNames,
        foreignKeys, 
        config,
        purpose,
    ))

    const propertyOptions = useMemo(() => (liveObjectVersion.properties || []).map(p => ({ 
        value: p.name, 
        label: `.${p.name}`, 
        type: p.type,
    })), [liveObjectVersion])

    const colNameInputRefs = useRef({})

    useImperativeHandle(ref, () => ({
        serialize: () => {
            const newColumns = []
            const liveColumns = {}
            for (const col of columns) {
                col.isNew && newColumns.push(col)
                
                if (col.liveColumn?.property && !col.liveColumn.isDisabled) {
                    liveColumns[col.name] = {
                        property: col.liveColumn.property
                    }
                }
            }
            return [newColumns, liveColumns]
        },
        updateTableName: value => setTableName(value),
    }), [columns])

    const setColNameInputRef = useCallback((ref, i) => {
        if (!ref) return
        colNameInputRefs.current[i] = ref
    }, [])

    const addNewColumn = useCallback(() => {
        setColumns(prevColumns => {
            return [
                ...prevColumns,
                {
                    id: short.generate(),
                    isNew: true,
                    ordinal_position: prevColumns.length + 1,
                    name: null,
                    data_type: null,
                }
            ]
        })
    }, [columns])

    const removeNewColumn = useCallback(removeIndex => {
        const newColumns = []
        for (let i = 0; i < columns.length; i++) {
            const column = columns[i]
            if (i === removeIndex && column.isNew) continue
            newColumns.push(column)
        }
        setColumns(newColumns)
    }, [columns])

    const setLiveColumnProperty = useCallback((property, colIndex) => {
        const newColumns = []
        const currentColNames = new Set(columns.map(c => c.name).filter(n => !!n))

        for (let i = 0; i < columns.length; i++) {
            const column = { ...columns[i] }

            if (i === colIndex) {
                if (property) {
                    column.liveColumn = column.liveColumn || {}
                    column.liveColumn.property = property
    
                    // Auto-add column name if it doesn't exist yet and name is available.
                    if (column.isNew && !column.name) {
                        const snakeCaseProperty = camelToSnake(property)
                        
                        if (!currentColNames.has(snakeCaseProperty)) {
                            column.name = snakeCaseProperty

                            setTimeout(() => {
                                const inputRef = colNameInputRefs.current[i]
                                inputRef && inputRef.focus()
                            }, 300)
                        }
                    }

                    // Auto-add column type if it doesn't exist yet.
                    if (column.isNew && !column.data_type) {
                        const fullProperty = liveObjectVersion.properties?.find(p => p.name === property)
                        const colType = fullProperty ? guessColTypeFromProperty(fullProperty) : null
                        if (colType) {
                            column.data_type = colType
                        }
                    }
                } else {
                    column.liveColumn = null
                }
            }
            newColumns.push(column)
        }

        setColumns(newColumns)
    }, [columns, liveObjectVersion])

    const setNewColumnName = useCallback((name, colIndex) => {
        const newColumns = []
        for (let i = 0; i < columns.length; i++) {
            let column = columns[i]
            if (i === colIndex) {
                column.name = name
            }
            newColumns.push(column)
        }
        setColumns(newColumns)
    }, [columns])

    const setNewColumnDataType = useCallback((dataType, colIndex) => {
        const newColumns = []
        for (let i = 0; i < columns.length; i++) {
            let column = columns[i]
            if (i === colIndex) {
                column.data_type = dataType
            }
            newColumns.push(column)
        }
        setColumns(newColumns)
    }, [columns])

    const renderPropertyValue = useCallback(({ innerProps, data }) => {
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
                    data.value === null ? 'spec__option--is-null' : '',
                )}
                { ...innerProps }
                ref={innerRef}>
                <span>{data.label}</span>
                <span>{data.type || ''}</span>
            </span>
        )
    }, [])

    const renderNewColumn = useCallback((col, i) => {
        const property = col.liveColumn?.property

        let colIcon = colTypeIcon(col.data_type)
        if (col.isPrimaryKey) {
            colIcon = keyIcon
        } else if (!!col.relationship) {
            colIcon = modelRelationshipIcon
        }
        colIcon = colIcon || '<span class="--plus">+</span>'

        return (
            <div className={pcn('__new-col', !!property ? '__new-col--live' : '')}>
                <div className={pcn('__new-col-liner')}>
                    <div
                        className={pcn('__new-col-type-icon')}
                        dangerouslySetInnerHTML={{ __html: colIcon }}>
                    </div>
                    <TextInput
                        className={pcn('__new-col-name')}
                        value={col.name || ''}
                        placeholder='column_name'
                        isRequired={true}
                        updateFromAbove={true}
                        spellCheck={false}
                        onChange={value => setNewColumnName(value, i)}
                        ref={r => setColNameInputRef(r, i)}
                    />
                </div>
                { col.isSerial ? 
                    <span className={pcn('__new-col-type-fixed')}>{SERIAL}</span> : (
                    <ColumnTypeInput
                        className={pcn('__new-col-type')}
                        value={displayColType(col.data_type || '')}
                        placeholder='type'
                        icon={caretDownIcon}
                        onChange={value => setNewColumnDataType(value, i)}
                    />
                )}
                <div
                    className={pcn('__new-col-icon', '__new-col-icon--extra')}
                    onClick={() => {}}
                    dangerouslySetInnerHTML={{ __html: filterControlsIcon }}>
                </div>
                <div
                    className={pcn('__new-col-icon', '__new-col-icon--remove')}
                    onClick={() => removeNewColumn(i)}
                    dangerouslySetInnerHTML={{ __html: closeIcon }}>
                </div>
            </div>
        )
    }, [setNewColumnName, setNewColumnDataType, setColNameInputRef])

    const renderExistingColumn = useCallback((col) => {
        const property = col.liveColumn?.property
        const constraints = []

        const uniqueColGroup = uniqueColGroups.find(colGroup => colGroup.includes(col.name))
        const isUnique = !!uniqueColGroup
        isUnique && !col.isPrimaryKey && constraints.push('unique')

        const indexColGroup = nonUniqueIndexes.find(colGroup => colGroup.includes(col.name))
        const isIndexed = !!indexColGroup
        isIndexed && !col.isPrimaryKey && constraints.push('index')

        let colIcon = colTypeIcon(col.data_type)
        if (col.isPrimaryKey) {
            colIcon = keyIcon
        } else if (!!col.relationship) {
            colIcon = modelRelationshipIcon
        }

        return (
            <div className={pcn('__existing-col', !!property ? '__existing-col--live' : '')}>
                <div className={pcn('__existing-col-liner')}>
                    <div
                        className={pcn('__existing-col-type-icon')}
                        dangerouslySetInnerHTML={{ __html: colIcon || '' }}>
                    </div>
                    <div className={pcn('__existing-col-name')}>
                        { col.name }
                    </div>
                    <div className={pcn('__existing-col-constraint-labels')}>
                        { constraints.map(c => (
                            <div
                                key={c}
                                className={pcn(
                                    '__existing-col-constraint-label',
                                    `__existing-col-constraint-label--${c}`
                                )}>
                                <span>{c[0]}</span>
                            </div>
                        ))}
                    </div>
                    <div className={pcn('__existing-col-type')}>
                        { col.isSerial ? SERIAL : displayColType(col.data_type) }
                    </div>
                    <div
                        className={pcn('__existing-col-icon', '__existing-col-icon--edit')}
                        onClick={() => {}}
                        dangerouslySetInnerHTML={{ __html: hEllipsisIcon }}>
                    </div>
                </div>
            </div>
        )
    }, [primaryKeyColNames, foreignKeys])

    const renderPropertyFromOtherLiveObject = useCallback((liveColumn) => (
        <div className={pcn(
            '__col-input-field', 
            '__col-input-field--property',
            '__col-input-field--has-value',
            '__other-live-object',
        )}>
            <div>
                <span>{liveColumn.liveObjectVersionName}.</span>
                <span>{liveColumn.property}</span>
            </div>
        </div>
    ), [])

    const renderColInputs = useCallback(() => columns.map((col, i) => {
        const property = col.liveColumn?.property
        const propertyIsFromOtherLiveObject = col.liveColumn?.isDisabled
        const showArrow = !!property && !col.isSerial

        return (
            <div key={col.id} className={pcn(
                '__col-input',
                propertyIsFromOtherLiveObject ? '__col-input--from-other-live-object' : '',
                col.isNew ? '__col-input--is-new' : '',
                !col.isNew && (columns[i + 1] || {}).isNew ? '__col-input--nex-is-new' : '',
            )}>
                { propertyIsFromOtherLiveObject ? renderPropertyFromOtherLiveObject(col.liveColumn) : (
                    <SelectInput
                        className={pcn(
                            '__col-input-field', 
                            '__col-input-field--property',
                            !!property ? '__col-input-field--has-value' : '',
                        )}
                        classNamePrefix='spec'
                        value={col.liveColumn?.property}
                        options={[
                            { value: null, label: '--' },
                            ...propertyOptions,
                        ]}
                        placeholder='.property'
                        isRequired={true}
                        disabled={col.isSerial}
                        updateFromAbove={true}
                        onChange={value => setLiveColumnProperty(value, i)}
                        comps={{
                            SingleValue: renderPropertyValue,
                            Option: renderPropertyOption,
                        }}
                    />
                )}
                <div className={pcn('__col-arrow', showArrow ? '__col-arrow--shown' : '')}>
                    <div className={pcn('__col-arrow-line')}>
                        <span></span>
                        <span
                            className={pcn('__col-arrow-point')} 
                            dangerouslySetInnerHTML={{ __html: triangleIcon }}>
                        </span>
                    </div>
                </div>
                <div className={pcn('__col-input-container')}>
                    { col.isNew ? renderNewColumn(col, i) : renderExistingColumn(col) }
                </div>
            </div>
        )
    }), [
        columns, 
        setLiveColumnProperty, 
        propertyOptions,
        renderPropertyValue,
        renderPropertyOption,
        renderPropertyFromOtherLiveObject,
        renderNewColumn,
        renderExistingColumn,
        removeNewColumn,
    ])

    return (
        <div className={cn(className, `${className}--${purpose}`)}>
            <div className={pcn('__liner')}>
                <div
                    className={pcn(
                        '__header', 
                        columns.length && columns[0].isPrimaryKey ? '__header--tad-left' : '',
                    )}>
                    <span>{liveObjectVersion.name}:</span>
                    <span>{tableName || 'new_table'}:</span>
                </div>
                <div className={pcn('__col-inputs', !!columns.find(c => c.isNew) ? '__col-inputs--has-new' : '')}>
                    { renderColInputs() }
                </div>
                <div className={pcn('__action-buttons')}>
                    <button onClick={addNewColumn}>
                        <span>+</span>
                        <span>New Live Column</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

EditableLiveColumns = forwardRef(EditableLiveColumns)
export default EditableLiveColumns