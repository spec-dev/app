import React, { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { getPCN } from '../../../utils/classes'
import $ from 'jquery'
import searchIcon from '../../../svgs/search'
import caretIcon from '../../../svgs/caret-down'
import LiveObjectSearchResult from './LiveObjectSearchResult'
import { noop } from '../../../utils/nodash'
import { keyCodes } from '../../../utils/keyboard'
import hEllipsisIcon from '../../../svgs/h-ellipsis'

const className = 'live-object-search'
const pcn = getPCN(className)

const results = [
    {
        id: 'NFTCollection',
        name: 'NFT Collections',
        icon: 'user-nfts.jpg',
        desc: 'ERC-721 or ERC-1155 collection contracts.',
        likes: '204',
        author: '@spec'
    },
    {
        id: 'NFTAsset',
        name: 'NFT Assets',
        icon: 'cool-cat.jpg',
        desc: 'The NFT assets within a collection.',
        likes: '1.2k',
        author: '@spec'
    },
    {
        id: 'NFTSale',
        name: 'NFT Sales',
        icon: 'get-nft-sales-history.jpg',
        desc: 'The sales history of an NFT asset.',
        likes: '1.0k',
        author: '@spec'
    },
    {
        id: 'CompoundMarketAPY',
        name: 'Compound Market APYs',
        icon: 'compound.jpg',
        desc: 'Supply and borrow APYs for markets on Compound.',
        likes: '302',
        author: '@spec'
    },
    {
        id: 'ENSProfile',
        name: 'ENS Profiles',
        icon: 'ens.jpg',
        desc: 'Profile data for ENS domains.',
        likes: '20',
        author: '@spec'
    },
    // {
    //     id: 'CompoundMarket',
    //     name: 'Compound Market',
    //     icon: 'compound.jpg',
    //     desc: 'A snapshot summary of a Compound market.',
    //     likes: '10',
    //     author: '@j1mmie'
    // },
    // {
    //     id: 'UniswapPoolTVL',
    //     name: 'Uniswap Pool TVL',
    //     icon: 'uniswap.jpg',
    //     desc: 'Uniswap V3 pool TVL & daily volume.',
    //     likes: '10',
    //     author: '@ben'
    // },
    // {
    //     id: 'NFT',
    //     name: 'NFT Sales Price',
    //     icon: 'user-nfts.jpg',
    //     desc: 'The latest sales price for an NFT.',
    //     likes: '8',
    //     author: '@0xmerkle'
    // },
    // {
    //     id: 'YieldPosition',
    //     name: 'Balancer Yield Position',
    //     icon: 'balancer.jpg',
    //     desc: 'A user\'s current yield on the Balancer protocol.',
    //     likes: '5',
    //     author: '@balancer'
    // },
    // {
    //     id: 'Listing',
    //     name: 'Thirdweb Marketplace Listing',
    //     icon: 'thirdweb.jpg',
    //     desc: 'Represents a listing in a thirdweb marketplace contract.',
    //     likes: '0',
    //     author: '@thirdweb'
    // },
]

function LiveObjectSearch(props, ref) {
    const { liveObjects = [], onSelectLiveObject = noop } = props
    const lastKeyCode = useRef(null)
    const searchInputRef = useRef()
    const [searchResults, setSearchResults] = useState(liveObjects)

    useImperativeHandle(ref, () => ({
        focusSearchBar: () => {
            searchInputRef.current && $(searchInputRef.current).focus()
        },
    }))

    const renderResults = useCallback(() => searchResults.map((result, i) => (
        <LiveObjectSearchResult key={i} {...result} onClick={() => onSelectLiveObject(result)}/>
    )), [searchResults, onSelectLiveObject])

    const onTypeQuery = useCallback((e) => {
        const value = e.currentTarget.value.toLowerCase()
        const matchingResults = liveObjects.filter(liveObject => liveObject.name.toLowerCase().includes(value))
        setSearchResults(matchingResults)
    }, [])

    const onKeyDown = useCallback(e => {
        lastKeyCode.current = e.which
    }, [])

    const onKeyUp = e => {
        switch (lastKeyCode.current) {
        case keyCodes.ENTER:
            searchResults.length && onSelectLiveObject(searchResults[0])
            break
        default:
            break
        }
    }

    return (
        <div className={className}>
            <div className={pcn('__search')}>
                <div className={pcn('__search-liner')}>
                    <span dangerouslySetInnerHTML={{ __html: searchIcon }}></span>
                    <input
                        type='text'
                        placeholder='What data do you need?'
                        onChange={onTypeQuery}
                        onKeyUp={onKeyUp}
                        onKeyDown={onKeyDown}
                        ref={searchInputRef}
                    />
                </div>
            </div>
            <div className={pcn('__filters')}>
                <div className={pcn('__filters-liner')}>
                    <div className={pcn('__categories')}>
                        <span>All</span>
                        <span>Identity</span>
                        <span>NFT</span>
                        <span>DeFi</span>
                        <span>DAO</span>
                        <div
                            className={pcn('__more-categories-button')}
                            dangerouslySetInnerHTML={{ __html: hEllipsisIcon }}>
                        </div>
                    </div>
                    <div className={pcn('__sort-by')}>
                        <span>Most Popular</span>
                        <span dangerouslySetInnerHTML={{ __html: caretIcon }}></span>
                    </div>
                </div>
            </div>
            <div className={pcn('__results')}>
                <div className={pcn('__results-liner')}>
                    { renderResults() }
                </div>
            </div>
        </div>
    )
}

LiveObjectSearch = forwardRef(LiveObjectSearch)
export default LiveObjectSearch