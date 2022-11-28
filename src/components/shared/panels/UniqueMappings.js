import React, { useMemo, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import { getPCN } from '../../../utils/classes'
import SelectInput from '../../shared/inputs/SelectInput'
import closeIcon from '../../../svgs/close'
import { noop } from '../../../utils/nodash'
import { getSchema } from '../../../utils/schema'
import { filterOps } from '../../../utils/filters'

const className = 'unique-mappings'
const pcn = getPCN(className)

function UniqueMappings(props, ref) {
    const { liveObjectVersion = {}, schema, tableName, getLiveColumns = noop, getFilters = noop } = props
    const [mappings, setMappings] = useState(props.mappings || [{}])
    const propertyOptions = useMemo(() => (liveObjectVersion.properties || []).map(p => (
        { value: p.name, label: `.${p.name}` }
    )), [liveObjectVersion])
    const columnNameOptions = useMemo(() => (getSchema(schema) || [])
        .map(table => table.columns.map(c => [table.name, c.name].join('.')))
        .flat()
        .map(columnPath => ({ value: columnPath, label: columnPath })), 
    [schema])

    useImperativeHandle(ref, () => ({
        serialize: () => mappings
    }), [mappings])

    const setMappingData = useCallback((idx, key, value) => {
        const newMappings = []
        let mapping
        for (let i = 0; i < mappings.length; i++) {
            mapping = mappings[i]
            if (i === idx) {
                mapping[key] = value
            }
            newMappings.push(mapping)
        }

        // Check if can auto-select column path using property.
        if (key === 'property' && !newMappings[idx].columnPath) {
            let columnPath = ((getFilters() || []).find(filter => (
                filter.property === value && (!filter.op || filter.op === filterOps.IN)
            )) || {}).value

            if (!columnPath) {
                const colName = ((getLiveColumns() || []).find(liveColumn => (
                    liveColumn.property === value
                )) || {}).columnName
                if (colName) {
                    columnPath = [tableName, colName].join('.')
                }
            }

            if (columnPath) {
                newMappings[idx].columnPath = columnPath
            }
        }

        setMappings(newMappings)
    }, [mappings, liveObjectVersion, getLiveColumns, getFilters])

    const addNewMapping = useCallback(() => {
        setMappings(prevState => [ ...prevState, {}])
    }, [])

    const removeMapping = useCallback((idx) => {
        const newMappings = []
        for (let i = 0; i < mappings.length; i++) {
            if (i === idx) {
                continue
            }
            newMappings.push(mappings[i])
        }
        setMappings(newMappings)
    }, [mappings])

    const renderMappingInputs = useCallback(() => mappings.map((mapping, i) => (
        <div key={i} className={pcn('__mapping-input')}>
            <SelectInput
                className={pcn(
                    '__mapping-input-field', 
                    '__mapping-input-field--property', 
                )}
                classNamePrefix='spec'
                value={mapping.property}
                options={propertyOptions}
                placeholder='.property'
                isRequired={true}
                updateFromAbove={true}
                onChange={value => setMappingData(i, 'property', value)}
            />
            <div className={pcn('__mapping-icon')}>
                <span>:</span>
            </div>
            <SelectInput
                className={pcn(
                    '__mapping-input-field', 
                    '__mapping-input-field--col-path', 
                )}
                classNamePrefix='spec'
                value={mapping.columnPath}
                options={columnNameOptions}
                placeholder='column_path'
                isRequired={true}
                updateFromAbove={true}
                onChange={value => setMappingData(i, 'columnPath', value)}
            />
            <div
                className={pcn('__mapping-input-icon-button', '__mapping-input-icon-button--remove')}
                onClick={() => removeMapping(i)}
                dangerouslySetInnerHTML={{ __html: closeIcon }}>
            </div>
        </div>
    )), [mappings, setMappingData, propertyOptions, removeMapping])

    return (
        <div className={className}>
            <div className={pcn('__liner')}>
                <div className={pcn('__mapping-inputs')}>
                    { renderMappingInputs() }
                </div>
                <div className={pcn('__action-buttons')}>
                    <button onClick={addNewMapping}>
                        <span>AND</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

UniqueMappings = forwardRef(UniqueMappings)
export default UniqueMappings