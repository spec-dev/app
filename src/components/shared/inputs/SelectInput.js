import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react'
import Select from 'react-select'
import { cn, getPCN } from '../../../utils/classes'
import { noop } from '../../../utils/nodash'
import { noMod } from '../../../utils/formatters'
import { notNull } from '../../../utils/validators'
import caretIcon from '../../../svgs/caret-down'

const className = 'select-input'
const pcn = getPCN(className)

function SelectInput(props, ref) {
    const {
        options = [],
        placeholder = '',
        classNamePrefix,
        disabled = false,
        onChange = noop,
        formatter = noMod,
        sanitizer = noMod,
        validator = notNull,
        isRequired = false,
        updateFromAbove = false,
    } = props
    const inputRef = useRef()
    const [data, setData] = useState({
        value: sanitizer(props.value),
        isValid: true,
    })

    const focus = useCallback(() => inputRef.current?.focus(), [])
    const blur = useCallback(() => inputRef.current?.focus(), [])

    useImperativeHandle(ref, () => ({
        focus,
        blur,
        getValue: () => data.value,
        validate,
    }))

    const validate = useCallback((updateState = true) => {
        if (!isRequired) return true

        const isValid = validator(data.value)

        if (updateState !== false && isValid !== data.isValid) {
            setData(prevState => ({ ...prevState, isValid }))
        }

        return isValid
    }, [isRequired, validator, data])

    const parseSelectValue = useCallback(value => {
        if ( value === null || value === [] ) {
            return null
        }
        return sanitizer( value.value )
    }, [sanitizer])

    const handleChange = useCallback(value => {
        const parsedValue = parseSelectValue(value)
        setData({ value: parsedValue, isValid: true })
        setTimeout(() => onChange(parsedValue), 5)
    }, [onChange, parseSelectValue])

    const getFormattedValue = useCallback(value => {
        if (value === null) return null
        const formattedValue = formatter(value)
        return options.find(opt => opt.value === formattedValue)
    }, [options, formatter])

    const renderDropdownIcon = useCallback(({ innerProps }) => (
        <span
            className={pcn('__dropdown-icon')}
            dangerouslySetInnerHTML={{ __html: caretIcon }}
            { ...innerProps }>
        </span>
    ), [])

    useEffect(() => {
        if (!updateFromAbove) return
        const sanitized = sanitizer(props.value)
        if (props.value !== data.value) {
            setData(prevState => ({ ...prevState, value: sanitized }))
        }
    }, [updateFromAbove, props.value, data.value, sanitizer])

    const formattedValue = getFormattedValue(data.value)

    const classes = cn(
        className,
        !data.isValid ? `${ className }--invalid` : '',
        disabled ? `${ className }--disabled` : '',
        formattedValue ? `${ className }--has-value` : '',
        isRequired ? `${ className }--required` : '',
        props.className,
    )

    return (
        <div className={classes}>
            <Select
                classNamePrefix={classNamePrefix}
                placeholder={placeholder}
                options={options}
                value={formattedValue}
                menuPlacement='auto'
                isDisabled={disabled}
                openMenuOnFocus={true}
                menuShouldScrollIntoView={true}
                tabSelectsValue={true}
                noOptionsMessage={() => 'No Results' }
                onChange={e => !disabled && handleChange(e)}
                components={{
                    DropdownIndicator: renderDropdownIcon,
                }}
                ref={inputRef}
            />
        </div>
    )
}

SelectInput = forwardRef(SelectInput)
export default SelectInput
