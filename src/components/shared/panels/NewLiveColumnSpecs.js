import React, { useMemo, useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { getPCN, cn } from '../../../utils/classes'
import { noop } from '../../../utils/nodash'
import EditableLiveColumns from './EditableLiveColumns'
import RequiredLinks from './RequiredLinks'
import caretDownIcon from '../../../svgs/caret-down'
import shuffleIcon from '../../../svgs/shuffle'
import linkIcon from '../../../svgs/link'
import invokeIcon from '../../../svgs/invoke'

const className = 'new-live-column-specs'
const pcn = getPCN(className)

const docsHeaderTabs = [
    {
        id: 'def',
        name: 'Type Definition',
    },
    {
        id: 'example',
        name: 'Example',
    },
]

const getDefaultNewLiveCols = liveObjectSpec => {
    if (liveObjectSpec.name === 'NFTAsset') {
        return [
            {
                columnName: 'token_id',
                dataSource: 'tokenId',
            },
            {
                columnName: 'owner_address',
                dataSource: 'ownerAddress',
            },
            {
                columnName: 'erc_standard',
                dataSource: null,
            },
        ]
    }
    if (liveObjectSpec.name === 'NFTSale') {
        return [
            {
                columnName: 'seller',
                dataSource: 'seller',
            },
            {
                columnName: 'buyer',
                dataSource: 'buyer',
            },
            {
                columnName: 'price_eth',
                dataSource: 'priceETH',
            },
            {
                columnName: 'price_usd',
                dataSource: 'priceUSD',
            },
            {
                columnName: 'datetime',
                dataSource: 'datetime',
            },
        ]
    }
    if (liveObjectSpec.name === 'Listing') {
        return [
            {
                columnName: 'marketplace_id',
                dataSource: null,
            },
            {
                columnName: 'listing_id',
                dataSource: 'listingId',
            },
            {
                columnName: 'listing_type',
                dataSource: 'listingType',
            },
            {
                columnName: 'asset_contract',
                dataSource: 'assetContract',
            },
            {
                columnName: 'token_owner',
                dataSource: 'tokenOwner',
            },
            {
                columnName: 'token_id',
                dataSource: 'tokenId',
            },
            {
                columnName: 'token_type',
                dataSource: 'tokenType',
            },
            {
                columnName: 'start_time',
                dataSource: 'startTime',
            },
            {
                columnName: 'end_time',
                dataSource: 'endTime',
            },
            {
                columnName: 'currency',
                dataSource: 'currency',
            },
            {
                columnName: 'reserve_price_per_token',
                dataSource: 'reservePricePerToken',
            },
            {
                columnName: 'buyout_price_per_token',
                dataSource: 'buyoutPricePerToken',
            },
            {
                columnName: 'was_removed',
                dataSource: null,
            },
            {
                columnName: 'updated_at',
                dataSource: null,
            },
            {
                columnName: 'created_at',
                dataSource: null,
            },
        ]
    }
    if (liveObjectSpec.name === 'CompoundMarketAPY') {
        return [
            {
                columnName: 'name',
                dataSource: 'name',
            },
            {
                columnName: 'address',
                dataSource: null,
            },
            {
                columnName: 'supply_apy',
                dataSource: 'supplyAPY',
            },
            {
                columnName: 'borrow_apy',
                dataSource: 'borrowAPY',
            },
        ]
    }
    return [{}]
}

function NewLiveColumnSpecs(props, ref) {
    const { liveObjectSpec = {}, selectLiveColumnFormatter = noop, addTransform = noop, addHook = noop } = props
    const [docsExpanded, setDocsExpanded] = useState(false)
    const name = useMemo(() => liveObjectSpec.name, [liveObjectSpec])
    const typeDef = useMemo(() => liveObjectSpec.typeDef, [liveObjectSpec])
    const requiredLinks = useMemo(() => typeDef?.properties?.filter(p => !!p.linkRequired), [typeDef])
    const [selectedDocsIndex, setSelectedDocsIndex] = useState(0)
    const editableLiveColumnsRef = useRef()

    useImperativeHandle(ref, () => ({
        serialize: () => editableLiveColumnsRef.current?.serialize() || {},
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
            <div className={pcn('__type-overview', `__type-overview--${typeDef.name}`)}>
                <div className={pcn('__type-overview-liner', docsExpanded ? '__type-overview-liner--expanded' : '')}>
                    <div className={pcn('__docs')}>
                        <div className={pcn('__doc-object-name')}>
                            <span>{ typeDef.name }</span><span>&mdash;</span><span>Live Object</span>
                        </div>
                        <div className={pcn('__doc-properties')}>
                            { renderProperties() }
                        </div>
                    </div>
                    <div className={cn('editor', pcn('__interface'))}>
                        <div className={pcn(
                            '__interface-header', 
                            `__interface-header--index-${selectedDocsIndex}`,
                            `__interface-header--${docsHeaderTabs[selectedDocsIndex].name?.toLowerCase()?.replaceAll(' ', '-')}`,  
                        )}>
                            <div className={pcn('__interface-header-slider')}></div>
                            { docsHeaderTabs.map((tab, i) => (
                                <div
                                    key={i}
                                    className={pcn(
                                        '__interface-header-tab', 
                                        i === selectedDocsIndex ? '__interface-header-tab--selected' : '',
                                    )}
                                    onClick={i === selectedDocsIndex ? noop : () => setSelectedDocsIndex(i)}>
                                    <span>{tab.name}</span>
                                </div>
                            ))}
                        </div>
                        <div
                            className={pcn('__interface-body', `__interface-body--${typeDef.name}`, `__interface-body--index-${selectedDocsIndex}`)}
                            dangerouslySetInnerHTML={{ __html: selectedDocsIndex === 1 ? typeDef.exampleData : typeDef.code }}>
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
            <div className={pcn('__transform')}>
                <div className={pcn('__transform-section-title')}>
                    <span dangerouslySetInnerHTML={{ __html: shuffleIcon }}></span>
                    <span>Personalize The Object</span>
                </div>
                <div className={pcn('__transform-section-subtitle')}>
                    Transform {typeDef.name} into the exact format and structure you need.
                </div>
                <div className={pcn('__transform-body')}>
                    <div className={pcn('__action-buttons', '__action-buttons--transform')}>
                        <button onClick={() => addTransform(liveObjectSpec)}>
                            <span>+</span>
                            <span>Add Transform</span>
                        </button>
                    </div>
                </div>
            </div>
            <div className={pcn('__cols')}>
                <div className={pcn('__cols-section-title', '__cols-section-title--pad-left')}>
                    <span className='blink-indicator'><span></span></span>
                    Create Live Columns
                </div>
                <div className={pcn('__transform-section-subtitle')}>
                    Stream {typeDef.name} properties directly into your columns.
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
                        <span dangerouslySetInnerHTML={{ __html: linkIcon }}></span>
                        <span>Link Required Fields</span>
                    </div>
                    <div className={pcn('__rel-section-subtitle')}>
                        Link the unique fields of { typeDef.name } to their respective columns in your database.
                    </div>
                    <div className={pcn('__rel-inputs')}>
                        <RequiredLinks
                            liveObjectSpec={liveObjectSpec}
                            properties={requiredLinks}
                        />
                    </div>
                </div>
            }
            <div className={pcn('__transform')}>
                <div className={pcn('__hooks-section-title')}>
                    <span dangerouslySetInnerHTML={{ __html: invokeIcon }}></span>
                    <span>Hooks</span>
                </div>
                <div className={pcn('__transform-section-subtitle')}>
                    Run custom functions before or after INSERT, UPDATE, and DELETE operations.
                </div>
                <div className={pcn('__transform-body')}>
                    <div className={pcn('__action-buttons', '__action-buttons--transform')}>
                        <button onClick={() => addHook(liveObjectSpec)}>
                            <span>+</span>
                            <span>Add Hook</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

NewLiveColumnSpecs = forwardRef(NewLiveColumnSpecs)
export default NewLiveColumnSpecs