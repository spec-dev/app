import React, { useMemo, useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { getPCN, cn } from '../../../utils/classes'
import { noop } from '../../../utils/nodash'
import { withIndefiniteArticle } from '../../../utils/formatters'
import EditableLiveColumns from './EditableLiveColumns'
import RequiredLinks from './RequiredLinks'
import caretDownIcon from '../../../svgs/caret-down'
import shuffleIcon from '../../../svgs/shuffle'

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
    return [{}]
}

function NewLiveColumnBehavior(props, ref) {
    const { liveObjectSpec = {}, selectLiveColumnFormatter = noop, addTransform = noop } = props
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

NewLiveColumnBehavior = forwardRef(NewLiveColumnBehavior)
export default NewLiveColumnBehavior