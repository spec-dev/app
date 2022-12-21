import React, { useState, useCallback, useRef, forwardRef, useImperativeHandle, useEffect } from 'react'
import { getPCN } from '../../../utils/classes'
import LiveObjectSearch from './LiveObjectSearch'
import NewLiveColumnSpecs from './NewLiveColumnSpecs'
import { animated, useTransition } from 'react-spring'
import { noop } from '../../../utils/nodash'
import api from '../../../utils/api'
import { toNamespacedVersion } from '../../../utils/formatters'
import spinner from '../../../svgs/chasing-tail-spinner'
import { getAllLiveObjects } from '../../../utils/liveObjects'
import { pendingSeeds } from '../../../utils/pendingSeeds'

const className = 'new-live-column-panel'
const pcn = getPCN(className)

const status = {
    DEFAULT: 'default',
    SAVING: 'saving',
}

const getHeaderTitle = index => {
    switch (index) {
        case 0:
            return 'Select Live Object'
        case 1:
            return 'Apply Live Columns'
    }
}

function NewLiveColumnPanel(props, ref) {
    // Props.
    const {
        table = {},
        schema,
        onCancel = noop,
        onSave = noop,
        selectLiveColumnFormatter = noop,
        addTransform = noop,
        addHook = noop,
    } = props
    const liveObjects = getAllLiveObjects()

    // State.
    const [state, setState] = useState({
        status: status.DEFAULT,
        payload: null,
        index: 0,
        liveObject: {},
    })

    // Refs.
    const liveObjectSearchRef = useRef()
    const newLiveColumnSpecsRef = useRef()

    // Transitions.
    const transitions = useTransition(state.index, {
        initial: { opacity: 1 },
        from: { opacity: 0 },
        enter: { opacity: 1 },
        leave: { opacity: 0 },
        config: { tension: 400, friction: 32 },
    })

    useImperativeHandle(ref, () => ({
        focusSearchBar: () => liveObjectSearchRef.current?.focusSearchBar(),
        isSaving: () => state.status === status.SAVING,
    }), [state.status])

    const onClickCancel = useCallback(() => {
        onCancel()
    }, [onCancel])

    const onClickApply = useCallback(() => {
        let payload = newLiveColumnSpecsRef.current?.serialize()
        if (!payload) return

        payload = {
            ...payload,
            tablePath: [schema, table.name].join('.'),
            liveObjectVersionId: toNamespacedVersion(
                state.liveObject?.latestVersion || {},
            ),
        }

        setState(prevState => ({ 
            ...prevState,
            status: status.SAVING,
            payload,
        }))
    }, [state.liveObject, schema, table])

    const onClickBack = useCallback(() => {
        setState(prevState => ({ ...prevState, index: 0 }))
    }, [])

    const onSelectLiveObject = useCallback(liveObject => {
        setState(prevState => ({ ...prevState, index: 1, liveObject }))
    }, [])

    const save = useCallback(async () => {
        const { data, ok } = await api.meta.liveColumns(state.payload)
        if (!ok) {
            // TODO: Show error
            setState(prevState => ({ ...prevState, status: status.DEFAULT }))
            return
        }
    }, [state])

    useEffect(() => {
        if (state.status === status.SAVING && !!state.payload) {
            pendingSeeds.add(state.payload.tablePath)
            save()
            setTimeout(onSave, 10)
        }
    }, [state.status, save, onSave])

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

    const renderFooter = useCallback(() => (
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
                        state.status === 'saving' ? '__footer-button--show-loader' : ''
                    )}
                    onClick={onClickApply}>
                        <span>Apply</span>
                    {/* { state.status === 'saving'
                        ? (
                            <span
                                className='svg-spinner svg-spinner--chasing-tail'
                                dangerouslySetInnerHTML={{ __html: spinner }}>    
                            </span>
                        ) : <span>Apply</span>
                    } */}
                </button>
            </div>
        </div>
    ), [onClickCancel, onClickApply, state.index, onClickBack, state.status])

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
                                    liveObjects={liveObjects}
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
                                    schema={schema}
                                    liveObject={state.liveObject}
                                    selectLiveColumnFormatter={selectLiveColumnFormatter}
                                    addTransform={addTransform}
                                    addHook={addHook}
                                    ref={newLiveColumnSpecsRef}
                                />
                            </animated.div>
                        )
                }
            })}
            { renderFooter() }
        </div>
    )
}

NewLiveColumnPanel = forwardRef(NewLiveColumnPanel)
export default NewLiveColumnPanel