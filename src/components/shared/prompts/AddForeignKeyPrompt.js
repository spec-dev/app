import React, { useCallback, useState, useEffect, useMemo } from 'react'
import { getPCN, cn } from '../../../utils/classes'
import { helpIcon, checkIcon, closeIcon, openArrowIcon } from '../../../svgs/icons'
import { noop } from '../../../utils/nodash'
import { camelToSnake } from '../../../utils/formatters'
import { TextInput } from 'ui'
import { SelectInput } from 'ui'
import spinner from '../../../svgs/chasing-tail-spinner'

const className = 'add-foreign-key-prompt'
const pcn = getPCN(className)

const fkOptions = [
    { name: 'On Filter Mapping' },
    { name: 'To Primary Key' },
    { name: 'Custom' }
]

const getInitialFkColName = (
    filterProperty,
    filterColPath,
    foreignTablePkColPath,
    refKeyOptions,
) => {
    if (refKeyOptions.includes(filterColPath)) {
        return camelToSnake(filterProperty || '')
    }

    if (refKeyOptions.includes(foreignTablePkColPath)) {
        const [_, table, col] = foreignTablePkColPath.split('.')
        const singularTableName = table.endsWith('s') ? table.slice(0, table.length - 1) : table
        return [singularTableName, col].join('_')
    }
    
    return refKeyOptions[0]
}

const getInitialRefKeyColPath = (
    filterColPath,
    foreignTablePkColPath,
    refKeyOptions,
) => {
    if (refKeyOptions.includes(filterColPath)) {
        return filterColPath
    }

    if (refKeyOptions.includes(foreignTablePkColPath)) {
        return foreignTablePkColPath
    }
    
    return refKeyOptions[0]
}

function AddForeignKeyPrompt(props) {
    const { 
        filterProperty,
        filterColPath,
        foreignTablePkColPath,
        refKeyOptions = [],
        onYes = noop, 
        onNo = noop,
    } = props
    const [added, setAdded] = useState(false)
    const [animateToAdded, setAnimateToAdded] = useState(false)
    const refKeySelectOptions = useMemo(() => refKeyOptions.map(colPath => {
        const [_, table, col] = colPath.split('.')
        return { value: colPath, label: [table, col].join('.') }
    }), [refKeyOptions])
    const selectInputWidth = useMemo(() => {
        const maxLength = Math.max(...refKeySelectOptions.map(opt => opt.label.length))
        return 44 + maxLength * 7
    }, [refKeySelectOptions])

    const [fkColName, setFkColName] = useState(getInitialFkColName(
        filterProperty,
        filterColPath,
        foreignTablePkColPath,
        refKeyOptions,
    ))

    const [refKeyColPath, setRefKeyColPath] = useState(getInitialRefKeyColPath(
        filterColPath,
        foreignTablePkColPath,
        refKeyOptions,
    ))

    useEffect(() => {
        if (added && !animateToAdded) {
            setTimeout(() => {
                setAnimateToAdded(true)
                onYes(fkColName, refKeyColPath)
            }, 700)
        }
    }, [added, animateToAdded, fkColName, refKeyColPath])

    const onClickYes = useCallback(() => { 
        if (!fkColName || !refKeyColPath) return
        setAdded(true)
    }, [onYes])

    useEffect(() => {
        if (refKeyColPath === filterColPath) {
            setFkColName(camelToSnake(filterProperty))
        } else if (refKeyColPath === foreignTablePkColPath) {
            const [_, table, col] = foreignTablePkColPath.split('.')
            const singularTableName = table.endsWith('s') ? table.slice(0, table.length - 1) : table
            setFkColName([singularTableName, col].join('_'))
        } else {
            setFkColName('')
        }
    }, [refKeyColPath, filterColPath])
    
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
                autoWidth={value => 24 + value.length * 7}
            />
        )
    }, [fkColName])

    const renderRefKeyColInput = useCallback(() => (
        <SelectInput
            className={pcn('__ref-key-input')}
            classNamePrefix='spec'
            value={refKeyColPath}
            options={refKeySelectOptions}
            placeholder='reference_column'
            isRequired={true}
            updateFromAbove={true}
            style={{ width: selectInputWidth }}
            onChange={value => setRefKeyColPath(value)}
        />
    ), [
        refKeyColPath,
        refKeySelectOptions,
        selectInputWidth,
    ])

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
                            Add a foreign key reference to <pre>{filterColPath.split('.')[1]}</pre>?
                        </div>
                    </div>
                    <div className='prompt-main-bottom'>
                        <div className={'prompt-subtitle'}>
                            This is completely optional and won't affect filtering.
                        </div>
                        <div className={pcn('__fk-body')}>
                            <div className={pcn('__fk-body-liner')}>
                                { renderForeignKeyColumnTextInput() }
                                <span dangerouslySetInnerHTML={{ __html: openArrowIcon }}></span>
                                { renderRefKeyColInput() }
                            </div>
                        </div>
                    </div>
                </div>
                <div className='prompt-buttons-container'>
                    <div className={pcn('__buttons')}>
                        <div className={pcn('__button')} onClick={onNo}>
                            <span dangerouslySetInnerHTML={{ __html: closeIcon }}></span>
                        </div>
                        <div
                            className={pcn(
                                '__button', 
                                '__button--yes',
                                added ? `__button--added` : '',
                                animateToAdded ? `__button--animate` : '',
                            )}
                            onClick={onClickYes}>
                            <div dangerouslySetInnerHTML={{ __html: checkIcon }}>
                            </div>
                            <span className='svg-spinner svg-spinner--chasing-tail' dangerouslySetInnerHTML={{ __html: spinner }}></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AddForeignKeyPrompt