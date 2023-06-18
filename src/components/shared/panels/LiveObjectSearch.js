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
import { debounce } from 'lodash-es'
import { getMatchingLiveObjects, loadMatchingLiveObjects } from '../../../utils/liveObjects'
import { fileURLToPath } from 'url'
import { chainIds } from '../../../utils/chains'
import logger from '../../../utils/logger'

const className = 'live-object-search'
const pcn = getPCN(className)

function LiveObjectSearch(props, ref) {
    let { liveObjects = [], prevSearch, usePrevSearch, setUsePrevSearch, onSelectLiveObject = noop } = props
    const [searchResults, setSearchResults] = useState(liveObjects)
    const [showSearchTutorialAnno, setShowSearchTutorialAnno] = useState(false)
    
    // Refs
    const lastKeyCode = useRef(null)
    const offsetRef = useRef(0)
    const hasMore = useRef(true)
    const loading = useRef(false)
    const observer = useRef()
    const cursorRef = useRef(0)
    const activeResultRef = useRef()
    const scrollPanelRef = useRef()
    const searchInputRef = useRef(usePrevSearch ? prevSearch.query : null)
    const filtersRef = useRef(usePrevSearch ? prevSearch.filter : {})
    
    // Trigger fetch next page.
    const lastLiveObjectRef = useCallback(node => {
        if (loading.current) return
        if (observer.current) observer.current.disconnect()
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore.current) {
                offsetRef.current += 25
                fetchLiveObjectPage()
            }
        })
        if (node) observer.current.observe(node)
    }, [loading, hasMore])

    // Focus input.
    const focusInputRef = useCallback(node => {
        if (node) node.focus()
    },[])

    useImperativeHandle(ref, () => ({
        focusSearchBar: () => {
            searchInputRef.current && $(searchInputRef.current).focus()
        },
    }))

    // Render live objects.
    const renderResults = useCallback(() => {
        hasMore.current = hasMore && searchResults.length < 25 ? false : true  
        return searchResults.map((result, i) => {
            if (i === searchResults.length-5 && hasMore.current) {
                return <LiveObjectSearchResult 
                    key={i}
                    {...result}
                    onClick={() => onSelectLiveObject(result, searchInputRef.current, filtersRef.current)} 
                    index={i}
                    ref={lastLiveObjectRef}
                />
            } else if (i == cursorRef.current) {
                return <LiveObjectSearchResult 
                    key={i}
                    {...result} 
                    onClick={() => onSelectLiveObject(result, searchInputRef.current, filtersRef.current)} 
                    index={i}
                    ref={(e) => activeResultRef.current = e}
                />
            }
            return <LiveObjectSearchResult 
                key={i}
                {...result} 
                index={i}
                onClick={() => onSelectLiveObject(result, searchInputRef.current, filtersRef.current)}
            />
    })}, [searchResults, onSelectLiveObject])

    // Fetch live objects. Set state.
    async function fetchLiveObjectPage () {
        let activeFilters = Object.keys(filtersRef.current).filter(key => filtersRef.current[key] === true)
        activeFilters = activeFilters.join(' ')

        await loadMatchingLiveObjects(searchInputRef.current, activeFilters, offsetRef.current)
        const matchingResults = getMatchingLiveObjects()
        hasMore.current = matchingResults.length >= 25

        offsetRef.current > 0 ? setSearchResults(searchResults => [...searchResults, ...matchingResults]) : setSearchResults(matchingResults)
        loading.current = false
    }
    
    // Reset scroll.
    async function resetScroll () {
        offsetRef.current = 0
        cursorRef.current = 0
        if (scrollPanelRef.current) {
            scrollPanelRef.current.scrollTo(0, 0)
        }
    }

    // Debounce fetch live objects.
    const debouncedSearch = debounce(fetchLiveObjectPage, 10)

    // Set state for input. Initiate debounced search.
    const onTypeQuery = useCallback(async (e) => {
        const value = e.currentTarget.value.toLowerCase().trim()
        searchInputRef.current = value
        filtersRef.current = {}
        setUsePrevSearch(false)
        await resetScroll()
        await debouncedSearch()
    }, [liveObjects])

    // Set state for filter. Initiate debounced search.
    const onClickFilter = useCallback(async (e) => {
        const node = e.currentTarget
        const chain = node.getAttribute('value')

        if (chain == 0) {
            filtersRef.current = {}
        } else {   
            filtersRef.current[chain] === true ? delete filtersRef.current[chain] : filtersRef.current[chain] = true
            filtersRef.current[chain] ? node.classList.remove('activeSearchFilter') : node.classList.add('activeSearchFilter')
        }

        await resetScroll()
        await debouncedSearch()
    }, [liveObjects])

    // Handle key press events.
    const onKeyDown = useCallback(e => {
        lastKeyCode.current = e.which
    }, [])

    const onKeyUp = e => {
        lastKeyCode.current = e.which
        switch (lastKeyCode.current) {
        case keyCodes.ENTER:
            const index = activeResultRef.current.getAttribute('accessKey')
            searchResults.length && onSelectLiveObject(searchResults[index], searchInputRef.current, filtersRef.current)
            break
        case keyCodes.ARROW_UP:
            if (cursorRef.current > 0) {
                try {
                    activeResultRef.current.previousSibling.focus()
                    activeResultRef.current = activeResultRef.current.previousSibling
                    cursorRef.current = activeResultRef.current.getAttribute('accessKey')
                } catch (err) {
                    logger.error(`Error scrolling above range of available search results: ${err}`)
                }
            }
            break
        case keyCodes.ARROW_DOWN:
            if (cursorRef.current == 0) {
                try {
                    activeResultRef.current.focus()
                    cursorRef.current += 1
                } catch (err) {
                    logger.error(`Error scrolling below range of available search results: ${err}`)
                }
            } else if (cursorRef.current == 1) {
                try {
                    activeResultRef.current.nextSibling.focus()
                    activeResultRef.current = activeResultRef.current.nextSibling
                    cursorRef.current = activeResultRef.current.getAttribute('accessKey')
                } catch (err) {
                    logger.error(`Error scrolling below range of available search results: ${err}`)
                }
            } else if (cursorRef.current <= searchResults.length - 1) {
                try {
                    activeResultRef.current.nextSibling.focus()
                    activeResultRef.current = activeResultRef.current.nextSibling
                    cursorRef.current = activeResultRef.current.getAttribute('accessKey')
                } catch (err) {
                    logger.error(`Error scrolling below range of available search results: ${err}`)
                }
            }
            break
        default:
            break
        }
    }

    // Set class for filters.
    const setClass = (chain) => {
        if (chain === 'ALL') {
            return $.isEmptyObject(filtersRef.current) ? 'activeSearchFilter': ''
        } else {
            return $.isEmptyObject(filtersRef.current) || filtersRef.current[chainIds[chain]] == null  ? '': 'activeSearchFilter'
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
                        defaultValue={searchInputRef.current}
                        tabIndex="0"
                        ref={focusInputRef}
                    />
                </div>
            </div>
            <div className={pcn('__filters')}>
                <div className={pcn('__filters-liner')}>
                    <div className={pcn('__categories')}>
                        <span onClick={onClickFilter} className={setClass('ALL')} value={0}>All</span>
                        <span onClick={onClickFilter} className={setClass('ETHEREUM')} value={chainIds.ETHEREUM}>Ethereum</span>
                        <span onClick={onClickFilter} className={setClass('POLYGON')} value={chainIds.POLYGON}>Polygon</span>
                        <span onClick={onClickFilter} className={setClass('GOERLI')} value={chainIds.GOERLI}>Goerli</span>
                        <span onClick={onClickFilter} className={setClass('MUMBAI')} value={chainIds.MUMBAI}>Mumbai</span>
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
            <div className={pcn('__results')} ref={scrollPanelRef} onKeyUp={onKeyUp}>
                <div className={pcn('__results-liner')}>
                    { renderResults() }
                </div>
            </div>
        </div>
    )
}

LiveObjectSearch = forwardRef(LiveObjectSearch)
export default LiveObjectSearch