import React, { useState, useCallback, useRef, forwardRef, useImperativeHandle, useEffect } from 'react'
import { getPCN } from '../../../utils/classes'
import LiveObjectSearch from './LiveObjectSearch'
import NewLiveColumnSpecs from './NewLiveColumnSpecs'
import { animated, useTransition } from 'react-spring'
import { noop } from '../../../utils/nodash'
import { camelToSnake } from '../../../utils/formatters'
import $ from 'jquery'
import api from '../../../utils/api'
import { toNamespacedVersion } from '../../../utils/formatters'
import spinner from '../../../svgs/chasing-tail-spinner'
import { s3 } from '../../../utils/path'
import { getAllLiveObjects } from '../../../utils/liveObjects'
import { pendingSeeds } from '../../../utils/pendingSeeds'
import { CSSTransition } from 'react-transition-group'

const className = 'new-live-column-panel'
const pcn = getPCN(className)
const panelScrollHeader = 'panelScrollHeader'

const status = {
    DEFAULT: 'default',
    SAVING: 'saving',
}

export const referrers = {
    ADD_LIVE_DATA: 'addLiveData',
    NEW_LIVE_COLUMN: 'newLiveColumn',
    NEW_LIVE_TABLE: 'newLiveTable',
}
const timing = {
    PANEL_DURATION: 125,
}

const getHeaderTitle = (index, referrer) => {
    switch (index) {
        case 0:
            return 'Choose a live data source'
        case 1:
            return {
                [referrers.ADD_LIVE_DATA]: 'Create Live Columns',
                [referrers.NEW_LIVE_COLUMN]: 'New Live Columns',
                [referrers.NEW_LIVE_TABLE]: 'New Live Table',
            }[referrer] || ''
    }
}

function NewLiveColumnPanel(props, ref) {
    // Props.
    const {
        table = {},
        schema,
        config = {},
        referrer = referrers.ADD_LIVE_DATA,
        onCancel = noop,
        onSave = noop,
        addTransform = noop,
        addHook = noop,
        refetchTables = noop,
        editColumn = noop,
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
    const watchForTable = useRef()
    const saveLiveColumnsPayload = useRef()
    const migrationTimer = useRef(null)
    const migrationCallback = useRef()
    const saveCalled = useRef(false)
    const section0Ref = useRef(null)
    const section1Ref = useRef(null)

    // Transitions.
    const transitions = useTransition(state.index, {
        initial: { opacity: 1 },
        from: { opacity: 0 },
        enter: { opacity: 1 },
        leave: { opacity: 0 },
        config: { tension: 500, friction: 34 },
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
        if (!payload || (!payload.newTable && !payload.newColumns?.length && !Object.keys(payload.liveColumns).length)) {
            return
        }

        const tablePath = payload.newTable?.name 
            ? [schema, payload.newTable.name].join('.') 
            : [schema, table.name].join('.')

        payload = {
            ...payload,
            tablePath,
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

    const saveLiveColumns = useCallback(async (payload) => {
        const {
            tablePath, 
            liveObjectVersionId, 
            liveColumns,
            filters, 
            uniqueBy = [],
        } = (payload || state.payload)

        const ub = []
        for (const colName in liveColumns) {
            const property = liveColumns[colName].property
            if (uniqueBy.includes(property)) {
                ub.push(property)
            }
        }

        const { ok } = await api.meta.liveColumns({
            tablePath, 
            liveObjectVersionId,
            liveColumns,
            filters,
            uniqueBy: ub,
        })

        if (!ok) {
            // TODO: Show error
            saveCalled.current = false
            setState(prevState => ({ ...prevState, status: status.DEFAULT }))
            return
        }

        setTimeout(onSave, 50)
    }, [state.payload, onSave])

    const createNewTable = useCallback(async () => {
        const { 
            newTable, 
            newColumns, 
            tablePath, 
            liveObjectVersionId, 
            liveColumns,
            filters,
            uniqueBy = [],
        } = state.payload

        migrationTimer.current = setTimeout(() => {
            migrationCallback.current && migrationCallback.current()
            migrationTimer.current = null
        }, 700)

        const ub = []
        for (const colName in liveColumns) {
            if (uniqueBy.includes(liveColumns[colName].property)) {
                ub.push(colName)
            }
        }

        const { ok } = await api.meta.createTable({
            schema,
            name: newTable.name,
            desc: newTable.desc,
            columns: newColumns || [],
            uniqueBy: [ub],
        })

        if (!ok) {
            clearTimeout(migrationTimer.current)
            saveCalled.current = false
            setState(prevState => ({ ...prevState, status: status.DEFAULT }))
            return
        }
        
        watchForTable.current = {
            schema: schema,
            name: newTable.name,
        }

        saveLiveColumnsPayload.current = {
            tablePath,
            liveObjectVersionId, 
            liveColumns,
            filters,
            uniqueBy,
        }

        pendingSeeds.add(tablePath)

        if (migrationTimer.current !== null) {
            migrationCallback.current = () => refetchTables(watchForTable.current)
        } else {
            refetchTables(watchForTable.current)
        }
    }, [schema, state.payload, refetchTables])

    const createNewColumns = useCallback(async () => {
        const {
            newColumns, 
            tablePath, 
            liveObjectVersionId, 
            liveColumns,
            filters,
            uniqueBy,
        } = state.payload

        migrationTimer.current = setTimeout(() => {
            migrationCallback.current && migrationCallback.current()
            migrationTimer.current = null
        }, 700)

        const { ok } = await api.meta.addColumns({
            schema,
            table: table.name,
            columns: newColumns || [],
        })

        if (!ok) {
            clearTimeout(migrationTimer.current)
            saveCalled.current = false
            setState(prevState => ({ ...prevState, status: status.DEFAULT }))
            return
        }
        
        watchForTable.current = {
            schema: schema,
            name: table.name,
        }

        saveLiveColumnsPayload.current = {
            tablePath,
            liveObjectVersionId, 
            liveColumns,
            filters,
            uniqueBy,
        }

        pendingSeeds.add(tablePath)

        if (migrationTimer.current !== null) {
            migrationCallback.current = () => refetchTables()
        } else {
            refetchTables()
        }
    }, [schema, table, state.payload, refetchTables])

    useEffect(() => {
        if (state.status === status.SAVING && !!state.payload && !saveCalled.current) {
            saveCalled.current = true

            if (state.payload.newTable) {
                createNewTable()
            } else if (state.payload.newColumns?.length) {
                createNewColumns()
            } else {
                saveLiveColumns()
            }
        }
    }, [state.status, state.payload, createNewTable, createNewColumns, saveLiveColumns])

    useEffect(() => {
        if (!watchForTable.current || !table?.name) return

        if (schema === watchForTable.current.schema && table.name === watchForTable.current.name) {
            if (saveLiveColumnsPayload.current) {
                const payload = { ...saveLiveColumnsPayload.current }
                saveLiveColumns(payload)
            } else {
                onSave()
            }
            watchForTable.current = null
            saveLiveColumnsPayload.current = null
        }
    })

    const renderHeader = useCallback(() => {
        let displayName = state.liveObject.displayName
        if (state.liveObject.isContractEvent) {
            displayName = `${displayName} Events`
        }
        return (
            <div className={pcn('__header')}>
                <div className={pcn('__header-liner')}>
                    <div
                        className={pcn('__header-title-container', `__header-title-container--${state.index}`)}
                        key={state.index}
                        id={panelScrollHeader}>
                        <div className={pcn('__header-title')}>
                            <span>{getHeaderTitle(state.index, referrer)}</span>
                        </div>
                        { state.index === 1 && state.liveObject && (
                            <div className={pcn('__spec-header')}>
                                <img src={state.liveObject.icon} alt="" />
                                <span>{displayName}</span>
                            </div>
                        )}
                    </div>
                    <div className={pcn('__header-bc', `__header-bc--${state.index}`)}>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        )
    }, [state.liveObject, state.index, referrer])

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
                    onClick={state.status === status.DEFAULT ? onClickApply : noop}>
                    { state.status === status.SAVING
                        ? <span className='svg-spinner svg-spinner--chasing-tail' dangerouslySetInnerHTML={{ __html: spinner }}></span>
                        : <span>{ referrer === referrers.ADD_LIVE_DATA ? 'Apply' : 'Create' }</span>
                    }
                </button>
            </div>
        </div>
    ), [onClickCancel, onClickApply, state.index, onClickBack, state.status, referrer])

    return (
        <div className={className}>
            { renderHeader() }
            <CSSTransition
                nodeRef={section0Ref}
                in={!state.index}
                timeout={timing.PANEL_DURATION}
                unmountOnExit={true}
                classNames={pcn('__section')}>
                <div className={pcn('__section', '__section--0')} ref={section0Ref}>
                    <LiveObjectSearch
                        liveObjects={liveObjects}
                        onSelectLiveObject={onSelectLiveObject}
                        ref={liveObjectSearchRef}
                    />
                </div>
            </CSSTransition>
            <CSSTransition
                nodeRef={section1Ref}
                in={!!state.index}
                timeout={timing.PANEL_DURATION}
                unmountOnExit={true}
                classNames={pcn('__section')}>
                <div className={pcn('__section', '__section--1')} ref={section1Ref}>
                    <NewLiveColumnSpecs
                        table={table}
                        schema={schema}
                        config={config}
                        purpose={referrer}
                        liveObject={state.liveObject}
                        addTransform={addTransform}
                        addHook={addHook}
                        editColumn={editColumn}
                        ref={newLiveColumnSpecsRef}
                    />
                </div>
            </CSSTransition>
            { renderFooter() }
        </div>
    )
}

NewLiveColumnPanel = forwardRef(NewLiveColumnPanel)
export default NewLiveColumnPanel