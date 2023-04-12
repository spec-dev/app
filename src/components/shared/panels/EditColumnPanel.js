import React, { useState, useCallback, useMemo, useRef, forwardRef, useImperativeHandle, useEffect } from 'react'
import { getPCN, cn } from '../../../utils/classes'
import SelectInput from '../inputs/SelectInput'
import $ from 'jquery'
import { noop } from '../../../utils/nodash'
import { keyIcon, modelRelationshipIcon, requiredIcon } from '../../../svgs/icons'
import { cloneDeep } from 'lodash-es'
import { getSchema } from '../../../utils/schema'
import { colTypeIcon, displayColType } from '../../../utils/colTypes'
import { animated, useSpring } from 'react-spring'

const className = 'edit-column-panel'
const pcn = getPCN(className)

function EditColumnPanel(props, ref) {
    const { schema, onDone = noop, onCancel = noop } = props
    const [column, setColumn] = useState({})
    const callback = useRef()
    const tables = useMemo(() => getSchema(schema), [schema])
    const overflow = useRef('hidden')
    const containerRef = useRef()
    const fkLock = useRef(false)
    const fkChangeTimeout = useRef()

    const updateOverflow = useCallback((value) => {
        value = !!column.relationship ? value : 'hidden'
        if (containerRef.current) {
            clearTimeout(fkChangeTimeout.current)
            fkChangeTimeout.current = setTimeout(() => {
                $(containerRef.current).css('overflow', value)
            }, value === 'visible' ? 300 : 0)
        }
        overflow.current = value
    }, [column.relationship])

    const containerProps = useSpring({
        height: !!column.relationship ? 51 : 0,
        config: {
            tension: 1000,
            friction: 0,
            clamp: true,
        },
        onRest: () => {
            updateOverflow('visible')
            fkLock.current = false
        },
        onStart: () => updateOverflow('hidden'),
    })

    const refKeyOptions = useMemo(() => {
        const options = []
        for (const table of tables || []) {
            const uniqueColNames = (table.unique_columns || []).filter(group => group.length === 1).flat()
            if (!uniqueColNames.length) continue
            options.push(...uniqueColNames.map(colName => ({
                value: [table.name, colName].join('.'),
                label: [table.name, colName].join('.'),
                type: displayColType(table.columns.find(c => c.name === colName).data_type),
            })))
        }
        return options
    }, [tables])

    useImperativeHandle(ref, () => ({
        configure: (column, cb) => {
            callback.current = cb || noop
            setColumn(cloneDeep(column))
        },
        willHide: () => {
            callback.current && callback.current(null)
        }
    }), [])

    const onClickSave = useCallback(() => {
        callback.current && callback.current(column)
        setTimeout(onDone, 10)
    }, [column, onDone])

    const onClickCancel = useCallback(() => {
        callback.current && callback.current(null)
        setTimeout(onCancel, 10)
    })

    const toggleIsPrimaryKey = useCallback(() => {
        const newColumn = { ...column }
        newColumn.isPrimaryKey = !newColumn.isPrimaryKey
        if (newColumn.isPrimaryKey && newColumn.liveColumn?.onUniqueMapping) {
            newColumn.liveColumn.onUniqueMapping = false
        }
        if (newColumn.isPrimaryKey && (newColumn.is_nullable || !newColumn.hasOwnProperty('is_nullable'))) {
            newColumn.is_nullable = false
        }
        setColumn(newColumn)
    }, [column])

    const toggleIsForeignKey = useCallback(() => {
        fkLock.current = true
        const newColumn = { ...column }
        if (newColumn.hasOwnProperty('relationship')) {
            delete newColumn.relationship
        } else {
            newColumn.relationship = {}
        }
        setColumn(newColumn)
    }, [column])

    const toggleIsRequired = useCallback(() => {
        const newColumn = { ...column }
        newColumn.is_nullable = !newColumn.is_nullable
        setColumn(newColumn)
    }, [column])

    const setForeignKeyRelationship = useCallback((targetColPath) => {
        const newColumn = { ...column }

        if (!targetColPath) {
            newColumn.relationship = {}
            setColumn(newColumn)
            return
        }

        const targetColType = refKeyOptions.find(opt => opt.value === targetColPath).type
        newColumn.data_type = targetColType

        const [targetTableName, targetColName] = targetColPath.split('.')
        newColumn.relationship = {
            source_column_name: column.name,
            target_table_schema: schema,
            target_table_name: targetTableName,
            target_column_name: targetColName,
        }
        setColumn(newColumn)
    }, [column, refKeyOptions])

    const renderHeader = useCallback(() => {
        return (
            <div className={pcn('__header')}>
                <div className={pcn('__header-liner')}>
                    <div className={pcn('__header-title')}>
                        <span className='--code'>{column.name}</span>
                        <span>&mdash;</span>
                        <span>column constraints</span>
                    </div>
                </div>
            </div>
        )
    }, [column.name])

    const renderColumnValueSingleValue = useCallback(({ innerProps, data }) => {
        const icon = colTypeIcon(data.type)
        return (
            <span
                className='spec__single-value'
                { ...innerProps }>
                <span dangerouslySetInnerHTML={{ __html: icon }}></span>
                <span>{data.value}</span>
            </span>
        )
    }, [])

    const renderColumnValueOption = useCallback(({ innerRef, innerProps, data, isFocused, isSelected, isDisabled }) => {
        const icon = colTypeIcon(data.type)
        return (
            <span
                className={cn(
                    'spec__option',
                    isFocused ? 'spec__option--is-focused' : '',
                    isSelected ? 'spec__option--is-selected' : '',
                    isDisabled ? 'spec__option--is-disabled' : '',
                )}
                { ...innerProps }
                ref={innerRef}>
                <span dangerouslySetInnerHTML={{ __html: icon }}></span>
                <span>{data.value}</span>
            </span>
        )
    }, [])

    const renderPrimaryKeySection = useCallback(() => {
        return (
            <div className={pcn('__section', '__section--pk')}>
                <div className={pcn('__section-title')}>
                    <span
                        className={pcn('__section-icon', column.isPrimaryKey ? '__section-icon--bright' : '')}
                        dangerouslySetInnerHTML={{ __html: keyIcon }}>
                    </span>
                    <span>Is Primary Key?</span>
                </div>
                <div className={pcn('__section-body')}>
                    <div className={pcn('__qa')}>
                        <span>Include <span className='--code'>{column.name}</span> in the primary key?</span>
                        <div className={pcn('__section-toggle')}>
                            <button
                                className={cn('toggle-button', column.isPrimaryKey ? `toggle-button--true` : '')}
                                onClick={toggleIsPrimaryKey}>
                                <span></span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }, [column, toggleIsPrimaryKey])

    const renderForeignKeySection = useCallback(() => {
        const rel = column.relationship
        return (
            <div className={pcn('__section', '__section--fk')}>
                <div className={pcn('__section-title')}>
                    <span
                        className={pcn('__section-icon', !!rel ? '__section-icon--bright' : '')}
                        dangerouslySetInnerHTML={{ __html: modelRelationshipIcon }}>
                    </span>
                    <span>Is Foreign Key?</span>
                </div>
                <div className={pcn('__section-body')}>
                    <div className={pcn('__qa')}>
                        <span>Does <span className='--code'>{column.name}</span> reference a unique column on another table?</span>
                        <div className={pcn('__section-toggle')}>
                            <button
                                className={cn('toggle-button', !!rel ? `toggle-button--true` : '')}
                                onClick={() => !fkLock.current && toggleIsForeignKey()}>
                                <span></span>
                            </button>
                        </div>
                    </div>
                    <animated.div
                        style={{ ...containerProps, overflow: overflow.current }}
                        ref={containerRef}
                        className={pcn('__ref-key-container')}>
                        <SelectInput
                            className={pcn('__ref-key-input')}
                            classNamePrefix='spec'
                            value={rel?.target_table_name ? [rel.target_table_name, rel.target_column_name].join('.') : null}
                            options={refKeyOptions}
                            placeholder='reference_column'
                            isRequired={true}
                            updateFromAbove={true}
                            onChange={targetColPath => setForeignKeyRelationship(targetColPath)}
                            comps={{
                                SingleValue: renderColumnValueSingleValue,
                                Option: renderColumnValueOption,
                            }}
                        />
                    </animated.div>
                </div>
            </div>
        )
    }, [column, toggleIsForeignKey, setForeignKeyRelationship, refKeyOptions])

    const renderIsRequiredSection = useCallback(() => {
        const isRequired = column.is_nullable === false || column.isPrimaryKey
        const isDisabled = column.isPrimaryKey
        return (
            <div className={pcn('__section', '__section--required')}>
                <div className={pcn('__section-title')}>
                    <span
                        className={pcn('__section-icon', isRequired ? '__section-icon--bright' : '')}
                        dangerouslySetInnerHTML={{ __html: requiredIcon }}>
                    </span>
                    <span>Is Required?</span>
                </div>
                <div className={pcn('__section-body')}>
                    <div className={pcn('__qa')}>
                        <span>Is <span className='--code'>{column.name}</span> required to have a value?</span>
                        <div className={pcn('__section-toggle')}>
                            <button
                                className={cn(
                                    'toggle-button', 
                                    isRequired ? `toggle-button--true` : '',
                                    isDisabled ? `toggle-button--disabled` : ''
                                )}
                                onClick={isDisabled ? noop : toggleIsRequired}>
                                <span></span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }, [column, toggleIsRequired])

    const renderBody = useCallback(() => (
        <div className={pcn('__body')}>
            <div className={pcn('__body-liner')}>
                { renderPrimaryKeySection() }
                { renderForeignKeySection() }
                { renderIsRequiredSection() }
            </div>
        </div>
    ), [renderPrimaryKeySection, renderForeignKeySection, renderIsRequiredSection])

    const renderFooter= useCallback(() => (
        <div className={pcn('__footer')}>
            <div className={pcn('__footer-liner')}>
                <div
                    className={pcn('__footer-button', '__footer-button--shown')}
                    onClick={onClickCancel}>
                    <span>Cancel</span>
                </div>
                <button
                    className={pcn('__footer-button', '__footer-button--shown')}
                    onClick={onClickSave}>
                    <span>Save</span>
                </button>
            </div>
        </div>
    ), [onClickSave, onCancel])

    return (
        <div className={className}>
            { renderHeader() }
            { renderBody() }
            { renderFooter() }
        </div>
    )
}

EditColumnPanel = forwardRef(EditColumnPanel)
export default EditColumnPanel