import React, { useCallback, useState, useEffect, useMemo } from 'react'
import { getPCN, cn } from '../../../utils/classes'
import { helpIcon, checkIcon, keyIcon, triangleIcon, linkIcon } from '../../../svgs/icons'
import { noop } from '../../../utils/nodash'
import { camelToSnake } from '../../../utils/formatters'
import TextInput from '../inputs/TextInput'
import SelectInput from '../inputs/SelectInput'
import { colTypeIcon } from '../../../utils/colTypes'

const className = 'add-foreign-key-prompt'
const pcn = getPCN(className)

const fkOptions = [
    { name: 'On Filter Mapping' },
    { name: 'To Primary Key' },
    { name: 'Custom' }
]

const getInitialFkColName = (filterProperty, selectedFkOptionIndex, foreignTablePkColPath) => {
    switch (selectedFkOptionIndex) {
        case 0:
            return camelToSnake(filterProperty || '')
        case 1:
            const [_, table, col] = foreignTablePkColPath.split('.')
            const singularTableName = table.endsWith('s') ? table.slice(0, table.length - 1) : table
            return [singularTableName, col].join('_')
        case 2:
            return null
    }
}

const getInitialRefKeyColPath = (filterColPath, selectedFkOptionIndex, foreignTablePkColPath) => {
    switch (selectedFkOptionIndex) {
        case 0:
            return filterColPath
        case 1:
            return foreignTablePkColPath
        case 2:
            return null
    }
}

function AddForeignKeyPrompt(props) {
    const { 
        filterProperty,
        filterColPath,
        foreignTablePkColPath,
        foreignColOptions = [],
        onYes = noop, 
        onNo = noop,
    } = props
    const [added, setAdded] = useState(false)
    const [animateToAdded, setAnimateToAdded] = useState(false)
    const [selectedFkOptionIndex, setSelectedFkOptionIndex] = useState(0)
    const [fkColName, setFkColName] = useState(getInitialFkColName(
        filterProperty,
        selectedFkOptionIndex,
        foreignTablePkColPath,
    ))
    const [refKeyColPath, setRefKeyColPath] = useState(getInitialRefKeyColPath(
        filterColPath,
        selectedFkOptionIndex,
        foreignTablePkColPath,
    ))

    useEffect(() => {
        if (added && !animateToAdded) {
            setAnimateToAdded(true)
        }
    }, [added, animateToAdded])

    const onClickYes = useCallback(() => { 
        if (!fkColName || !refKeyColPath) return
        setAdded(true)
        onYes(fkColName, refKeyColPath)
    }, [onYes, fkColName, refKeyColPath])

    useEffect(() => {
        const newFkColName = getInitialFkColName(
            filterProperty, 
            selectedFkOptionIndex, 
            foreignTablePkColPath,
        )
        setFkColName(newFkColName)

        const newRefKeyColPath = getInitialRefKeyColPath(
            filterColPath,
            selectedFkOptionIndex,
            foreignTablePkColPath,    
        )
        setRefKeyColPath(newRefKeyColPath)
    }, [
        filterProperty,
        filterColPath,
        selectedFkOptionIndex,
        foreignTablePkColPath,
    ])
    
    const renderForeignKeyColumnTextInput = useCallback(() => {
        return (
            <TextInput
                className={pcn('__fk-col-name')}
                value={fkColName || ''}
                placeholder='column_name'
                isRequired={true}
                updateFromAbove={true}
                spellCheck={false}
                onChange={value => setFkColName(value)}
                renderAfter={() => (
                    <span
                        className={pcn('__fk-col-name-link-icon')}
                        dangerouslySetInnerHTML={{ __html: linkIcon }}>
                    </span>
                )}
            />
        )
    }, [fkColName])

    const renderRefKeyColInput = useCallback(() => (
        <SelectInput
            className={pcn('__ref-key-input')}
            classNamePrefix='spec'
            value={refKeyColPath}
            options={foreignColOptions}
            placeholder='reference_column'
            isRequired={true}
            updateFromAbove={true}
            onChange={value => setRefKeyColPath(value)}
        />
    ), [
        refKeyColPath,
        foreignColOptions,
    ])

    const renderFixedRefKey = useCallback(() => {
        const splitColPath = refKeyColPath?.split('.')
        return (
            <div className={pcn('__fixed-ref-key')}>
                <div className={pcn('__fixed-ref-key-col')}>
                    { splitColPath ? <span><span>{splitColPath[1]}</span>.<span>{splitColPath[2]}</span></span> : '' }
                </div>
            </div>
        )
    }, [selectedFkOptionIndex, refKeyColPath])

    const renderFkBody = useCallback(() => {
        const refKeyComp = selectedFkOptionIndex === 2 
            ? renderRefKeyColInput() 
            : renderFixedRefKey()

        return (
            <div className={pcn('__fk-body')}>
                <div className={pcn('__fk-body-liner')}>
                    { renderForeignKeyColumnTextInput() }
                    <div className={pcn('__ref-arrow')}>
                        <span>references</span>
                        <span
                            className={pcn('__ref-arrow-point')}
                            dangerouslySetInnerHTML={{ __html: triangleIcon}}>
                        </span>
                    </div>
                    { refKeyComp }
                </div>
            </div>
        )
    }, [
        selectedFkOptionIndex, 
        renderRefKeyColInput,
        renderFixedRefKey,
        renderForeignKeyColumnTextInput,
    ])

    const renderFkContainer = useCallback(() => {
        return (
            <div className={pcn('__fk-container')}>
                {/* <div className={pcn(
                    '__fk-header',
                    `__fk-header--index-${selectedFkOptionIndex}`,
                )}>
                    <div className={pcn('__fk-header-slider')}></div>
                    { fkOptions.map((tab, i) => (
                        <div
                            key={i}
                            className={pcn(
                                '__fk-header-tab', 
                                i === selectedFkOptionIndex ? '__fk-header-tab--selected' : '',
                            )}
                            onClick={i === selectedFkOptionIndex ? noop : () => setSelectedFkOptionIndex(i)}>
                            <span>{tab.name}</span>
                        </div>
                    ))}
                </div> */}
                { renderFkBody() }
            </div>
        )
    }, [selectedFkOptionIndex, renderFkBody])

    return (
        <div className={cn('prompt', className, `prompt--0`)}>
            <div className='prompt-liner'>
                <div className='prompt-main'>
                    <div className='prompt-main-top'>
                        <div
                            className='prompt-icon'
                            dangerouslySetInnerHTML={{ __html: helpIcon }}>
                        </div>
                        <div className='prompt-title'>
                            Create a foreign key?
                        </div>
                        <div className={pcn(
                            '__fk-header',
                            `__fk-header--index-${selectedFkOptionIndex}`,
                        )}>
                            <div className={pcn('__fk-header-slider')}></div>
                            { fkOptions.map((tab, i) => (
                                <div
                                    key={i}
                                    className={pcn(
                                        '__fk-header-tab', 
                                        i === selectedFkOptionIndex ? '__fk-header-tab--selected' : '',
                                    )}
                                    onClick={i === selectedFkOptionIndex ? noop : () => setSelectedFkOptionIndex(i)}>
                                    <span>{tab.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className='prompt-main-bottom'>
                        {/* <div className='prompt-subtitle'>
                            This is optional and won't affect filtering, but it could improve join-query performance.
                        </div> */}
                        { renderFkContainer() }
                        <div className='prompt-buttons-container'>
                            <div className={pcn('__buttons')}>
                                <div className={pcn('__button')} onClick={onNo}>
                                    <span>Not now</span>
                                </div>
                                <div
                                    className={pcn(
                                        '__button', 
                                        added ? `__button--added` : '',
                                        animateToAdded ? `__button--animate` : '',
                                    )}
                                    onClick={onClickYes}>
                                    <span>Add</span>
                                    <div dangerouslySetInnerHTML={{ __html: checkIcon }}>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AddForeignKeyPrompt