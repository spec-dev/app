import React, { useMemo, useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { getPCN, cn } from '../../../utils/classes'
import { noop } from '../../../utils/nodash'
import EditableLiveColumns from './EditableLiveColumns'
import LiveColumnFilters from './LiveColumnFilters'
import UniqueMappings from './UniqueMappings'
import { caretDownIcon, filterIcon, linkIcon } from '../../../svgs/icons'
import hljs from 'highlight.js/lib/core'
import typescript from 'highlight.js/lib/languages/typescript'
import { camelToSnake } from '../../../utils/formatters'
hljs.registerLanguage('typescript', typescript)

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

const docsHeight = {
    COLLAPSED: 430,
    EXPANDED_OFFSET: 58,
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

const guessDefaultLiveColumns = (columnNames, propertyNames, columnOrder) => {
    const liveColumns = []
    const columnNamesSet = new Set(columnNames)
    for (const propertyName of propertyNames) {
        const exactMatch = columnNamesSet.has(propertyName)
        const columnName = exactMatch ? propertyName : camelToSnake(propertyName)

        if (exactMatch || columnNamesSet.has(columnName)) {
            liveColumns.push({
                property: propertyName,
                columnName: columnName,
            })
        }
    }
    return liveColumns.sort((a, b) => columnOrder[a.columnName] - columnOrder[b.columnName])
}

function NewLiveColumnSpecs(props, ref) {
    // Props
    const { liveObject, table, schema } = props

    // State
    const [docsExpanded, setDocsExpanded] = useState(false)
    const [selectedDocsIndex, setSelectedDocsIndex] = useState(0)

    // Refs
    const editableLiveColumnsRef = useRef()
    const liveColumnFiltersRef = useRef()
    const uniqueMappingsRef = useRef()
    const expandedDocsHeight = useRef(null)

    // Derived
    const liveObjectVersion = useMemo(() => liveObject?.latestVersion || {}, [liveObject])
    const interfaceCode = useMemo(() => liveObjectVersion ? buildInterfaceCode(liveObjectVersion) : '', [liveObjectVersion])
    const exampleObjectCode = useMemo(() => liveObjectVersion ? buildExampleObjectCode(liveObjectVersion) : '', [liveObjectVersion])
    const columnNames = useMemo(() => table?.columns?.map(c => c.name) || [], [table])
    const columnOrder = useMemo(() => {
        const order = {}
        for (const col of table?.columns || []) {
            order[col.name] = col.ordinal_position
        }
        return order
    }, [table])
    const propertyNames = useMemo(() => liveObjectVersion?.properties?.map(p => p.name) || [], [liveObjectVersion])
    const defaultLiveColumns = useMemo(() => guessDefaultLiveColumns(columnNames, propertyNames, columnOrder), [columnNames, propertyNames])
    
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
                expandedDocsHeight.current = ref.offsetHeight + docsHeight.EXPANDED_OFFSET
            }
        }, 10)
    }, [])

    const renderProperties = useCallback(() => liveObjectVersion.properties.map((p, i) => (
        <div key={i} className={pcn('__doc-property')}>
            <div><span>{p.name}</span><span>{p.type}</span></div>
            <div>{p.desc}</div>
        </div>
    )), [liveObjectVersion])

    const renderDocsSection = useCallback(() => (
        <div className={pcn('__docs')} ref={calculateExpandedDocsHeight}>
            <div className={pcn('__doc-object-name')}>
                <span>{ liveObjectVersion.name }</span><span>&mdash;</span><span>Live Object</span>
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

    const renderTypeOverview = useCallback(() => (
        <div className={pcn('__type-overview', `__type-overview--${liveObjectVersion.name}`)}>
            <div
                style={{ height: docsExpanded && expandedDocsHeight.current 
                    ? expandedDocsHeight.current : docsHeight.COLLAPSED 
                }}
                className={pcn(
                    '__type-overview-liner', 
                    docsExpanded ? '__type-overview-liner--expanded' : '',
                )}>
                { renderDocsSection() }
                { renderInterfaceSection() }
            </div>
            <span
                className={pcn('__expand', docsExpanded ? '__expand--expanded' : '')}
                onClick={() => setDocsExpanded(!docsExpanded)}
                dangerouslySetInnerHTML={{ __html: caretDownIcon }}>
            </span>
        </div>
    ), [liveObjectVersion, docsExpanded, renderDocsSection, renderInterfaceSection])

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
                    liveObjectVersion={liveObjectVersion}
                    liveColumns={defaultLiveColumns?.length ? defaultLiveColumns : [{}]}
                    columnNames={columnNames}
                    ref={editableLiveColumnsRef}
                />
            </div>
        </div>
    ), [liveObjectVersion, liveObject])

    const renderFiltersSection = useCallback(() => (
        <div className={pcn('__section', '__section--filters')}>
            <div className={pcn('__section-title')}>
                <span
                    className={pcn('__section-icon')}
                    dangerouslySetInnerHTML={{ __html: filterIcon }}>
                </span>
                <span>Filters</span>
            </div>
            <div className={pcn('__section-subtitle')}>
                Get all {liveObjectVersion.name}s where...
            </div>
            <div className={pcn('__section-main')}>
                <LiveColumnFilters
                    liveObjectVersion={liveObjectVersion}
                    schema={schema}
                    ref={liveColumnFiltersRef}
                />
            </div>
        </div>
    ), [liveObjectVersion, liveObject, schema])

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
        <div className={className}>
            { renderTypeOverview() }
            { renderLiveColumnsSection() }
            { renderFiltersSection() }
            { renderMappingsSection() }
        </div>
    )
}

NewLiveColumnSpecs = forwardRef(NewLiveColumnSpecs)
export default NewLiveColumnSpecs