import React, { useMemo, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import { getPCN } from '../../../utils/classes'
import TextInput from '../../shared/inputs/TextInput'
import SelectInput from '../../shared/inputs/SelectInput'
import gearIcon from '../../../svgs/gear-thin'
import closeIcon from '../../../svgs/close'
import keyIcon from '../../../svgs/key'
import modelRelIcon from '../../../svgs/model-relationship'

const className = 'editable-standard-columns'
const pcn = getPCN(className)

const dataTypeOptions = [
    { value: 'int8', label: 'int8' },
]

const renderColNameIcon = col => {
    if (col.columnName === 'id') {
        return <span dangerouslySetInnerHTML={{ __html: keyIcon }}></span>
    } else if (col.columnName === 'wallet_id') {
        return <span dangerouslySetInnerHTML={{ __html: modelRelIcon }}></span>
    } else {
        return null
    }
}

function EditableStandardColumns(props, ref) {
    const [newCols, setNewCols] = useState(props.newCols || [{}])

    useImperativeHandle(ref, () => ({
        serialize: () => newCols
    }), [newCols])

    const setColData = useCallback((idx, key, value) => {
        const updatedNewCols = []

        let colData
        for (let i = 0; i < newCols.length; i++) {
            colData = newCols[i]
            if (i === idx) {
                colData[key] = value
            }
            updatedNewCols.push(colData)
        }

        setNewCols(updatedNewCols)
    }, [newCols])

    const addNewColumn = useCallback(() => {
        setNewCols(prevState => [ ...prevState, {}])
    }, [])

    const removeCol = useCallback((idx) => {
        const updatedNewCols = []
        for (let i = 0; i < newCols.length; i++) {
            if (i === idx) {
                continue
            }
            updatedNewCols.push(newCols[i])
        }
        setNewCols(updatedNewCols)

        // TODO: Do something to adjust manuallyChangedColName map
    }, [newCols])

    const renderColInputs = useCallback(() => newCols.map((col, i) => (
        <div key={i} className={pcn('__col-input')}>
            <TextInput
                className={pcn('__col-input-field', '__col-input-field--col-name', `__col-input-field--col-name-${col.columnName}`)}
                value={col.columnName || ''}
                placeholder='name'
                isRequired={true}
                updateFromAbove={true}
                spellCheck={false}
                onChange={value => setColData(i, 'columnName', value)}
                renderAfter={ () => renderColNameIcon(col) }
            />
            <SelectInput
                className={pcn(
                    '__col-input-field', 
                    '__col-input-field--data-type',
                    col.columnName === 'wallet_id' ? '__col-input-field--disabled' : '',
                )}
                classNamePrefix='spec'
                value='int8'
                options={dataTypeOptions}
                disabled={col.columnName === 'wallet_id'}
                placeholder='type'
                isRequired={true}
                updateFromAbove={true}
                onChange={value => setColData(i, 'dataType', value)}
            />
            <TextInput
                className={pcn(
                    '__col-input-field', 
                    '__col-input-field--default-value',
                    col.columnName === 'id' ? '__col-input-field--disabled' : '',
                )}
                value={col.defaultValue || ''}
                placeholder='NULL'
                isRequired={true}
                updateFromAbove={true}
                spellCheck={false}
                onChange={value => setColData(i, 'defaultValue', value)}
            />
            <div
                className={pcn('__col-input-icon-button', '__col-input-icon-button--settings')}
                onClick={() => {}}
                dangerouslySetInnerHTML={{ __html: gearIcon }}>
            </div>
            <div
                className={pcn('__col-input-icon-button', '__col-input-icon-button--remove')}
                onClick={() => removeCol(i)}
                dangerouslySetInnerHTML={{ __html: closeIcon }}>
            </div>
        </div>
    )), [newCols, setColData, removeCol])

    return (
        <div className={className}>
            <div className={pcn('__liner')}>
                <div className={pcn('__header')}>
                    <span>Name</span>
                    <span>Type</span>
                    <span>Default Value</span>
                </div>
                <div className={pcn('__col-inputs')}>
                    { renderColInputs() }
                </div>
                <div className={pcn('__action-buttons')}>
                    <button onClick={addNewColumn}>
                        <span>+</span>
                        <span>New Column</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

EditableStandardColumns = forwardRef(EditableStandardColumns)
export default EditableStandardColumns