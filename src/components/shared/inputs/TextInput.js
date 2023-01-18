import React, { useRef, useState, useImperativeHandle, forwardRef, useEffect } from 'react'
import $ from 'jquery';
import { cn } from '../../../utils/classes'
import { noop } from '../../../utils/nodash'
import { keyCodes } from '../../../utils/keyboard'
import { noMod } from '../../../utils/formatters'
import { secureText } from '../../../utils/sanitizers'
import { nonEmptyStringWhenTrimmed, notNull } from '../../../utils/validators'

function TextInput(props, ref) {
    const className = 'text-input'
    const {
        type = 'text',
        placeholder = '',
        disabled = false,
        autoComplete = false,
        spellCheck = true,
        onChange = noop,
        onEnter = noop,
        onEsc = noop,
        onFocus = noop,
        onBlur = noop,
        onArrowUp = noop,
        onArrowDown = noop,
        formatter = noMod,
        sanitizer = secureText,
        validator = nonEmptyStringWhenTrimmed,
        isRequired = false,
        updateFromAbove = false,
        validateWhenValueExists = false,
        renderAfter = noop,
    } = props
    const inputRef = useRef()
    const lastKeyCode = useRef(null)
    const [data, setData] = useState({
        value: sanitizer(props.value),
        isValid: true,
    })

    useImperativeHandle(ref, () => ({
        focus: () => inputRef.current && $(inputRef.current).focus(),
        blur: () => inputRef.current && $(inputRef.current).blur(),
        getValue: () => data.value,
        validate,
    }))

    const validate = (updateState = true) => {
        const performValidation = () => {
            const isValid = validator( data.value )

            if ( updateState && isValid !== data.isValid ) {
                setData(prevState => ({ ...prevState, isValid }))
            }

            return isValid
        }

        // Always validate when required.
        if ( isRequired ) {
            return performValidation()
        }

        // If not required, but should be validated if a value exists,
        // then check if a value exists, and validate if so.
        if ( validateWhenValueExists ) {
            return notNull( data.value ) && data.value.toString() ? performValidation() : true
        }

        return true
    }

    const handleChange = e => {
        const value = sanitizer(e.currentTarget.value, lastKeyCode.current)
        setData({ value, isValid: true })
        onChange(value)
    }

    const onKeyDown = e => {
        lastKeyCode.current = e.which

        switch (lastKeyCode.current) {
        case keyCodes.ESCAPE:
            onEsc()
            break
        case keyCodes.ARROW_UP:
            onArrowUp()
            break
        case keyCodes.ARROW_DOWN:
            onArrowDown()
            break
        default:
            break
        }
    }

    const onKeyUp = e => {
        switch (lastKeyCode.current) {
        case keyCodes.ENTER:
            onEnter()
            break
        default:
            break
        }
    }

    useEffect(() => {
        if (!updateFromAbove) return
        const sanitized = sanitizer(props.value)
        if (props.value !== data.value) {
            setData(prevState => ({ ...prevState, value: sanitized }))
        }
    }, [updateFromAbove, props.value, data.value, sanitizer])

    const formattedValue = formatter(data.value)

    const classes = cn(
        className,
        !data.isValid ? `${ className }--invalid` : '',
        disabled ? `${ className }--disabled` : '',
        formattedValue ? `${ className }--has-value` : '',
        isRequired ? `${ className }--required` : '',
        props.className,
    );

    return (
        <div className={classes}>
            <input
                value={formattedValue === null ? '' : formattedValue}
                autoComplete={autoComplete ? 'on' : 'nah'}
                onChange={e => !disabled && handleChange(e)}
                ref={inputRef}
                {...{
                    type,
                    placeholder,
                    disabled,
                    spellCheck,
                    onFocus,
                    onBlur,
                    onKeyDown,
                    onKeyUp,
                }}
            />
            { renderAfter(formattedValue || placeholder || '') }
        </div>
    )
}

TextInput = forwardRef(TextInput)
export default TextInput