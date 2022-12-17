import React, { useState, useCallback, useEffect, useRef } from 'react';
import { getPCN } from '../../utils/classes'

const modifiers = {
    initial: 'initial',
    up: 'up',
    waitDown: 'wait-down',
}

const timing = {
    duration: 240,
}

const className = 'flipper'
const pcn = getPCN(className)

function Flipper(props) {
    const [value, setValue] = useState(props.value)
    const [animationModifier, setAnimationModifier] = useState(modifiers.initial)

    const transitionToNewValue = useCallback((newValue) => {
        setTimeout(() => setAnimationModifier(modifiers.up), 0)
        setTimeout(() => setValue(newValue), timing.duration / 2)
        setTimeout(() => setAnimationModifier(`${modifiers.waitDown} flipped`), timing.duration / 2)
        setTimeout(() => setAnimationModifier(`${modifiers.initial} flipped flipped-done`), timing.duration * 0.6)
    }, [])

    useEffect(() => {
        if (props.value !== value) {
            transitionToNewValue(props.value)
        }
    }, [props.value, transitionToNewValue, value]) 

    return (
        <div className={className}>
            <div className={pcn('__liner')}>
                <span className={animationModifier}>{value}</span>
            </div>
        </div>
    )
}

export default Flipper;
