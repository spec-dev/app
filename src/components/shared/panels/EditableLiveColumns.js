import React, { useMemo, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import { cn, getPCN } from '../../../utils/classes'
import TextInput from '../../shared/inputs/TextInput'
import SelectInput from '../../shared/inputs/SelectInput'
import { noop } from '../../../utils/nodash'
import { camelToSnake } from '../../../utils/formatters'
import gearIcon from '../../../svgs/gear-thin'
import closeIcon from '../../../svgs/close'
import transformIcon from '../../../svgs/transform'
import triangleIcon from '../../../svgs/triangle'
import { abbrevColType } from '../../../utils/formatters'

const className = 'editable-live-columns'
const pcn = getPCN(className)

const sortColumns = columns => columns.sort((a, b) => a.ordinal_position - b.ordinal_position)

function EditableLiveColumns(props, ref) {
    const { table = {}, liveObjectVersion = {} } = props
    const [liveColumns, setLiveColumns] = useState(props.liveColumns || {})
    const [columns, setColumns] = useState(sortColumns(table?.columns || []))
    const propertyOptions = useMemo(() => (liveObjectVersion.properties || []).map(p => (
        { value: p.name, label: `.${p.name}`, type: p.type }
    )), [liveObjectVersion])

    useImperativeHandle(ref, () => ({
        serialize: () => liveColumns,
    }), [liveColumns])

    const setColData = useCallback((idx, key, value) => {
        const updatedNewCols = []

        let colData
        for (let i = 0; i < liveColumns.length; i++) {
            colData = liveColumns[i]
            if (i === idx) {
                colData[key] = value
            }
            updatedNewCols.push(colData)
        }

        // // Auto-select last column if all columns are live.
        // if (columnNames.length === updatedNewCols.length && !updatedNewCols[idx].columnName) {
        //     const selectedColumnNames = new Set(updatedNewCols.map(entry => entry.columnName).filter(v => !!v))
        //     updatedNewCols[idx].columnName = columnNames.find(name => !selectedColumnNames.has(name))
        // }

        // setLiveColumns(updatedNewCols)
    }, [liveColumns, liveObjectVersion])

    const addNewColumn = useCallback(() => {
    //     setLiveColumns(prevState => [ ...prevState, {}])
    }, [])

    const removeCol = useCallback((idx) => {
    //     const updatedNewCols = []
    //     for (let i = 0; i < liveColumns.length; i++) {
    //         if (i === idx) {
    //             continue
    //         }
    //         updatedNewCols.push(liveColumns[i])
    //     }
    //     setLiveColumns(updatedNewCols)
    }, [liveColumns])

    const setLiveColumnProperty = useCallback((colName, property) => {
        if ((liveColumns[colName] || {}).property === property) return
        setLiveColumns(prevState => ({ ...prevState, [colName]: { property } }))
    }, [liveColumns])

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
                )}
                { ...innerProps }
                ref={innerRef}>
                <span>{data.label}</span>
                <span>{data.type || ''}</span>
            </span>
        )
    }, [])

    const renderExistingColumn = useCallback((col, property) => (
        <div className={pcn('__existing-col', !!property ? '__existing-col--live' : '')}>
            <div className={pcn('__existing-col-liner')}>
                <div className={pcn('__existing-col-name')}>
                    { col.name }
                </div>
                <div className={pcn('__existing-col-type')}>
                    { abbrevColType(col.data_type) }
                </div>
            </div>
        </div>
    ), [])

    const renderColInputs = useCallback(() => columns.map((col, i) => {
        const property = (liveColumns[col.name] || {}).property

        return (
            <div key={i} className={pcn('__col-input')}>
                <SelectInput
                    className={pcn(
                        '__col-input-field', 
                        '__col-input-field--property', 
                        !!property ? '__col-input-field--has-value' : '',
                    )}
                    classNamePrefix='spec'
                    value={property}
                    options={propertyOptions}
                    placeholder='.property'
                    isRequired={true}
                    updateFromAbove={true}
                    onChange={value => setLiveColumnProperty(col.name, value)}
                    comps={{
                        SingleValue: renderPropertyValue,
                        Option: renderPropertyOption,
                    }}
                />
                <div className={pcn('__col-arrow', !!property ? '__col-arrow--shown' : '')}>
                    <div className={pcn('__col-arrow-line')}>
                        <span></span>
                        <span className={pcn('__col-arrow-point')} dangerouslySetInnerHTML={{ __html: triangleIcon }}></span>
                    </div>
                </div>
                <div className={pcn('__col-input-container')}>
                    { renderExistingColumn(col, property) }
                    {/* <SelectInput
                        className={pcn(
                            '__col-input-field', 
                            '__col-input-field--col-name',
                        )}
                        classNamePrefix='spec'
                        value={col.name}
                        options={columnNameOptions}
                        placeholder='column_name'
                        isRequired={true}
                        updateFromAbove={true}
                        onChange={value => setColData(i, 'columnName', value)}
                    />
                    <div
                        className={pcn('__col-input-icon-button', '__col-input-icon-button--remove')}
                        onClick={() => removeCol(i)}
                        dangerouslySetInnerHTML={{ __html: closeIcon }}>
                    </div> */}
                </div>
            </div>
        )
    }), [columns, liveColumns, setLiveColumnProperty, setColData, propertyOptions, removeCol, renderExistingColumn])

    return (
        <div className={className}>
            <div className={pcn('__liner')}>
                <div className={pcn('__header')}>
                    <span>{liveObjectVersion.name}:</span>
                    <span>{table.name}:</span>
                </div>
                <div className={pcn('__col-inputs')}>
                    { renderColInputs() }
                </div>
                {/* <div className={pcn('__action-buttons')}> */}
                    {/* <button onClick={addNewColumn}>
                        <span>+</span>
                        <span>New Live Column</span>
                    </button> */}
                {/* </div> */}
            </div>
        </div>
    )
}

EditableLiveColumns = forwardRef(EditableLiveColumns)
export default EditableLiveColumns