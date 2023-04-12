import React, { useMemo, useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { getPCN, cn } from '../../../utils/classes'
import $ from 'jquery'
import { noop } from '../../../utils/nodash'
import EditableLiveColumns from './EditableLiveColumns'
import LiveColumnFilters from './LiveColumnFilters'
import { referrers as purposes } from './NewLiveColumnPanel'
import Toggle from '../inputs/Toggle'
import NewTableBasicInputs from './NewTableBasicInputs'
import { caretDownIcon, filterIcon, githubIcon, tableEditorIcon } from '../../../svgs/icons'
import hljs from 'highlight.js/lib/core'
import { formatExistingFiltersForEdit } from '../../../utils/config'
import typescript from 'highlight.js/lib/languages/typescript'
import { camelToSnake, toPlural } from '../../../utils/formatters'
import { sortInts } from '../../../utils/math'
import { chainNames } from '../../../utils/chains'
import Snippet from '../snippets/InterfaceExampleSnippet'
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
    DOCS_PADDING_BOTTOM: 36,
    DOCS_INTERFACE_PADDING: 21 + 21 + 1 + 1,
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

const getLiveColumnsSectionTitle = purpose => {
    return 'Table Schema'
    // switch (purpose) {
    //     case purposes.NEW_LIVE_TABLE:
    //         return 'Table Schema'
    //     default:
    //         return 'Live Columns'
    // }
}

const getLiveColumnsSectionSubtitle = (purpose, liveObjectVersion, isContractEvent) => {
    return 'Live Columns'
    // const properties = `${isContractEvent ? 'event ' : ''}properties`
    // switch (purpose) {
    //     case purposes.NEW_LIVE_COLUMN:
    //         return `Stream ${liveObjectVersion.name} ${properties} into your columns.`
    //     case purposes.NEW_LIVE_TABLE:
    //         return `Live Columns`
    //     default:
    //         return `Stream ${liveObjectVersion.name} ${properties} into your columns.`
    // }
}

function NewLiveColumnSpecs(props, ref) {
    // Props
    const { liveObject, table, config, schema, purpose, editColumn = noop } = props

    // State
    const [docsExpanded, setDocsExpanded] = useState(false)
    const [selectedDocsIndex, setSelectedDocsIndex] = useState(0)

    // Refs
    const editableLiveColumnsRef = useRef()
    const liveColumnFiltersRef = useRef()
    const newTableDetailsRef = useRef()
    const uniqueMappingsRef = useRef()
    const expandedDocsHeight = useRef(null)
    const createdHeaderIntersectionObserver = useRef(false)

    // Derived
    const isNewTable = useMemo(() => purpose === purposes.NEW_LIVE_TABLE, [purpose])
    const liveObjectVersion = useMemo(() => liveObject?.latestVersion || {}, [liveObject])
    const interfaceCode = useMemo(() => liveObjectVersion ? buildInterfaceCode(liveObjectVersion) : '', [liveObjectVersion])
    const exampleObjectCode = useMemo(() => liveObjectVersion ? buildExampleObjectCode(liveObjectVersion) : '', [liveObjectVersion])
    const propertyNames = useMemo(() => liveObjectVersion?.properties?.map(p => p.name) || [], [liveObjectVersion])
    const supportedChainIds = useMemo(() => sortInts(
        Object.keys(liveObjectVersion?.config?.chains || {}).map(v => parseInt(v))
    ).map(v => v.toString()), [liveObjectVersion])
    const supportedChainNames = useMemo(() => supportedChainIds.map(chainId => chainNames[chainId]).filter(v => !!v), [supportedChainIds])
    const collapsedHeight = useMemo(() => Math.min(
        (
            sizing.DOCS_INTERFACE_PADDING + 
            sizing.DOCS_PADDING_BOTTOM +
            sizing.DOCS_INTERFACE_LINE_HEIGHT * (2 + propertyNames.length)
        ),
        sizing.DOCS_COLLAPSED_MAX_HEIGHT
    ), [propertyNames])
    const existingFilters = useMemo(() => (
        isNewTable ? null : formatExistingFiltersForEdit(table, config, liveObjectVersion)
    ), [isNewTable, table, config, liveObjectVersion])

    const [useFilters, setUseFilters] = useState(!!existingFilters?.length)

    const nsp = useMemo(() => {
        let nsp = liveObjectVersion.nsp || ''
        if (liveObject.isContractEvent) {
            const splitNsp = nsp.split('.')
            nsp = [splitNsp[0], splitNsp[1]].join('.')
        }    
        return nsp
    }, [liveObjectVersion?.nsp, liveObject?.isContractEvent])

    const displayName = useMemo(() => {
        let name = liveObject.displayName
        if (liveObject.isContractEvent) {
            name = `${name} Events`
        }
        return name
    }, [liveObjectVersion?.displayName, liveObject?.isContractEvent])

    const getFilters = useCallback(() => liveColumnFiltersRef.current?.serialize() || [], [])
    const getUniqueMappings = useCallback(() => uniqueMappingsRef.current?.serialize() || [], [])

    useImperativeHandle(ref, () => ({
        serialize: () => {
            const filters = useFilters ? getFilters() : []
            const newTable = isNewTable ? newTableDetailsRef.current?.serialize() : null
            const [newColumns, liveColumns, uniqueBy] = editableLiveColumnsRef.current?.serialize()
            return { filters, newTable, newColumns, liveColumns, uniqueBy }
        }
    }), [getFilters, getUniqueMappings, useFilters, liveObjectVersion, isNewTable])

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

    const renderDocsSection = useCallback(() => (
        <div className={pcn('__docs')} ref={calculateExpandedDocsHeight}>
            <div className={pcn('__doc-properties')}>
                { liveObjectVersion.properties.map((p, i) => (
                    <div key={`${liveObjectVersion.name}.${p.name}`} className={pcn('__doc-property')}>
                        <div><span>{p.name}</span><span>{p.type}</span></div>
                        <div>{p.desc}</div>
                    </div>
                )) }
            </div>
        </div>
    ), [liveObjectVersion])

    const renderInterfaceSection = useCallback(() => (
        <div className={cn('editor', pcn('__interface'))}>
            <Snippet
                exampleCode={exampleObjectCode}
                interfaceCode={interfaceCode}
            />
        </div>
    ), [liveObjectVersion, selectedDocsIndex, interfaceCode, exampleObjectCode])

    const renderPrimaryDetails = useCallback(() => {
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
                            src={liveObject.icon}
                            alt=""
                        />
                    </div>
                    <div className={pcn('__primary-details-main')} style={{ maxWidth: `calc(100% - ${mainWidthOffset}px)`}}>
                        <div className={pcn('__primary-details-main-top')}>
                            <div className={pcn('__primary-details-name')}>
                                <span>{displayName}</span>
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
                            href={liveObject.codeUrl}
                            dangerouslySetInnerHTML={{ __html: githubIcon }}>
                        </a>
                        <span className={pcn('__primary-details-link', '__primary-details-link--nsp')}>
                            {`@${nsp}`}
                        </span>
                    </div>
                </div>
            </div>
        )
    }, [liveObjectVersion, liveObject, supportedChainNames, nsp, displayName])

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

    const renderFiltersSection = useCallback(() => {
        let name = liveObject.displayName
        if (liveObject.isContractEvent) {
            name = `${name} events`
        }
        return (
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
                            Which {name} do you need?
                        </div>
                        <div className={pcn('__filters-toggle-container')}>
                            <Toggle
                                falseText='All Records'
                                trueText='Filter By'
                                value={useFilters}
                                onChange={setUseFilters}
                            />
                        </div>
                    </div>
                    <div className={pcn('__filters-container')}>
                        <LiveColumnFilters
                            filters={existingFilters}
                            liveObjectVersion={liveObjectVersion}
                            useFilters={useFilters}
                            schema={schema}
                            tableName={table?.name}
                            isNewTable={isNewTable}
                            addForeignKeyRefToTable={(...args) => {
                                editableLiveColumnsRef.current?.addForeignKeyRefToTable(...args)
                            }}
                            ref={liveColumnFiltersRef}
                        />
                    </div>
                </div>
            </div>
        )
    }, [liveObjectVersion, liveObject, schema, useFilters, table?.name, isNewTable])

    const renderLiveColumnsSection = useCallback(() => {
        let initialTableName = liveObjectVersion.config?.tableName
        if (!initialTableName) {
            initialTableName = toPlural(camelToSnake(
                liveObject.isContractEvent ? `${liveObject.displayName}Event` : liveObjectVersion.name
            ))
        }

        return (
            <div className={pcn('__section', '__section--live-columns')}>
                <div className={pcn('__section-title')}>
                    <span className='blink-indicator'><span></span></span>
                    <span>{getLiveColumnsSectionTitle(purpose)}</span>
                    <span>&mdash;</span>
                    <span>{getLiveColumnsSectionSubtitle(purpose, liveObjectVersion, liveObject.isContractEvent)}</span>
                </div>
                <div className={pcn('__section-main')}>
                    <EditableLiveColumns
                        table={table}
                        config={config}
                        liveObjectVersion={liveObjectVersion}
                        initialTableName={initialTableName}
                        purpose={purpose}
                        editColumn={editColumn}
                        ref={editableLiveColumnsRef}
                    />
                </div>
            </div>
        )
    }, [isNewTable, liveObjectVersion, liveObject, table, purpose])

    const renderTableInfoSection = useCallback(() => {
        let initialTableName = liveObjectVersion.config?.tableName
        if (!initialTableName) {
            initialTableName = toPlural(camelToSnake(
                liveObject.isContractEvent ? `${liveObject.displayName}Event` : liveObjectVersion.name
            ))
        }

        return (
            <div className={pcn('__section', '__section--table-info')}>
                <div className={pcn('__section-title')}>
                    <span
                        className={pcn('__section-icon')}
                        dangerouslySetInnerHTML={{ __html: tableEditorIcon }}>
                    </span>
                    <span>{`New Table`}</span>
                    <span>&mdash;</span>
                    <span>{`Name & Description`}</span>
                </div>
                <div className={pcn('__section-main')}>
                    <NewTableBasicInputs
                        values={{
                            name: initialTableName,
                            desc: liveObject.desc,
                        }}
                        onNameChange={val => editableLiveColumnsRef.current?.updateTableName(val)}
                        ref={newTableDetailsRef}
                    />
                </div>
            </div>
        )
    }, [liveObjectVersion, liveObject, table, purpose])

    if (!liveObjectVersion.name) {
        return <div className={className}></div>
    }

    return (
        <div className={cn(className, `${className}--${purpose}`)} id={observerScrollRoot}>
            { renderPrimaryDetails() }
            { renderTypeOverview() }
            { renderFiltersSection() }
            { isNewTable && renderTableInfoSection() }
            { renderLiveColumnsSection() }
        </div>
    )
}

NewLiveColumnSpecs = forwardRef(NewLiveColumnSpecs)
export default NewLiveColumnSpecs