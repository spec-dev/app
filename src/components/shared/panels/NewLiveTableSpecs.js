import React, { useMemo, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { getPCN, cn } from '../../../utils/classes'
import { noop } from '../../../utils/nodash'
import caretDownIcon from '../../../svgs/caret-down'
import { withIndefiniteArticle } from '../../../utils/formatters'
import NewTableBasicInputs from './NewTableBasicInputs'
import EditableLiveColumns from './EditableLiveColumns'
import EditableStandardColumns from './EditableStandardColumns'
import RequiredLinks from './RequiredLinks'

const className = 'new-live-table-specs'
const pcn = getPCN(className)

const getTableName = table => {
    switch (table.name) {
        case 'nfts':
            return 'wallet_nfts'
        default:
            return table.name
    }
}

const getDefaultNewStandardCols = liveObjectSpec => {
    if (liveObjectSpec.name === 'NFT') {
        return [
            {
                columnName: 'id',
            },
            {
                columnName: 'wallet_id',
            },
        ]
    }

    if (liveObjectSpec.name === 'Aave User Position') {
        return [
            {
                columnName: 'id',
            },
            {
                columnName: 'wallet_id',
            },
            {
                columnName: 'updated_at',
            },
        ]
    }

    return [{}]
}

const getDefaultNewLiveCols = liveObjectSpec => {
    if (liveObjectSpec.name === 'NFT') {
        return [
            {
                columnName: 'contract',
                dataSource: 'contractAddress',
            },
            {
                columnName: 'token_id',
                dataSource: 'tokenId',
            },
            {
                columnName: 'collection',
                dataSource: 'collection',
            },
            {
                columnName: 'token_uri',
                dataSource: 'tokenURI',
            },
            {
                columnName: 'standard',
                dataSource: 'standard',
            },
            {
                columnName: 'chain',
                dataSource: 'chain',
            },
            {
                columnName: 'name',
                dataSource: 'metadata',
                formatter: {
                    type: 'key-val',
                    config: {
                        key: 'name',
                    }
                }
            },
            {
                columnName: 'description',
                dataSource: 'metadata',
                formatter: {
                    type: 'key-val',
                    config: {
                        key: 'description',
                    }
                }
            },
            {
                columnName: 'image',
                dataSource: 'metadata',
                formatter: {
                    type: 'key-val',
                    config: {
                        key: 'image',
                    }
                }
            },
            {
                columnName: 'attributes',
                dataSource: 'metadata',
                formatter: {
                    type: 'key-val',
                    config: {
                        key: 'attributes',
                    }
                }
            },
        ]
    }

    if (liveObjectSpec.name === 'Aave User Position') {
        return [
            {
                columnName: 'asset',
                dataSource: 'asset',
            },
            {
                columnName: 'deposited',
                dataSource: 'deposited',
            },
            {
                columnName: 'stable_debt',
                dataSource: 'stableDebt',
            },
            {
                columnName: 'variable_debt',
                dataSource: 'variableDebt',
            },
        ]
    }

    return [{}]
}

function NewLiveTableSpecs(props, ref) {
    const { table = {}, liveObjectSpec = {}, selectLiveColumnFormatter = noop } = props
    const [docsExpanded, setDocsExpanded] = useState(false)
    const name = useMemo(() => liveObjectSpec.name, [liveObjectSpec])
    const typeDef = useMemo(() => liveObjectSpec.typeDef, [liveObjectSpec])
    const requiredLinks = useMemo(() => typeDef?.properties?.filter(p => !!p.linkRequired), [typeDef])
    const newTableBasicInputsRef = useRef()
    const editableLiveColumnsRef = useRef()

    useImperativeHandle(ref, () => ({
        serialize: () => ({
            // cols: editableLiveColumnsRef.current?.serialize() || {},
        }),
    }))

    const renderProperties = useCallback(() => typeDef.properties.map((p, i) => (
        <div key={i} className={pcn('__doc-property')}>
            <div><span>{p.name}</span><span>{p.type}</span></div>
            <div>{p.desc}</div>
        </div>
    )), [typeDef])

    if (!name || !typeDef) {
        return <div className={className}></div>
    }

    return (
        <div className={className}>
            <NewTableBasicInputs
                values={{ name: getTableName(table), desc: table.desc }}
                ref={newTableBasicInputsRef}
            />
            <div className={pcn('__type-overview')}>
                <div className={pcn('__type-overview-liner', docsExpanded ? '__type-overview-liner--expanded' : '')}>
                    <div className={pcn('__docs')}>
                        <div className={pcn('__doc-object-name')}>
                            <span>The { name } Object</span>
                        </div>
                        <div className={pcn('__doc-properties')}>
                            { renderProperties() }
                        </div>
                    </div>
                    <div className={cn('editor', pcn('__interface'))}>
                        <div className={pcn('__interface-header')}>
                            <span>TS</span><span>Type Definition</span>
                        </div>
                        <div
                            className={pcn('__interface-body')}
                            dangerouslySetInnerHTML={{ __html: typeDef.code }}>
                        </div>
                    </div>
                </div>
                <span
                    className={pcn(
                        '__expand',
                        docsExpanded ? '__expand--expanded' : ''
                    )}
                    onClick={() => setDocsExpanded(!docsExpanded)}
                    dangerouslySetInnerHTML={{ __html: caretDownIcon }}>
                </span>
            </div>
            <div className={pcn('__cols')}>
                <div className={pcn('__cols-section-title')}>
                    Standard Columns
                </div>
                <div className={pcn('__new-cols')}>
                    <EditableStandardColumns
                        newCols={getDefaultNewStandardCols(liveObjectSpec)}
                    />
                </div>
            </div>
            <div className={pcn('__cols')}>
                <div className={pcn('__cols-section-title', '__cols-section-title--pad-left')}>
                    <span className='blink-indicator'><span></span></span>
                    Live Columns
                </div>
                <div className={pcn('__new-cols')}>
                    <EditableLiveColumns
                        liveObjectSpec={liveObjectSpec}
                        selectLiveColumnFormatter={selectLiveColumnFormatter}
                        newCols={getDefaultNewLiveCols(liveObjectSpec)}
                        ref={editableLiveColumnsRef}
                    />
                </div>
            </div>
            { requiredLinks?.length > 0 &&
                <div className={pcn('__rel')}>
                    <div className={pcn('__rel-section-title')}>
                        Connect The Dots
                    </div>
                    <div className={pcn('__rel-section-subtitle')}>
                        How does { withIndefiniteArticle(typeDef.name) } know which records it corresponds to?
                    </div>
                    <div className={pcn('__rel-inputs')}>
                        <RequiredLinks
                            liveObjectSpec={liveObjectSpec}
                            properties={requiredLinks}
                        />
                    </div>
                </div>
            }
        </div>
    )
}

NewLiveTableSpecs = forwardRef(NewLiveTableSpecs)
export default NewLiveTableSpecs