import React, { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react'
import { getPCN } from '../../../utils/classes'
import searchIcon from '../../../svgs/search'
import LiveObjectSearchResult from './LiveObjectSearchResult'
import { noop } from '../../../utils/nodash'
import { keyCodes } from '../../../utils/keyboard'
import TutorialAnno from '../tutorial/TutorialAnno'
import { debounce } from 'lodash-es'
import { loadMatchingLiveObjects } from '../../../utils/liveObjects'
import logger from '../../../utils/logger'
import ChainFilterButtons from '../filters/ChainFilterButtons'
import { AutoSizer, List, InfiniteLoader } from 'react-virtualized'

const className = 'live-object-search'
const pcn = getPCN(className)

const PAGE_SIZE = 25

function LiveObjectSearch(props, ref) {
    const { onSelectLiveObject = noop } = props
    const [searchResults, setSearchResults] = useState(props.searchResults || [])
    const [searchParams, setSearchParams] = useState(props.searchParams || {})
    const [showSearchTutorialAnno, setShowSearchTutorialAnno] = useState(false)
    
    // Refs
    const lastKeyCode = useRef(null)
    const offsetRef = useRef(0)
    const hasMore = useRef(true)
    const cursorRef = useRef(0)
    const activeResultRef = useRef()
    const searchPanelRef = useRef()
    const searchResultsScroll = useRef()

    // Focus input.
    const focusInputRef = useCallback(node => node?.focus(), [])

    useImperativeHandle(ref, () => ({
        focusSearchBar: () => focusInputRef()
    }), [focusInputRef])

    const onUpdateChainFilters = useCallback(async (newChainIds) => {
        const filters = searchParams.filters || {}
        filters.chainIds = newChainIds
        setSearchParams({ ...searchParams, filters })
        resetScroll()
        await debouncedSearch(searchParams.query, filters)
    }, [searchParams])

    const rowRenderer = useCallback(({index, key, style}) => {
        const result = searchResults[index];
        let ref = null;
        if (index == cursorRef.current) {
            ref = (e) => activeResultRef.current = e
        }
        return (
            <LiveObjectSearchResult 
                key={key}
                ref={ref}
                index={index}
                style={style}
                onClick={() => onSelectLiveObject(result, searchParams, searchResults)}
                {...result} 
            />
        )
    }, [searchResults, searchParams, onSelectLiveObject])

    // Fetch live objects. Set state.
    const fetchLiveObjectPage = useCallback(async (query, filters) => {
        const matchingResults = await loadMatchingLiveObjects(query, filters, offsetRef.current)
        hasMore.current = matchingResults.length >= PAGE_SIZE
        offsetRef.current > 0 
            ? setSearchResults(searchResults => [...searchResults, ...matchingResults]) 
            : setSearchResults(matchingResults)
    }, [])

    const fetchNextPage = useCallback(async ({startIndex, stopIndex}) => {
        if (!hasMore.current) {
            return false;
        }
        const matchingResults = await loadMatchingLiveObjects(searchParams.query, searchParams.filters, startIndex);
        hasMore.current = matchingResults.length > 0 ? true : false;
        setSearchResults(searchResults => [...searchResults, ...matchingResults]);
    }, [searchParams])
    
    // Reset scroll.
    const resetScroll = useCallback(() => {
        offsetRef.current = 0
        cursorRef.current = 0
        searchPanelRef.current?.scrollTo(0, 0)
        searchResultsScroll.current.scrollToRow(0);
    }, [])

    // Debounce fetch live objects.
    const debouncedSearch = debounce(fetchLiveObjectPage, 10)

    // Set state for input. Initiate debounced search.
    const onTypeQuery = useCallback(async (e) => {
        const query = (e.currentTarget?.value || '').toLowerCase().trim()
        setSearchParams(prevState => ({ ...prevState, query }))
        resetScroll()
        await debouncedSearch(query, searchParams.filters)
    }, [searchParams.filters, resetScroll, debouncedSearch])

    // Handle key press events.
    const onKeyDown = useCallback(e => {
        lastKeyCode.current = e.which
        searchResultsScroll.current.scrollToRow(0);
    }, [])

    const onKeyUp = useCallback(e => {
        lastKeyCode.current = e.which
        switch (lastKeyCode.current) {
        case keyCodes.ENTER:
            if (!activeResultRef.current) break
            const index = activeResultRef.current.getAttribute('accessKey')
            searchResults.length && onSelectLiveObject(searchResults[index], searchParams, searchResults)
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
    }, [searchParams, searchResults])

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
                        defaultValue={searchParams.query}
                        tabIndex="0"
                        ref={focusInputRef}
                    />
                </div>
            </div>
            <div className={pcn('__filters')}>
                <div className={pcn('__filters-liner')}>
                    <ChainFilterButtons
                        selectedChainIds={searchParams.filters?.chainIds}
                        onChangeSelection={onUpdateChainFilters}
                    />
                </div>
            </div>
            <div className={pcn('__results')} ref={searchPanelRef} onKeyUp={onKeyUp}>
                <AutoSizer>
                    {({width, height}) => (
                        <InfiniteLoader
                        isRowLoaded={({index}) => index < (searchResults.length - 1)}
                        loadMoreRows={fetchNextPage}
                        threshold={5}
                        rowCount={searchResults.length}
                        >
                            {({onRowsRendered, registerChild}) => (
                            <List
                            ref={(el) => {
                                registerChild.current = el;
                                searchResultsScroll.current = el;            
                            }}
                            height={height}
                            rowCount={searchResults.length}
                            rowHeight={100}
                            onRowsRendered={onRowsRendered}
                            rowRenderer={rowRenderer}
                            width={width}
                        />)}
                        </InfiniteLoader>
                    )}
                </AutoSizer>
            </div>
        </div>
    )
}

LiveObjectSearch = forwardRef(LiveObjectSearch)
export default LiveObjectSearch