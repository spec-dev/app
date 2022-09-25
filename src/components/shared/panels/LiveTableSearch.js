import React, { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { getPCN } from '../../../utils/classes'
import $ from 'jquery'
import searchIcon from '../../../svgs/search'
import caretIcon from '../../../svgs/caret-down'
import LiveObjectSearchResult from './LiveObjectSearchResult'
import { noop } from '../../../utils/nodash'
import { keyCodes } from '../../../utils/keyboard'
import hEllipsisIcon from '../../../svgs/h-ellipsis'

const className = 'live-table-search'
const pcn = getPCN(className)

const results = [
    {
        id: 'WalletNFTs',
        name: 'Wallet NFTs',
        icon: 'get-nft-sales-history.jpg',
        desc: 'NFTs owned by wallet',
        likes: '5.1k',
        author: '@spec'
    },
    {
        id: 'WalletERC20s',
        name: 'Wallet ERC-20s',
        icon: 'ethereum.jpg',
        desc: 'ERC-20 tokens owned by wallet',
        likes: '4.2k',
        author: '@spec'
    },
    {
        id: 'UniswapTradingPairs',
        name: 'Uniswap Trading Pairs',
        icon: 'uniswap.jpg',
        desc: 'Current data for all Uniswap V3 trading pairs',
        likes: '2.4k',
        author: '@paul'
    },
    {
        id: 'CurvePoolBalances',
        name: 'Curve Pool Balances',
        icon: 'curve.jpg',
        desc: 'Current balances for all Curve token pools',
        likes: '2.0k',
        author: '@curve.fi'
    },
    {
        id: 'MakerDAOVoters',
        name: 'MakerDAO Voters',
        icon: 'makerdao.jpg',
        desc: 'Wallets that have voted on a MakerDAO poll',
        likes: '1.2k',
        author: '@makerdao'
    },
    {
        id: 'AaveUserPositions',
        name: 'Aave User Positions',
        icon: 'aave.jpg',
        desc: 'Current user asset positions on Aave.',
        likes: '1.4k',
        author: '@aave'
    },
]

function LiveTableSearch(props, ref) {
    const { onSelectLiveTable = noop } = props
    const lastKeyCode = useRef(null)
    const searchInputRef = useRef()
    const [searchResults, setSearchResults] = useState(results)

    useImperativeHandle(ref, () => ({
        focusSearchBar: () => {
            searchInputRef.current && $(searchInputRef.current).focus()
        },
    }))

    const renderResults = useCallback(() => searchResults.map((result, i) => (
        <LiveObjectSearchResult key={i} {...result} onClick={() => onSelectLiveTable(result)}/>
    )), [searchResults, onSelectLiveTable])

    const onTypeQuery = useCallback((e) => {
        const value = e.currentTarget.value.toLowerCase()
        const matchingResults = results.filter(r => r.name.toLowerCase().includes(value))
        setSearchResults(matchingResults)
    }, [])

    const onKeyDown = useCallback(e => {
        lastKeyCode.current = e.which
    }, [])

    const onKeyUp = e => {
        switch (lastKeyCode.current) {
        case keyCodes.ENTER:
            onSelectLiveTable(searchResults[0])
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
                        spellCheck={false}
                        placeholder='Search Live Table specs...'
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

LiveTableSearch = forwardRef(LiveTableSearch)
export default LiveTableSearch