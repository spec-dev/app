import React, { useMemo, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import { getPCN } from '../../../utils/classes'
import TextInput from '../../shared/inputs/TextInput'
import SelectInput from '../../shared/inputs/SelectInput'
import { noop } from '../../../utils/nodash'
import { camelToSnake } from '../../../utils/formatters'
import gearIcon from '../../../svgs/gear-thin'
import closeIcon from '../../../svgs/close'
import transformIcon from '../../../svgs/transform'
import triangleIcon from '../../../svgs/triangle'

const className = 'editable-live-columns'
const pcn = getPCN(className)

function EditableLiveColumns(props, ref) {
    const { table = {}, liveObjectVersion = {}, columnNames = [] } = props
    const [liveColumns, setLiveColumns] = useState(props.liveColumns || [{}])

    const propertyOptions = useMemo(() => (liveObjectVersion.properties || []).map(p => (
        { value: p.name, label: `.${p.name}` }
    )), [liveObjectVersion])

    const columnNameOptions = useMemo(() => columnNames?.map(name => (
        { value: name, label: name }
    ) || []), [columnNames])

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

        // Auto-select last column if all columns are live.
        if (columnNames.length === updatedNewCols.length && !updatedNewCols[idx].columnName) {
            const selectedColumnNames = new Set(updatedNewCols.map(entry => entry.columnName).filter(v => !!v))
            updatedNewCols[idx].columnName = columnNames.find(name => !selectedColumnNames.has(name))
        }

        setLiveColumns(updatedNewCols)
    }, [liveColumns, liveObjectVersion, columnNames])

    const addNewColumn = useCallback(() => {
        setLiveColumns(prevState => [ ...prevState, {}])
    }, [])

    const removeCol = useCallback((idx) => {
        const updatedNewCols = []
        for (let i = 0; i < liveColumns.length; i++) {
            if (i === idx) {
                continue
            }
            updatedNewCols.push(liveColumns[i])
        }
        setLiveColumns(updatedNewCols)
    }, [liveColumns])

    const renderColInputs = useCallback(() => liveColumns.map((col, i) => (
        <div key={i} className={pcn('__col-input')}>
            <SelectInput
                className={pcn(
                    '__col-input-field', 
                    '__col-input-field--property', 
                    !!col.property ? '__col-input-field--has-value' : '',
                )}
                classNamePrefix='spec'
                value={col.property}
                options={propertyOptions}
                placeholder='.property'
                isRequired={true}
                updateFromAbove={true}
                onChange={value => setColData(i, 'property', value)}
            />
            <div className={pcn('__col-arrow', !!col.property ? '__col-arrow--shown' : '')}>
                <div className={pcn('__col-arrow-line')}>
                    <span></span>
                    <span className={pcn('__col-arrow-point')} dangerouslySetInnerHTML={{ __html: triangleIcon }}></span>
                </div>
            </div>
            <SelectInput
                className={pcn(
                    '__col-input-field', 
                    '__col-input-field--col-name', 
                )}
                classNamePrefix='spec'
                value={col.columnName}
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
            </div>
        </div>
    )), [liveColumns, setColData, propertyOptions, removeCol])

    return (
        <div className={className}>
            <div className={pcn('__liner')}>
                { liveColumns.length > 0 && 
                    <div className={pcn('__header')}>
                        <span>{liveObjectVersion.name}</span>
                        <span>{table.name}</span>
                    </div>
                }
                <div className={pcn('__col-inputs')}>
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