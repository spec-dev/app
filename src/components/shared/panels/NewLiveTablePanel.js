import React, { useState, useCallback, useRef, forwardRef, useImperativeHandle, useEffect } from 'react'
import { getPCN } from '../../../utils/classes'
import LiveTableSearch from './LiveTableSearch'
import NewLiveTableSpecs from './NewLiveTableSpecs'
import { animated, useTransition } from 'react-spring'
import { noop } from '../../../utils/nodash'
import { specs } from '../../../data/specs'
import { tables } from '../../../data/dapps'
import spinner from '../../../svgs/chasing-tail-spinner'

const className = 'new-live-table-panel'
const pcn = getPCN(className)

function NewLiveTablePanel(props, ref) {
    const { onCancel = noop, onCreate = noop, selectLiveColumnFormatter = noop } = props
    const [state, setState] = useState({ index: 0, liveObjectSpec: {}, table: {} })
    const [result, setResult] = useState({ table: null, status: 'default' })
    const liveTableSearchRef = useRef()
    const newLiveTableSpecsRef = useRef()
    const hasSaved = useRef(false)
    const transitions = useTransition(state.index === 0, {
        initial: { opacity: 1 },
        from: { opacity: 0 },
        enter: { opacity: 1 },
        leave: { opacity: 0 },
        config: { tension: 400, friction: 32 },
    })

    useImperativeHandle(ref, () => ({
        focusSearchBar: () => liveTableSearchRef.current?.focusSearchBar(),
    }))

    const onClickCancel = useCallback(() => {
        onCancel()
    }, [onCancel])

    const onClickCreate = useCallback(() => {
        setResult({
            // table: newLiveTableSpecsRef.current?.serialize(), // NOT USING ANYTHING RIGHT NOW
            status: 'saving',
        })
    }, [])

    const onClickBack = useCallback(() => {
        setState(prevState => ({ ...prevState, index: 0 }))
    }, [])

    const onSelectLiveTable = useCallback(result => {
        let table = {}
        let liveObjectSpec = {}
        if (result.id === 'WalletNFTs') {
            table = tables.nfts
            liveObjectSpec = table.liveObjectSpec
        }
        else if (result.id === 'AaveUserPositions') {
            table = tables.aaveUserPositions
            liveObjectSpec = table.liveObjectSpec
        } 
        else {
            liveObjectSpec = specs[result.id] || {}
        }

        setState({ index: 1, liveObjectSpec, table })
    }, [])

    useEffect(() => {
        if (result.status === 'saving' && !hasSaved.current) {
            hasSaved.current = true
            setTimeout(() => onCreate(), 1000)
        }
    }, [result, state.liveObjectSpec, onCreate])

    const renderHeader = useCallback(() => (
        <div className={pcn('__header')}>
            <div className={pcn('__header-liner')}>
                <div className={pcn('__header-title')}>
                    <span>New Live Table</span>
                </div>
                <div className={pcn('__header-bc', `__header-bc--${state.index}`)}>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    ), [state.index])

    const renderFooter = useCallback(() => (
        <div className={pcn('__footer')}>
            <div className={pcn('__footer-liner')}>
                <div
                    className={pcn('__footer-button', '__footer-button--shown')}
                    onClick={state.index === 1 ? onClickBack : onClickCancel}>
                    <span>{ state.index === 1 ? 'Back' : 'Cancel'}</span>
                </div>
                <button
                    className={pcn(
                        '__footer-button',
                        state.index === 1 ? '__footer-button--shown' : '',
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

    return (
        <div className={className}>
            { renderHeader() }
            { transitions(({ opacity }, item) =>
                item ? (
                    <animated.div
                        className={pcn('__section', '__section--0')}
                        style={{ opacity: opacity.to({ range: [0.0, 1.0], output: [0, 1] }) }}>
                        <LiveTableSearch
                            onSelectLiveTable={onSelectLiveTable}
                            ref={liveTableSearchRef}
                        />
                    </animated.div>
                ) : (
                    <animated.div
                        className={pcn('__section', '__section--1')}
                        style={{ opacity: opacity.to({ range: [1.0, 0.0], output: [1, 0] }) }}>
                        <NewLiveTableSpecs
                            table={state.table}
                            liveObjectSpec={state.liveObjectSpec}
                            selectLiveColumnFormatter={selectLiveColumnFormatter}
                            ref={newLiveTableSpecsRef}
                        />
                    </animated.div>
                )
            )}
            { renderFooter() }
        </div>
    )
}

NewLiveTablePanel = forwardRef(NewLiveTablePanel)
export default NewLiveTablePanel