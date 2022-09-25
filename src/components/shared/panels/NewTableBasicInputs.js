import React, { useCallback, useState, useImperativeHandle, forwardRef } from 'react'
import { getPCN } from '../../../utils/classes'
import TextInput from '../../shared/inputs/TextInput'

const className = 'new-table-basic-inputs'
const pcn = getPCN(className)

function NewTableBasicInputs(props, ref) {
    const [values, setValues] = useState(props.values || { name: null, desc: null })

    useImperativeHandle(ref, () => ({
        serialize: () => values
    }), [values])

    return (
        <div className={className}>
            <div className={pcn('__input')}>
                <span>Table Name:</span>
                <TextInput
                    className={pcn('__input-field', '__input-field--table-name')}
                    value={values.name || ''}
                    placeholder='table_name'
                    isRequired={true}
                    updateFromAbove={true}
                    spellCheck={false}
                    onChange={value => setValues(prevState => ({ ...prevState, name: value }))}
                />
            </div>
            <div className={pcn('__input')}>
                <span>Table Description:</span>
                <TextInput
                    className={pcn('__input-field', '__input-field--table-desc')}
                    value={values.desc || ''}
                    placeholder='Description'
                    isRequired={true}
                    updateFromAbove={true}
                    spellCheck={false}
                    onChange={value => setValues(prevState => ({ ...prevState, desc: value }))}
                />
            </div>
        </div>
    )
}

NewTableBasicInputs = forwardRef(NewTableBasicInputs)
export default NewTableBasicInputs