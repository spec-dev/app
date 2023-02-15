import React, { useEffect, useState, useCallback } from 'react'
import { getPCN, cn } from '../../../utils/classes'
import { noop } from '../../../utils/nodash'

const className = 'toggle'
const pcn = getPCN(className)

function Toggle(props) {
    const { falseText = 'No', trueText = 'Yes', onChange = noop, setInternally = false } = props
    const [value, setValue] = useState(props.value)

    const onToggle = useCallback((newValue) => {
        if (newValue === value) return
        setInternally && setValue(newValue)
        onChange(newValue)
    }, [value, onChange, setInternally])

    useEffect(() => {
        props.value !== value && setValue(props.value)
    }, [props.value, value])

    return (
        <div className={cn(className, value ? `${className}--true` : '')}>
            <div className={pcn('__side', '__side--false')} onClick={() => onToggle(false)}>
                <span>{falseText}</span>
            </div>
            <div className={pcn('__side', '__side--true')} onClick={() => onToggle(true)}>
                <span>{trueText}</span>
            </div>
            <div className={pcn('__slider')}></div>
        </div>
    )
}

export default Toggle