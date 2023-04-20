import React, { useState, useImperativeHandle, forwardRef } from 'react'
import { getPCN } from '../../../utils/classes'
import TextInput from '../../shared/inputs/TextInput'
import { noop } from '../../../utils/nodash'

const className = 'new-table-basic-inputs'
const pcn = getPCN(className)

function NewTableBasicInputs(props, ref) {
    const { onNameChange = noop } = props
    const [values, setValues] = useState(props.values || { name: null, desc: null })

    useImperativeHandle(ref, () => ({
        serialize: () => values
    }), [values])

    return (
        <div className={className}>
            <TextInput
                className={pcn('__input-field', '__input-field--name')}
                value={values.name || ''}
                placeholder='table_name'
                isRequired={true}
                updateFromAbove={true}
                spellCheck={false}
                onChange={value => {
                    setValues(prevState => ({ ...prevState, name: value }))
                    onNameChange(value)
                }}
            />
            <TextInput
                className={pcn('__input-field', '__input-field--desc')}
                value={values.desc || ''}
                placeholder='Description'
                isRequired={true}
                updateFromAbove={true}
                spellCheck={false}
                onChange={value => setValues(prevState => ({ ...prevState, desc: value }))}
            />
        </div>
    )
}

NewTableBasicInputs = forwardRef(NewTableBasicInputs)
export default NewTableBasicInputs