import React, { useState, useCallback, useRef, forwardRef, useImperativeHandle, useEffect } from 'react'
import { getPCN } from '../../../utils/classes'
import LiveObjectSearch from './LiveObjectSearch'
import NewLiveColumnSpecs from './NewLiveColumnSpecs'
import { animated, useTransition } from 'react-spring'
import { noop } from '../../../utils/nodash'
import { specs } from '../../../data/specs'
import spinner from '../../../svgs/chasing-tail-spinner'
import NewLiveColumnBehavior from './NewLiveColumnBehavior'

const className = 'new-live-column-panel'
const pcn = getPCN(className)

const getHeaderTitle = index => {
    switch (index) {
        case 0:
            return 'Select Live Object'
        case 1:
            return 'Create Live Columns'
        case 2:
            return 'Relationships & Hooks'
    }
}

function NewLiveColumnPanel(props, ref) {
    const { table = {}, onCancel = noop, onCreate = noop, selectLiveColumnFormatter = noop, addTransform = noop, addHook = noop } = props
    const [state, setState] = useState({ index: 0, liveObjectSpec: {} })
    const [result, setResult] = useState({ cols: null, status: 'default' })
    const liveObjectSearchRef = useRef()
    const newLiveColumnSpecsRef = useRef()
    const hasSaved = useRef(false)
    const transitions = useTransition(state.index, {
        initial: { opacity: 1 },
        from: { opacity: 0 },
        enter: { opacity: 1 },
        leave: { opacity: 0 },
        config: { tension: 400, friction: 32 },
    })

    useImperativeHandle(ref, () => ({
        focusSearchBar: () => liveObjectSearchRef.current?.focusSearchBar(),
    }))

    const onClickCancel = useCallback(() => {
        onCancel()
    }, [onCancel])

    const onClickCreate = useCallback(() => {
        setResult({
            cols: newLiveColumnSpecsRef.current?.serialize(),
            status: 'saving',
        })
    }, [])

    const onClickBack = useCallback(() => {
        setState(prevState => ({ ...prevState, index: 0 }))
    }, [])

    const onSelectLiveObject = useCallback(result => {
        setState({ index: 1, liveObjectSpec: specs[result.id] || {} })
    }, [])

    const renderHeader = useCallback(() => (
        <div className={pcn('__header')}>
            <div className={pcn('__header-liner')}>
                <div className={pcn('__header-title')}>
                    <span>{getHeaderTitle(state.index)}</span>
                </div>
                <div className={pcn('__header-bc', `__header-bc--${state.index}`)}>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    ), [table, state.index])

    const renderFooter= useCallback(() => (
        <div className={pcn('__footer')}>
            <div className={pcn('__footer-liner')}>
                <div
                    className={pcn('__footer-button', '__footer-button--shown')}
                    onClick={state.index > 0 ? onClickBack : onClickCancel}>
                    <span>{ state.index > 0 ? 'Back' : 'Cancel'}</span>
                </div>
                <button
                    className={pcn(
                        '__footer-button',
                        state.index > 0 ? '__footer-button--shown' : '',
                        state.index > 0 ? '__footer-button--final' : '',
                        result.status === 'saving' ? '__footer-button--show-loader' : ''
                    )}
                    onClick={onClickCreate}>
                    { result.status === 'saving'
                        ? <span className='svg-spinner svg-spinner--chasing-tail' dangerouslySetInnerHTML={{ __html: spinner }}></span>
                        : <span>Create</span>
                    }
                </button>
            </div>
        </div>
    ), [onClickCancel, onClickCreate, state.index, onClickBack, result.status])

    useEffect(() => {
        if (result.status === 'saving' && !hasSaved.current) {
            hasSaved.current = true
            setTimeout(() => onCreate(state.liveObjectSpec, result.cols), 1000)
        }
    }, [result, state.liveObjectSpec, onCreate])

    return (
        <div className={className}>
            { renderHeader() }
            { transitions(({ opacity }, i) => {
                switch (i) {
                    case 0:
                        return (
                            <animated.div
                                className={pcn('__section', '__section--0')}
                                style={{ opacity: opacity.to({ range: [0.0, 1.0], output: [0, 1] }) }}>
                                <LiveObjectSearch
                                    onSelectLiveObject={onSelectLiveObject}
                                    ref={liveObjectSearchRef}
                                />
                            </animated.div>  
                        )
                    case 1:
                        return (
                            <animated.div
                                className={pcn('__section', '__section--1')}
                                style={{ opacity: opacity.to({ range: [1.0, 0.0], output: [1, 0] }) }}>
                                <NewLiveColumnSpecs
                                    table={table}
                                    liveObjectSpec={state.liveObjectSpec}
                                    selectLiveColumnFormatter={selectLiveColumnFormatter}
                                    addTransform={addTransform}
                                    addHook={addHook}
                                    ref={newLiveColumnSpecsRef}
                                />
                            </animated.div>
                        )
                    case 2:
                        return (
                            <animated.div
                                className={pcn('__section', '__section--2')}
                                style={{ opacity: opacity.to({ range: [1.0, 0.0], output: [1, 0] }) }}>
                                <NewLiveColumnBehavior
                                    table={table}
                                    liveObjectSpec={state.liveObjectSpec}
                                    selectLiveColumnFormatter={selectLiveColumnFormatter}
                                    addTransform={addTransform}
                                    ref={newLiveColumnSpecsRef}
                                />
                            </animated.div>                        
                        )
                }
            })}
            {/* { transitions(({ opacity }, item) =>
                item ? (
                    <animated.div
                        className={pcn('__section', '__section--0')}
                        style={{ opacity: opacity.to({ range: [0.0, 1.0], output: [0, 1] }) }}>
                        <LiveObjectSearch
                            onSelectLiveObject={onSelectLiveObject}
                            ref={liveObjectSearchRef}
                        />
                    </animated.div>
                ) : (
                    <animated.div
                        className={pcn('__section', '__section--1')}
                        style={{ opacity: opacity.to({ range: [1.0, 0.0], output: [1, 0] }) }}>
                        <NewLiveColumnSpecs
                            table={table}
                            liveObjectSpec={state.liveObjectSpec}
                            selectLiveColumnFormatter={selectLiveColumnFormatter}
                            addTransform={addTransform}
                            ref={newLiveColumnSpecsRef}
                        />
                    </animated.div>
                )
            )} */}
            { renderFooter() }
        </div>
    )
}

NewLiveColumnPanel = forwardRef(NewLiveColumnPanel)
export default NewLiveColumnPanel