import { useCallback } from 'react'
import { cn, getPCN } from '../../../utils/classes'
import SelectInput from './SelectInput'
import {
    INT2,
    INT4,
    INT8,
    FLOAT4,
    FLOAT8,
    NUMERIC,
    VARCHAR,
    TEXT,
    CHAR,
    BOOLEAN,
    DATE,
    TIMESTAMPTZ,
    TIMESTAMP,
    TIMETZ,
    TIME,
    JSON,
    JSONB,
    displayColType,
    colTypeIcon,
} from '../../../utils/colTypes'

const className = 'column-type-input'
const pcn = getPCN(className)

const options = [
    INT2,
    INT4,
    INT8,
    FLOAT4,
    FLOAT8,
    NUMERIC,
    VARCHAR,
    TEXT,
    CHAR,
    BOOLEAN,
    TIMESTAMPTZ,
    TIMESTAMP,
    TIMETZ,
    TIME,
    DATE,
    JSON,
    JSONB,
].map(value => ({ value, label: value }))

function ColumnTypeInput(props) {
    const { showIconInSingleValue } = props

    const renderSingleValue = useCallback(({ innerProps, data }) => {
        return (
            <span
                className='spec__single-value'
                { ...innerProps }>
                { showIconInSingleValue && <span dangerouslySetInnerHTML={{ __html: colTypeIcon(data.value) }}></span> }
                <span>{data.label}</span>
            </span>
        )
    }, [])

    const renderOption = useCallback(({ innerRef, innerProps, data, isFocused, isSelected, isDisabled }) => {
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
                <span dangerouslySetInnerHTML={{ __html: colTypeIcon(data.value) }}></span>
                <span>{data.label}</span>
            </span>
        )
    }, [])

    return (
        <SelectInput
            options={options}
            classNamePrefix='spec'
            isRequired={true}
            updateFromAbove={true}
            comps={{
                SingleValue: renderSingleValue,
                Option: renderOption,
            }}
            {...props}
            className={cn(className, props.className)}
        />
    )
}

export default ColumnTypeInput