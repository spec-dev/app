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
        isMulti = false,
        comps = {},
        disabledOptions = [],
    } = props
    const inputRef = useRef()
    const [data, setData] = useState({
        value: sanitizer(props.value),
        isValid: true,
    })

    const focus = useCallback(() => inputRef.current?.focus(), [])
    const blur = useCallback(() => inputRef.current?.blur(), [])

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
        const parsedValue = isMulti 
            ? (value?.map(v => parseSelectValue(v)) || []).filter(v => v !== null)
            : parseSelectValue(value)

        setData({ value: parsedValue, isValid: true })
        onChange(parsedValue)
    }, [onChange, parseSelectValue, isMulti])

    const getFormattedValue = useCallback(value => {
        if (value === null) return null
        const formattedValue = formatter(value)

        if (isMulti) {
            const optionsByValue = {}
            for (const opt of options) {
                optionsByValue[opt.value] = opt
            }
            const useValue = formattedValue || []
            if (!Array.isArray(useValue)) return []
            return useValue.map(val => optionsByValue[val]).filter(v => !!v)
        }

        return options.find(opt => opt.value === formattedValue)
    }, [options, formatter, isMulti])

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

    comps.DropdownIndicator = comps.DropdownIndicator || renderDropdownIcon

    return (
        <div className={classes}>
            <Select
                classNamePrefix={classNamePrefix}
                placeholder={placeholder}
                options={options}
                value={formattedValue || ''}
                menuPlacement='auto'
                isDisabled={disabled}
                isOptionDisabled={option => disabledOptions.includes(option.value)}
                openMenuOnFocus={true}
                menuShouldScrollIntoView={true}
                isMulti={isMulti}
                tabSelectsValue={true}
                noOptionsMessage={() => 'No Results' }
                onChange={e => !disabled && handleChange(e)}
                components={comps}
                ref={inputRef}
            />
        </div>
    )
}

SelectInput = forwardRef(SelectInput)
export default SelectInput