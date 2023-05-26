import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { getPCN } from '../../../utils/classes'
import { noop } from '../../../utils/nodash'
import { CSSTransition } from 'react-transition-group'

const className = 'slider'
const pcn = getPCN(className)

const timing = {
    SLIDER_DURATION: 460,
}

function Slider(props, ref) {
    const { id, children, onShown = noop, willHide = noop } = props
    const [shown, setShown] = useState(false)
    const sliderRef = useRef(null)
    const backdropRef = useRef(null)

    useImperativeHandle(ref, () => ({
        show: () => setShown(true),
        hide: () => setShown(false),
        isShown: () => !!shown,
    }), [shown])

    useEffect(() => {
        shown && onShown()
    }, [shown, onShown])

    return (
        <div id={id} className={className}>
            <CSSTransition
                nodeRef={backdropRef}
                in={shown}
                timeout={timing.SLIDER_DURATION - 50}
                unmountOnExit={true}
                classNames={pcn('__backdrop')}>
                <div
                    className={pcn('__backdrop')}
                    onClick={() => {
                        willHide()
                        setShown(false)
                    }}
                    ref={backdropRef}>
                </div>
            </CSSTransition>
            <CSSTransition
                nodeRef={sliderRef}
                in={shown}
                timeout={timing.SLIDER_DURATION}
                unmountOnExit={true}
                classNames={pcn('__panel')}>
                <div className={pcn('__panel')} ref={sliderRef}>
                    <div className={pcn('__panel-liner')}>
                        { children }
                    </div>
                </div>
            </CSSTransition>
        </div>
    )
}

Slider = forwardRef(Slider)
export default Slider