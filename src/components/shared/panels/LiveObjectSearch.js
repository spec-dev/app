import React, { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react'
import { getPCN } from '../../../utils/classes'
import $ from 'jquery'
import searchIcon from '../../../svgs/search'
import caretIcon from '../../../svgs/caret-down'
import LiveObjectSearchResult from './LiveObjectSearchResult'
import { noop } from '../../../utils/nodash'
import { keyCodes } from '../../../utils/keyboard'
import hEllipsisIcon from '../../../svgs/h-ellipsis'
import TutorialAnno from '../tutorial/TutorialAnno'

const className = 'live-object-search'
const pcn = getPCN(className)

function LiveObjectSearch(props, ref) {
    const { liveObjects = [], onSelectLiveObject = noop } = props
    const lastKeyCode = useRef(null)
    const searchInputRef = useRef()
    const [searchResults, setSearchResults] = useState(liveObjects)
    const [showSearchTutorialAnno, setShowSearchTutorialAnno] = useState(false)

    useImperativeHandle(ref, () => ({
        focusSearchBar: () => {
            searchInputRef.current && $(searchInputRef.current).focus()
        },
    }))

    const renderResults = useCallback(() => searchResults.map((result, i) => (
        <LiveObjectSearchResult key={i} {...result} onClick={() => onSelectLiveObject(result)}/>
    )), [searchResults, onSelectLiveObject])

    const onTypeQuery = useCallback((e) => {
        const value = e.currentTarget.value.toLowerCase().trim()

        const matchingResults = liveObjects.filter(liveObject => {
            let name = liveObject.displayName
            if (liveObject.isContractEvent) {
                name += ' Events'
            }
            name = name.toLowerCase()
            const desc = liveObject.desc.toLowerCase()
            return name.includes(value) || desc.includes(value)
        }).sort((a, b) => {
            let aName = a.displayName
            if (a.isContractEvent) {
                aName += ' Events'
            }
            aName = aName.toLowerCase()
            const aDesc = a.desc.toLowerCase()
            const aNameMatches = aName.includes(value)
            const aDescMatches = aDesc.includes(value)

            let bName = b.displayName
            if (b.isContractEvent) {
                bName += ' Events'
            }
            bName = bName.toLowerCase()
            const bDesc = b.desc.toLowerCase()
            const bNameMatches = bName.includes(value)
            const bDescMatches = bDesc.includes(value)
    
            return (
                Number(bNameMatches) - Number(aNameMatches) ||
                Number(bDescMatches) - Number(aDescMatches) ||
                Number(a.isContractEvent) - Number(b.isContractEvent)
            )
        })

        setSearchResults(matchingResults)
    }, [liveObjects])

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

    useEffect(() => {
        if (!showSearchTutorialAnno) {
            // setTimeout(() => {
            //     setShowSearchTutorialAnno(true)
            //     $('.slider__backdrop').addClass('--darker')
            // }, 1200)
        }
    }, [showSearchTutorialAnno])

    const renderSearchTutorialAnno = useCallback(() => (
        <TutorialAnno
            className='tutorial-anno--search'
            icon={searchIcon}
            title='Select a Live Object'
            desc='Assign a property of the Live Object as the source of data for your new column.'
            show={showSearchTutorialAnno}
        />
    ), [showSearchTutorialAnno])

    return (
        <div className={className}>
            { renderSearchTutorialAnno() }
            <div className={pcn('__search')}>
                <div className={pcn('__search-liner')}>
                    <span dangerouslySetInnerHTML={{ __html: searchIcon }}></span>
                    <input
                        type='text'
                        placeholder='What data do you need?'
                        spellCheck={false}
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