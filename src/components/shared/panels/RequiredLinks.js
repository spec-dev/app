import React, { useCallback, useState, useMemo } from 'react'
import { getPCN } from '../../../utils/classes'
import SelectInput from '../../shared/inputs/SelectInput'
import gearIcon from '../../../svgs/gear-thin'
import linkIcon from '../../../svgs/link'
import triangleIcon from '../../../svgs/triangle'
import codeCaretsIcon from '../../../svgs/code-carets'

const className = 'required-links'
const pcn = getPCN(className)

const getTableColOptions = liveObjectSpec => {
    let values = []
    if (liveObjectSpec.typeDef.name === 'ENSProfile') {
        values = [
            'wallets.id',
            'wallets.user_id',
            'wallets.address',
            'users.id',
        ]
    } else if (liveObjectSpec.typeDef.name === 'NFT') {
        values = [
            'nfts.id',
            'nfts.wallet_id',
            'nfts.collection',
            'nfts.contract',
            'nfts.token_id',
            'nfts.name',
            'nfts.description',
            'nfts.image',
            'nfts.attributes',
            'wallets.id',
            'wallets.user_id',
            'wallets.address',
            'wallets.domain',
            'wallets.avatar',
            'users.id',
        ]
    } else if (liveObjectSpec.typeDef.name === 'AaveUserPosition') {
        values = [
            'nfts.id',
            'nfts.wallet_id',
            'nfts.collection',
            'nfts.contract',
            'nfts.token_id',
            'nfts.name',
            'nfts.description',
            'nfts.image',
            'nfts.attributes',
            'wallet_aave_positions.id',
            'wallet_aave_positions.wallet_id',
            'wallet_aave_positions.asset',
            'wallet_aave_positions.deposited',
            'wallet_aave_positions.stable_debt',
            'wallet_aave_positions.variable_debt',
            'wallet_aave_positions.updated_at',
            'wallets.id',
            'wallets.user_id',
            'wallets.address',
            'wallets.domain',
            'wallets.avatar',
            'users.id',
        ]
    } else if (liveObjectSpec.typeDef.name === 'Listing') {
        values = [
            'marketplaces.id',
            'marketplaces.address',
            'marketplaces.created_at',
            'marketplace_permissions.id',
            'marketplace_permissions.wallet_id',
            'marketplace_permissions.marketplace_id',
            'marketplace_permissions.role',
            'marketplace_listings.id',
            'marketplace_listings.uid',
            'marketplace_listings.marketplace_id',
            'marketplace_listings.listing_id',
            'marketplace_listings.listing_type',
            'marketplace_listings.asset_contract',
            'marketplace_listings.token_owner',
            'marketplace_listings.token_id',
            'marketplace_listings.token_type',
            'marketplace_listings.start_time',
            'marketplace_listings.end_time',
            'marketplace_listings.quantity',
            'marketplace_listings.currency',
            'marketplace_listings.reserve_price_per_token',
            'marketplace_listings.buyout_price_per_token',
            'marketplace_listings.was_removed',
            'marketplace_listings.updated_at',
            'marketplace_listings.created_at',
            'wallets.id',
            'wallets.user_id',
            'wallets.address',
            'users.id',
            'users.uid',
            'users.created_at',
        ]
    } else if (['NFTAsset', 'NFTSale', 'NFTCollection', 'CompoundMarketAPY'].includes(liveObjectSpec.typeDef.name)) {
        values = [
            'compound_markets.id',
            'compound_markets.name',
            'compound_markets.address',
            'compound_markets.supply_apy',
            'compound_markets.borrow_apy',
            'marketplaces.id',
            'marketplaces.name',
            'marketplaces.collection_id',
            'marketplaces.created_at',
            'assets.id',
            'assets.collection_id',
            'assets.token_id',
            'assets.owner_address',
            'assets.erc_standard',
            'collections.id',
            'collections.name',
            'collections.contract_address',
            'collections.created_at',
            'nft_sales.id',
            'nft_sales.asset_id',
            'nft_sales.from',
            'nft_sales.to',
            'nft_sales.sale_price_eth',
            'nft_sales.sale_price_usd',
            'nft_sales.datetime',
        ]
    }

    return values.map(v => ({ value: v, label: v }))
}

const getTableColValues = liveObjectSpec => {
    if (liveObjectSpec.typeDef.name === 'ENSProfile') {
        return []
    }
    if (liveObjectSpec.typeDef.name === 'NFT') {
        return [
            null,
            'nfts.contract',
            'nfts.token_id',
        ]
    }
    if (liveObjectSpec.typeDef.name === 'AaveUserPosition') {
        return [
            null,
            'wallet_aave_positions.asset',
        ]
    }
    if (liveObjectSpec.typeDef.name === 'Listing') {
        return [
            null,
            'marketplace_listings.listing_id',
        ]
    }
    if (liveObjectSpec.typeDef.name === 'NFTAsset') {
        return [
            null,
            'assets.token_id',
        ]
    }
    if (liveObjectSpec.typeDef.name === 'CompoundMarketAPY') {
        return [
            'compound_markets.name',
        ]
    }
    return []
}

function RequiredLinks(props) {
    const { properties = [], liveObjectSpec = {} } = props
    const tableColOptions = useMemo(() => getTableColOptions(liveObjectSpec), [liveObjectSpec])
    const [values, setValues] = useState(getTableColValues(liveObjectSpec))

    const updateValueAtIndex = useCallback((value, index) => {
        const newValues = []
        for (let i = 0; i < properties.length; i++) {
            newValues.push(i === index ? value : values[i])
        }
        setValues(newValues)
    }, [properties, values])

    const renderLinks = useCallback(() => properties.map((p, i) => (
        <div key={i} className={pcn('__link', values[i] ? '__link--linked' : '')}>
            <div className={pcn('__link-root')}>
                <span>.</span>
                <span>{p.name}</span>
            </div>
            <div className={pcn('__link-arrow')}>
                <span></span>
                <span dangerouslySetInnerHTML={{ __html: linkIcon }}></span>
            </div>
            <SelectInput
                className={pcn('__link-field')}
                classNamePrefix='spec'
                value={values[i]}
                options={tableColOptions}
                placeholder='Select column'
                isRequired={true}
                updateFromAbove={true}
                onChange={value => updateValueAtIndex(value, i)}
            />
            <div
                className={pcn('__link-icon-button', '__link-icon-button--settings')}
                onClick={() => {}}
                dangerouslySetInnerHTML={{ __html: gearIcon }}>
            </div>
            <div
                className={pcn('__link-icon-button', '__link-icon-button--function')}
                onClick={() => {}}
                dangerouslySetInnerHTML={{ __html: codeCaretsIcon }}>
            </div>
        </div>
    )), [properties, values, liveObjectSpec, updateValueAtIndex])

    return (
        <div className={className}>
            <div className={pcn('__header')}>
                <span>Data Source ({liveObjectSpec?.typeDef.name})</span>
                <span>Column Name</span>
            </div>
            { renderLinks() }
        </div>
    )
}

export default RequiredLinks