import React, { useMemo, useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { getPCN, cn } from '../../../utils/classes'
import $ from 'jquery'
import { noop } from '../../../utils/nodash'
import { s3 } from '../../../utils/path'
import EditableLiveColumns from './EditableLiveColumns'
import LiveColumnFilters from './LiveColumnFilters'
import Toggle from '../inputs/Toggle'
import UniqueMappings from './UniqueMappings'
import { caretDownIcon, filterIcon, linkIcon, githubIcon } from '../../../svgs/icons'
import hljs from 'highlight.js/lib/core'
import typescript from 'highlight.js/lib/languages/typescript'
import { camelToSnake } from '../../../utils/formatters'
import { sortInts } from '../../../utils/math'
import { chainNames } from '../../../utils/chains'
hljs.registerLanguage('typescript', typescript)

const className = 'new-live-column-specs'
const pcn = getPCN(className)

const observerScrollRoot = 'newLiveColumnSpecsScrollRoot'
const observerScrollTarget = 'newLiveColumnSpecsScrollTarget'
const panelScrollHeader = 'panelScrollHeader'
const scrollMod = '--scrolled'
const panelIndex1Class = 'new-live-column-panel__header-title-container--1'

const docsHeaderTabs = [
    {
        id: 'def',
        name: 'Interface',
    },
    {
        id: 'example',
        name: 'Example',
    },
]

const sizing = {
    ICON_LENGTH: 70,
    ICON_OFFSET_RIGHT: 21,
    LINKS_OFFSET_LEFT: 20,
    DOCS_HEADER_HEIGHT: 40 + 15 + 16,
    DOCS_PADDING_BOTTOM: 36,
    DOCS_INTERFACE_PADDING: 22 + 22 + 1 + 1,
    DOCS_INTERFACE_LINE_HEIGHT: 20,
    DOCS_COLLAPSED_BOTTOM_OFFSET: 13,
    DOCS_COLLAPSED_MAX_HEIGHT: 400,
    DOCS_HEIGHT_EXPANDED_OFFSET: 36,
    NSP_CHAR_WIDTH: 7,
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

const guessDefaultLiveColumns = (columnNames, propertyNames) => {
    const liveColumns = {}
    const columnNamesSet = new Set(columnNames)
    for (const propertyName of propertyNames) {
        const exactMatch = columnNamesSet.has(propertyName)
        const columnName = exactMatch ? propertyName : camelToSnake(propertyName)

        if (exactMatch || columnNamesSet.has(columnName)) {
            liveColumns[columnName] = {
                property: propertyName,
            }
        }
    }
    return liveColumns
}

function NewLiveColumnSpecs(props, ref) {
    // Props
    const { liveObject, table, schema } = props

    // State
    const [docsExpanded, setDocsExpanded] = useState(false)
    const [selectedDocsIndex, setSelectedDocsIndex] = useState(0)
    const [useFilters, setUseFilters] = useState(false)

    // Refs
    const editableLiveColumnsRef = useRef()
    const liveColumnFiltersRef = useRef()
    const uniqueMappingsRef = useRef()
    const expandedDocsHeight = useRef(null)
    const createdHeaderIntersectionObserver = useRef(false)

    // Derived
    const liveObjectVersion = useMemo(() => liveObject?.latestVersion || {}, [liveObject])
    const interfaceCode = useMemo(() => liveObjectVersion ? buildInterfaceCode(liveObjectVersion) : '', [liveObjectVersion])
    const exampleObjectCode = useMemo(() => liveObjectVersion ? buildExampleObjectCode(liveObjectVersion) : '', [liveObjectVersion])
    const columnNames = useMemo(() => table?.columns?.map(c => c.name) || [], [table])
    const propertyNames = useMemo(() => liveObjectVersion?.properties?.map(p => p.name) || [], [liveObjectVersion])
    const defaultLiveColumns = useMemo(() => guessDefaultLiveColumns(columnNames, propertyNames), [columnNames, propertyNames])
    const supportedChainIds = useMemo(() => sortInts(
        Object.keys(liveObjectVersion?.config?.chains || {}).map(v => parseInt(v))
    ).map(v => v.toString()), [liveObjectVersion])
    const supportedChainNames = useMemo(() => supportedChainIds.map(chainId => chainNames[chainId]).filter(v => !!v), [supportedChainIds])
    const collapsedHeight = useMemo(() => Math.min(
        (
            sizing.DOCS_HEADER_HEIGHT + 
            sizing.DOCS_INTERFACE_PADDING + 
            sizing.DOCS_PADDING_BOTTOM +
            sizing.DOCS_INTERFACE_LINE_HEIGHT * (2 + propertyNames.length)
            + 12
        ),
        sizing.DOCS_COLLAPSED_MAX_HEIGHT
    ), [propertyNames])

    const getLiveColumns = useCallback(() => editableLiveColumnsRef.current?.serialize() || [], [])
    const getFilters = useCallback(() => liveColumnFiltersRef.current?.serialize() || [], [])
    const getUniqueMappings = useCallback(() => uniqueMappingsRef.current?.serialize() || [], [])

    useImperativeHandle(ref, () => ({
        serialize: () => {
            const liveColumns = getLiveColumns().filter(liveColumn => (
                !!liveColumn.property && !!liveColumn.columnName
            ))
            const filters = getFilters().filter(filter => (
                !!filter.property && !!filter.value
            ))
            const uniqueMappings = getUniqueMappings().filter(mapping => (
                !!mapping.property && !!mapping.columnPath
            ))

            return {
                liveColumns,
                filters,
                uniqueMappings,
            }
        }
    }), [getLiveColumns, getFilters, getUniqueMappings])

    const calculateExpandedDocsHeight = useCallback(ref => {
        if (expandedDocsHeight.current || !ref) return
        setTimeout(() => {
            if (ref.offsetHeight) {
                expandedDocsHeight.current = ref.offsetHeight + sizing.DOCS_HEIGHT_EXPANDED_OFFSET
            }
        }, 10)
    }, [])

    const createHeaderIntersectionObserver = useCallback(() => {
        const observer = new IntersectionObserver(entries => {
            if (!entries || !entries[0]) return
            const primaryDetailsShown = entries[0].isIntersecting
            const $header = $(`#${panelScrollHeader}`)
            if (!$header.length) return
            const hasScrollClass = $header.hasClass(scrollMod)

            if (primaryDetailsShown && hasScrollClass) {
                $header.removeClass(scrollMod)
            } else if (!primaryDetailsShown && !hasScrollClass && $header.hasClass(panelIndex1Class)) {
                $header.addClass(scrollMod)
            }
        }, { threshold: 0, root: document.querySelector(`#${observerScrollRoot}`) })

        const el = document.querySelector(`#${observerScrollTarget}`)
        el && observer.observe(el)
    }, [])

    useEffect(() => {
        if (createdHeaderIntersectionObserver.current) return
        createdHeaderIntersectionObserver.current = true
        window.IntersectionObserver && createHeaderIntersectionObserver()
    }, [createHeaderIntersectionObserver])

    const renderProperties = useCallback(() => liveObjectVersion.properties.map((p, i) => (
        <div key={i} className={pcn('__doc-property')}>
            <div><span>{p.name}</span><span>{p.type}</span></div>
            <div>{p.desc}</div>
        </div>
    )), [liveObjectVersion])

    const renderDocsSection = useCallback(() => (
        <div className={pcn('__docs')} ref={calculateExpandedDocsHeight}>
            <div className={pcn('__version')}>
                <span>v{liveObjectVersion.version}</span>
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

    const renderPrimaryDetails = useCallback(() => {
        const nsp = `@${liveObjectVersion.nsp}`
        const mainWidthOffset = (
            sizing.ICON_LENGTH + 
            sizing.ICON_OFFSET_RIGHT + 
            sizing.LINKS_OFFSET_LEFT + 
            (nsp.length * sizing.NSP_CHAR_WIDTH)
        )
        return (
            <div id={observerScrollTarget} className={pcn('__primary-details')}>
                <div className={pcn('__primary-details-liner')}>
                    <div className={pcn('__primary-details-icon')}>
                        <img
                            src={s3(`${liveObject.id}.jpg`)}
                            alt=""
                        />
                    </div>
                    <div className={pcn('__primary-details-main')} style={{ maxWidth: `calc(100% - ${mainWidthOffset}px)`}}>
                        <div className={pcn('__primary-details-main-top')}>
                            <div className={pcn('__primary-details-name')}>
                                <span>{liveObject.name}</span>
                            </div>
                            { supportedChainNames.length &&
                                <div className={pcn('__primary-details-chains')}>
                                    { supportedChainNames.map((chain, i) => (
                                        <div key={i} className={pcn(
                                            '__primary-details-chain', 
                                            `__primary-details-chain--${chain.toLowerCase()}`
                                        )}>
                                            <span>{chain}</span>
                                        </div>
                                    ))}
                                </div>
                            }
                        </div>
                        <div className={pcn('__primary-details-desc')}>
                            <span>{liveObject.desc}</span>
                        </div>    
                    </div>
                    <div className={pcn('__primary-details-links')}>
                        <a
                            className={pcn('__primary-details-link', '__primary-details-link--gh')}
                            target="_blank"
                            dangerouslySetInnerHTML={{ __html: githubIcon }}>
                        </a>
                        <span className={pcn('__primary-details-link', '__primary-details-link--nsp')}>
                            {nsp}
                        </span>
                    </div>    
                </div>
            </div>
        )
    }, [liveObjectVersion, liveObject, supportedChainNames])

    const renderTypeOverview = useCallback(() => (
        <div
            className={pcn('__type-overview', `__type-overview--${liveObjectVersion.name}`)}>
            <div
                style={{ height: docsExpanded && expandedDocsHeight.current 
                    ? expandedDocsHeight.current : collapsedHeight 
                }}
                className={pcn(
                    '__type-overview-liner', 
                    docsExpanded ? '__type-overview-liner--expanded' : '',
                )}>
                { renderInterfaceSection() }
                { renderDocsSection() }
            </div>
            <span
                className={pcn('__expand', docsExpanded ? '__expand--expanded' : '')}
                onClick={() => setDocsExpanded(!docsExpanded)}
                dangerouslySetInnerHTML={{ __html: caretDownIcon }}>
            </span>
        </div>
    ), [liveObjectVersion, docsExpanded, renderDocsSection, renderInterfaceSection, collapsedHeight])

    const renderLiveColumnsSection = useCallback(() => (
        <div className={pcn('__section', '__section--live-columns')}>
            <div className={pcn('__section-title')}>
                <span className='blink-indicator'><span></span></span>
                <span>Live Columns</span>
            </div>
            <div className={pcn('__section-subtitle')}>
                Stream {liveObjectVersion.name} properties directly into your columns.
            </div>
            <div className={pcn('__section-main')}>
                <EditableLiveColumns
                    table={table}
                    liveColumns={defaultLiveColumns || {}}
                    liveObjectVersion={liveObjectVersion}
                    ref={editableLiveColumnsRef}
                />
            </div>
        </div>
    ), [liveObjectVersion, defaultLiveColumns, liveObject, table])

    const renderFiltersSection = useCallback(() => (
        <div className={pcn('__section', '__section--filters')}>
            <div className={pcn('__section-title')}>
                <span
                    className={pcn('__section-icon')}
                    dangerouslySetInnerHTML={{ __html: filterIcon }}>
                </span>
                <span>Filters</span>
            </div>
            <div className={pcn('__section-main')}>
                <div className={pcn('__filters-question')}>
                    <div className={pcn('__section-subtitle')}>
                        Which {liveObject.name} do you need?
                    </div>
                    <div className={pcn('__filters-toggle-container')}>
                        <Toggle
                            falseText='All'
                            trueText='Filter By'
                            value={useFilters}
                            onChange={setUseFilters}
                        />
                    </div>
                </div>
                <div className={pcn('__filters-container')}>
                    <LiveColumnFilters
                        liveObjectVersion={liveObjectVersion}
                        useFilters={useFilters}
                        schema={schema}
                        ref={liveColumnFiltersRef}
                    />
                </div>
            </div>
        </div>
    ), [liveObjectVersion, liveObject, schema, useFilters])

    const renderMappingsSection = useCallback(() => (
        <div className={pcn('__section', '__section--mapping')}>
            <div className={pcn('__section-title')}>
                <span
                    className={pcn('__section-icon')}
                    dangerouslySetInnerHTML={{ __html: linkIcon }}>
                </span>
                <span>1:1 Unique Mapping</span>
            </div>
            <div className={pcn('__section-subtitle')}>
                Something something something...
            </div>
            <div className={pcn('__section-main')}>
                <UniqueMappings
                    liveObjectVersion={liveObjectVersion}
                    schema={schema}
                    tableName={table.name}
                    getLiveColumns={getLiveColumns}
                    getFilters={getFilters}
                    ref={uniqueMappingsRef}
                />
            </div>
        </div>
    ), [liveObjectVersion, liveObject])

    if (!liveObjectVersion.name) {
        return <div className={className}></div>
    }

    return (
        <div className={className} id={observerScrollRoot}>
            { renderPrimaryDetails() }
            { renderTypeOverview() }
            { renderFiltersSection() }
            { renderLiveColumnsSection() }
        </div>
    )
}

NewLiveColumnSpecs = forwardRef(NewLiveColumnSpecs)
export default NewLiveColumnSpecs