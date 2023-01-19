import React, { useRef, useState, useImperativeHandle, forwardRef, useEffect, useCallback } from 'react'
import { cn, getPCN } from '../../../utils/classes'
import { noop } from '../../../utils/nodash'
import { nonEmptyStringWhenTrimmed } from '../../../utils/validators'
import { keyCodes } from '../../../utils/keyboard'

const className = 'timestamp-input'
const pcn = getPCN(className)

const comps = {
    YEAR: 'year',
    MONTH: 'month',
    DAY: 'day',
    HOUR: 'hour',
    MIN: 'min',
    SEC: 'sec'
}

const orderedComps = [
    comps.YEAR,
    comps.MONTH,
    comps.DAY,
    comps.HOUR,
    comps.MIN,
    comps.SEC,
]

const getPrevComp = comp => {
    const index = orderedComps.indexOf(comp)
    if (index <= 0) return null
    return orderedComps[index - 1]
}

const getNextComp = comp => {
    const index = orderedComps.indexOf(comp)
    if (index === -1) return null
    if (index === orderedComps.length - 1) return null
    return orderedComps[index + 1]
}

function TimestampInput(props, ref) {
    const {
        validator = nonEmptyStringWhenTrimmed,
        isRequired = false,
        onChange = noop,
    } = props
    const [isValid, setIsValid] = useState(true)
    const jumpToComp = useRef()
    const jumpBackFrom = useRef()
    const jumpForwardTo = useRef()
    const inputRefs = useRef({})
    const prevValue = useRef()

    useImperativeHandle(ref, () => ({
        focus: () => inputRefs.current[comps.YEAR] && inputRefs.current[comps.YEAR].focus(),
        validate,
    }))

    const setInputRef = useCallback((r, comp) => {
        if (!r) return
        inputRefs.current[comp] = r
    }, [])

    const validate = (updateState = true) => {
        const performValidation = () => {
            const valid = validator(props.value)

            if (updateState && valid !== isValid) {
                setIsValid(valid)
            }

            return valid
        }

        // Always validate when required.
        if (isRequired) {
            return performValidation()
        }

        return true
    }

    const handleChange = useCallback((value) => {
        prevValue.current = props.value
        onChange(value)
    }, [onChange, props.value])

    const onChangeComp = useCallback((e, comp) => {
        const maxLen = comp === comps.YEAR ? 4 : 2
        let compValue = (e.currentTarget.value || '').trim()
        if (compValue.length > maxLen) {
            compValue = compValue.slice(0, maxLen)
        }

        jumpToComp.current = compValue.length === maxLen
            ? getNextComp(comp) 
            : null
            
        handleChange({
            ...(props.value || {}),
            [comp]: compValue,
        })
    }, [handleChange, props.value])

    const formatCompOnBlur = useCallback((comp) => {
        const compValue = (props.value || {})[comp]
        if (!compValue) return

        const intValue = parseInt(compValue)
        if (Number.isNaN(intValue)) {
            handleChange({
                ...(props.value || {}),
                [comp]: null,
            })
            return
        }

        const maxLen = comp === comps.YEAR ? 4 : 2
        let strIntValue = intValue.toString()

        while (strIntValue.length < maxLen) {
            strIntValue = '0' + strIntValue
        }

        handleChange({
            ...(props.value || {}),
            [comp]: strIntValue,
        })
    }, [props.value, handleChange])

    const onKeyDown = useCallback((e, comp) => {
        const cursorPos = e.currentTarget.selectionStart
        const maxLen = comp === comps.YEAR ? 4 : 2

        if (
            (e.which === keyCodes.BACKSPACE && !e.currentTarget.value) ||
            (e.which === keyCodes.ARROW_LEFT && cursorPos === 0)
        ) {
            jumpBackFrom.current = comp
        }
        else if (e.which === keyCodes.ARROW_RIGHT && cursorPos === maxLen) {
            jumpForwardTo.current = comp
        }
        else {
            jumpBackFrom.current = null
            jumpForwardTo.current = null
        }
    }, [])

    const onKeyUp = useCallback((e, comp) => {
        if (jumpBackFrom.current && comp === jumpBackFrom.current) {
            const prevCompName = getPrevComp(jumpBackFrom.current)
            const prevComp = prevCompName && inputRefs.current[prevCompName]
            prevComp && prevComp.focus()
            jumpBackFrom.current = null
        } else if (jumpForwardTo.current && comp === jumpForwardTo.current) {
            const nextCompName = getNextComp(jumpForwardTo.current)
            const nextComp = nextCompName && inputRefs.current[nextCompName]
            nextComp && nextComp.focus()
            jumpForwardTo.current = null
        }
    }, [])

    useEffect(() => {
        if (jumpToComp.current) {
            const nextComp = inputRefs.current[jumpToComp.current]
            nextComp && nextComp.focus()
            jumpToComp.current = null
        }
    }, [props.value])

    const renderYearInput = useCallback(() => (
        <input
            className={pcn('__year-input')}
            type='text'
            value={props.value?.year || ''}
            placeholder='YYYY'
            autoComplete='nah'
            onChange={e => onChangeComp(e, comps.YEAR)}
            onBlur={() => formatCompOnBlur(comps.YEAR)}
            onKeyUp={e => onKeyUp(e, comps.YEAR)}
            onKeyDown={e => onKeyDown(e, comps.YEAR)}
            ref={r => setInputRef(r, comps.YEAR)}
        />
    ), [props.value?.year, onChangeComp, formatCompOnBlur, setInputRef])

    const renderMonthInput = useCallback(() => (
        <input
            className={pcn('__month-input')}
            type='text'
            value={props.value?.month || ''}
            placeholder='MM'
            autoComplete='nah'
            onChange={e => onChangeComp(e, comps.MONTH)}
            onBlur={() => formatCompOnBlur(comps.MONTH)}
            onKeyUp={e => onKeyUp(e, comps.MONTH)}
            onKeyDown={e => onKeyDown(e, comps.MONTH)}
            ref={r => setInputRef(r, comps.MONTH)}
        />
    ), [props.value?.month, onChangeComp, formatCompOnBlur, setInputRef, onKeyUp, onKeyDown])

    const renderDayInput = useCallback(() => (
        <input
            className={pcn('__day-input')}
            type='text'
            value={props.value?.day || ''}
            placeholder='DD'
            autoComplete='nah'
            onChange={e => onChangeComp(e, comps.DAY)}
            onBlur={() => formatCompOnBlur(comps.DAY)}
            onKeyUp={e => onKeyUp(e, comps.DAY)}
            onKeyDown={e => onKeyDown(e, comps.DAY)}
            ref={r => setInputRef(r, comps.DAY)}
        />
    ), [props.value?.day, onChangeComp, formatCompOnBlur, setInputRef])

    const renderHourInput = useCallback(() => (
        <input
            className={pcn('__hour-input')}
            type='text'
            value={props.value?.hour || ''}
            placeholder='HH'
            autoComplete='nah'
            onChange={e => onChangeComp(e, comps.HOUR)}
            onBlur={() => formatCompOnBlur(comps.HOUR)}
            onKeyUp={e => onKeyUp(e, comps.HOUR)}
            onKeyDown={e => onKeyDown(e, comps.HOUR)}
            ref={r => setInputRef(r, comps.HOUR)}
        />
    ), [props.value?.hour, onChangeComp, formatCompOnBlur, setInputRef])

    const renderMinInput = useCallback(() => (
        <input
            className={pcn('__min-input')}
            type='text'
            value={props.value?.min || ''}
            placeholder='MM'
            autoComplete='nah'
            onChange={e => onChangeComp(e, comps.MIN)}
            onBlur={() => formatCompOnBlur(comps.MIN)}
            onKeyUp={e => onKeyUp(e, comps.MIN)}
            onKeyDown={e => onKeyDown(e, comps.MIN)}
            ref={r => setInputRef(r, comps.MIN)}
        />
    ), [props.value?.min, onChangeComp, formatCompOnBlur, setInputRef])

    const renderSecInput = useCallback(() => (
        <input
            className={pcn('__sec-input')}
            type='text'
            value={props.value?.sec || ''}
            placeholder='SS'
            autoComplete='nah'
            onChange={e => onChangeComp(e, comps.SEC)}
            onBlur={() => formatCompOnBlur(comps.SEC)}
            onKeyUp={e => onKeyUp(e, comps.SEC)}
            onKeyDown={e => onKeyDown(e, comps.SEC)}
            ref={r => setInputRef(r, comps.SEC)}
        />
    ), [props.value?.sec, onChangeComp, formatCompOnBlur, setInputRef])

    return (
        <div className={cn(
            className, 
            !isValid ? `${ className }--invalid` : '',
            props.className,
        )}>
            { renderYearInput() }
            <span>-</span>
            { renderMonthInput() }
            <span>-</span>
            { renderDayInput() }
            <span>&nbsp;</span>
            { renderHourInput() }
            <span>:</span>
            { renderMinInput() }
            <span>:</span>
            { renderSecInput() }
        </div>
    )
}

TimestampInput = forwardRef(TimestampInput)
export default TimestampInput