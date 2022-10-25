import React, { useCallback, useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import $ from 'jquery';
import { getPCN, cn } from '../../../utils/classes'
import { animated, useTransition } from 'react-spring'
import { noop } from '../../../utils/nodash'
import newColIcon from '../../../svgs/new-col'
import newLiveColIcon from '../../../svgs/new-live-col'
import fxIcon from '../../../svgs/fx-white'

const className = 'new-column-dropdown'
const pcn = getPCN(className)

const options = {
    standard: {
        id: 'standard',
        name: 'Standard Column',
        desc: 'An empty Postgres data column.',
        icon: newColIcon,
    },
    live: {
        id: 'live',
        name: 'Live Column',
        desc: 'Web3 data that auto-populates & auto-updates.',
        icon: newLiveColIcon,
    },
    contractCall: {
        id: 'contract',
        name: 'Contract Function Column',
        desc: 'Poll a contract function and capture its output.',
        icon: '',
    },
}

const orderedOptions = [
    options.standard,
    options.live,
    // options.contractCall,
]

function NewColumnDropdown(props, ref) {
    const { id, onSelectOption = noop } = props
    const [shown, setShown] = useState(false)
    const preventSelection = useRef(false)
    const transitions = useTransition(shown, {
        from: { opacity: 0, transform: 'translateY(-10px)' },
        enter: { opacity: 1, transform: 'translateY(0px)' },
        leave: { opacity: 0, transform: 'translateY(-10px)' },
        config: enter => key => {
            return enter
                ? { tension: 310, friction: key === 'opacity' ? 27 : 17 }
                : { tension: 310, friction: 27 }
        }
    })

    useImperativeHandle(ref, () => ({
        show: () => {
            if (preventSelection.current) return
            setShown(true)
        }
    }))

    const hideIfClickedOff = useCallback(e => {
        if (!shown
            || e.target.id === id
            || e.target.id === `${id}Target`
            || $( e.target ).parents( `#${ id }` ).length
            || $( e.target ).parents( `#${ id }Target` ).length) {
          return
        }
        setShown(false)
    }, [id, shown])

    const onClickOption = useCallback(option => {
        if (preventSelection.current) return
        preventSelection.current = true
        onSelectOption(option)
        setTimeout(() => setShown(false), 50)
        setTimeout(() => {
            preventSelection.current = false
        }, 300)
    }, [onSelectOption])

    useEffect(() => {
        shown
            ? $( document ).bind('click', hideIfClickedOff)
            : $( document ).unbind('click', hideIfClickedOff)
    }, [shown, hideIfClickedOff])

    return transitions(
        (styles, item) => item && (
            <animated.div
                id={id}
                className={cn('dropdown', className)}
                style={styles}>
                <div className={pcn('__liner')}>
                    { orderedOptions.map(option => (
                        <div
                            key={option.id}
                            className={pcn('__option', `__option--${option.id}`)}
                            onClick={() => onClickOption(option)}>
                            <div dangerouslySetInnerHTML={{ __html: option.icon }}>
                            </div>
                            <div>
                                <span>{option.name}</span>
                                <span>{option.desc}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </animated.div>
        )
    )
}

NewColumnDropdown = forwardRef(NewColumnDropdown)
export default NewColumnDropdown