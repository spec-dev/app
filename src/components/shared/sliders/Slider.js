import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { getPCN } from '../../../utils/classes'
import { noop } from '../../../utils/nodash'
import { animated, useTransition } from 'react-spring'

const className = 'slider'
const pcn = getPCN(className)

function Slider(props, ref) {
    const { id, children, onShown = noop, willHide = noop } = props
    const [shown, setShown] = useState(false)
    const backdropTransitions = useTransition(shown, {
        from: { opacity: 0 },
        enter: { opacity: 1 },
        leave: { opacity: 0 },
        config: enter => key => {
            return enter
                ? { tension: 315, friction: 32 }
                : { tension: 330, friction: 31 }
        }
    })
    const sliderTransitions = useTransition(shown, {
        from: { opacity: 0, transform: 'translateX(0%)' },
        enter: { opacity: 1, transform: 'translateX(-94%)' },
        leave: { opacity: 0, transform: 'translateX(0%)' },
        config: enter => key => {
            return enter
                ? { tension: 320, friction: 32 }
                : { tension: 330, friction: 31 }
        }
    })

    useImperativeHandle(ref, () => ({
        show: () => setShown(true),
        hide: () => setShown(false),
        isShown: () => !!shown,
    }), [shown])

    useEffect(() => {
        if (shown) {
            onShown()
        }
    }, [shown, onShown])

    return (
        <div id={id} className={className}>
            { backdropTransitions(
                (styles, item) => item && (
                    <animated.div
                        className={pcn('__backdrop')}
                        onClick={() => {
                            willHide()
                            setShown(false)
                        }}
                        style={styles}>
                    </animated.div>
                ))
            }
            { sliderTransitions(
                (styles, item) => item && (
                    <animated.div
                        className={pcn('__panel')}
                        style={styles}>
                        <div className={pcn('__panel-liner')}>
                            { children }
                        </div>
                    </animated.div>
                ))
            }
        </div>
    )
}

Slider = forwardRef(Slider)
export default Slider