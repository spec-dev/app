import React, { useCallback, useState, useRef, useEffect } from 'react'
import { cn, getPCN } from '../../utils/classes'
import $ from 'jquery'
import searchIcon from '../../svgs/search'
import caretIcon from '../../svgs/caret-down'
import LiveObjectSearchResult from '../shared/panels/LiveObjectSearchResult'
import { paths } from '../../utils/nav'
import { keyCodes } from '../../utils/keyboard'
import hEllipsisIcon from '../../svgs/h-ellipsis'
import { useHistory } from 'react-router-dom'

const className = 'live-objects-ecosystem'
const pcn = getPCN(className)

const results = [
    {
        id: 'Listing',
        name: 'Thirdweb Marketplace Listing',
        icon: 'thirdweb.jpg',
        desc: 'Represents a listing in a thirdweb marketplace contract.',
        likes: '1',
        author: '@thirdweb'
    },
]

function LiveObjectsEcosystem(props) {
    let history = useHistory()
    const lastKeyCode = useRef(null)
    const searchInputRef = useRef()
    const [searchResults, setSearchResults] = useState([])
    const didFocus = useRef(false)

    const onSelectLiveObject = () => {
        history.push(paths.toLiveObjects('thirdweb-marketplace-listing'))
    }

    const renderResults = useCallback(() => searchResults.map((result, i) => (
        <LiveObjectSearchResult key={i} {...result} onClick={() => onSelectLiveObject(result)}/>
    )), [searchResults, onSelectLiveObject])

    const onTypeQuery = useCallback((e) => {
        const value = e.currentTarget.value.toLowerCase()
        const matchingResults = results.filter(r => r.name.toLowerCase().includes(value))
        setSearchResults(value ? matchingResults : [])
    }, [])

    const onKeyDown = useCallback(e => {
        lastKeyCode.current = e.which
    }, [])

    const onKeyUp = e => {
        switch (lastKeyCode.current) {
        case keyCodes.ENTER:
            onSelectLiveObject(searchResults[0])
            break
        default:
            break
        }
    }
    
    useEffect(() => {
        if (!didFocus.current) {
            didFocus.current = true
            setTimeout(() => {
                searchInputRef.current && $(searchInputRef.current).focus()
            }, 300)
        }
    }, [])

    const renderSearch = useCallback(() => (
        <div className={pcn('__search-container')}>
            <div className={pcn('__search')}>
                <div className={pcn('__search-liner')}>
                    <span dangerouslySetInnerHTML={{ __html: searchIcon }}></span>
                    <input
                        type='text'
                        placeholder='Search live objects...'
                        onChange={onTypeQuery}
                        onKeyUp={onKeyUp}
                        onKeyDown={onKeyDown}
                        ref={searchInputRef}
                    />
                    <div className={pcn('__sort-by')}>
                        <span>Most Popular</span>
                        <span dangerouslySetInnerHTML={{ __html: caretIcon }}></span>
                    </div>
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
                        <span>Prices</span>
                        <div
                            className={pcn('__more-categories-button')}
                            dangerouslySetInnerHTML={{ __html: hEllipsisIcon }}>
                        </div>
                    </div>
                </div>
            </div>
            <div className={pcn('__results')}>
                <div className={pcn('__results-liner')}>
                    { renderResults() }
                </div>
            </div>
        </div>
    ), [renderResults])

    return (
        <div className={cn(className, searchResults.length > 0 ? `${className}--show-results` : '')}>
            { renderSearch() }
            <img src="/ecosystem.svg"/>
            <span></span>
        </div>
    )
}

export default LiveObjectsEcosystem