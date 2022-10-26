import React, { useMemo, useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { getPCN, cn } from '../../../utils/classes'
import { noop } from '../../../utils/nodash'
import EditableLiveColumns from './EditableLiveColumns'
import RequiredLinks from './RequiredLinks'
import { caretDownIcon } from '../../../svgs/icons'
import hljs from 'highlight.js/lib/core'
import typescript from 'highlight.js/lib/languages/typescript'
hljs.registerLanguage('typescript', typescript)

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

const docsHeight = {
    COLLAPSED: 390,
    EXPANDED_OFFSET: 50,
}

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

const buildInterfaceCode = liveObjectVersion => {
    const { name, properties = [] } = (liveObjectVersion || {})
    if (!name) return ''

    const openingLine = `interface ${name} {`
    const propertyLines = properties.map(p => `    ${p.name}: ${p.type}`)
    const closingLine = '}'
    const lines = [openingLine, ...propertyLines, closingLine].join('\n')

    return hljs.highlight(lines, { language: 'typescript' }).value
}

const buildExampleObjectCode = liveObjectVersion => {
    const example = liveObjectVersion?.example
    if (!example) return ''

    return hljs.highlight(
        JSON.stringify(example, null, 4).replace(/"([^"]+)":/g, '$1:'), // remove quotes on keys
        { language: 'typescript' }
    ).value
}

function NewLiveColumnSpecs(props, ref) {
    // Props
    const {
        liveObject = {},
        selectLiveColumnFormatter = noop,
        addTransform = noop,
        addHook = noop,
    } = props

    // State
    const [docsExpanded, setDocsExpanded] = useState(false)
    const [selectedDocsIndex, setSelectedDocsIndex] = useState(0)

    // Refs
    const editableLiveColumnsRef = useRef()
    const expandedDocsHeight = useRef(null)

    // Derived
    const liveObjectVersion = useMemo(() => liveObject?.latestVersion || {}, [liveObject])
    const interfaceCode = useMemo(() => liveObjectVersion ? buildInterfaceCode(liveObjectVersion) : '', [liveObjectVersion])
    const exampleObjectCode = useMemo(() => liveObjectVersion ? buildExampleObjectCode(liveObjectVersion) : '', [liveObjectVersion])

    useImperativeHandle(ref, () => ({
        serialize: () => editableLiveColumnsRef.current?.serialize() || {},
    }))

    const calculateExpandedDocsHeight = useCallback(ref => {
        if (expandedDocsHeight.current || !ref) return
        setTimeout(() => {
            if (ref.offsetHeight) {
                expandedDocsHeight.current = ref.offsetHeight + docsHeight.EXPANDED_OFFSET
            }
        }, 10)
    }, [])

    const renderProperties = useCallback(() => liveObjectVersion.properties.map((p, i) => (
        <div key={i} className={pcn('__doc-property')}>
            <div><span>{p.name}</span><span>{p.type}</span></div>
            <div>{p.desc}</div>
        </div>
    )), [liveObjectVersion])

    const renderDocsSection = useCallback(() => (
        <div className={pcn('__docs')} ref={calculateExpandedDocsHeight}>
            <div className={pcn('__doc-object-name')}>
                <span>{ liveObjectVersion.name }</span><span>&mdash;</span><span>Live Object</span>
            </div>
            <div className={pcn('__doc-properties')}>
                { renderProperties() }
            </div>
        </div>
    ), [liveObjectVersion, renderProperties])

    const renderInterfaceSection = useCallback(() => (
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
                className={pcn(
                    '__interface-body', 
                    `__interface-body--${liveObjectVersion.name}`, 
                    `__interface-body--index-${selectedDocsIndex}`,
                )}>
                <div
                    className='interface'
                    dangerouslySetInnerHTML={{ __html: selectedDocsIndex === 1 ? exampleObjectCode : interfaceCode }}>    
                </div>
            </div>
        </div>
    ), [liveObjectVersion, selectedDocsIndex, interfaceCode, exampleObjectCode])

    const renderTypeOverview = useCallback(() => (
        <div className={pcn('__type-overview', `__type-overview--${liveObjectVersion.name}`)}>
            <div
                style={{ height: docsExpanded && expandedDocsHeight.current 
                    ? expandedDocsHeight.current : docsHeight.COLLAPSED 
                }}
                className={pcn(
                    '__type-overview-liner', 
                    docsExpanded ? '__type-overview-liner--expanded' : '',
                )}>
                { renderDocsSection() }
                { renderInterfaceSection() }
            </div>
            <span
                className={pcn('__expand', docsExpanded ? '__expand--expanded' : '')}
                onClick={() => setDocsExpanded(!docsExpanded)}
                dangerouslySetInnerHTML={{ __html: caretDownIcon }}>
            </span>
        </div>
    ), [liveObjectVersion, docsExpanded, renderDocsSection, renderInterfaceSection])

    if (!liveObjectVersion.name) {
        return <div className={className}></div>
    }

    return (
        <div className={className}>
            { renderTypeOverview() }
            {/* <div className={pcn('__cols')}>
                <div className={pcn('__cols-section-title', '__cols-section-title--pad-left')}>
                    <span className='blink-indicator'><span></span></span>
                    Create Live Columns
                </div>
                <div className={pcn('__transform-section-subtitle')}>
                    Stream {liveObjectVersion.name} properties directly into your columns.
                </div>
                <div className={pcn('__new-cols')}>
                    <EditableLiveColumns
                        liveObject={liveObject}
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
                        Link the unique fields of { liveObjectVersion.name } to their respective columns in your database.
                    </div>
                    <div className={pcn('__rel-inputs')}>
                        <RequiredLinks
                            liveObject={liveObject}
                            properties={requiredLinks}
                        />
                    </div>
                </div>
            } */}
        </div>
    )
}

NewLiveColumnSpecs = forwardRef(NewLiveColumnSpecs)
export default NewLiveColumnSpecs