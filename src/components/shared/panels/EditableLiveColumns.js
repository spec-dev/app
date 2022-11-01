import React, { useMemo, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import { getPCN } from '../../../utils/classes'
import TextInput from '../../shared/inputs/TextInput'
import SelectInput from '../../shared/inputs/SelectInput'
import { noop } from '../../../utils/nodash'
import { camelToSnake } from '../../../utils/formatters'
import gearIcon from '../../../svgs/gear-thin'
import closeIcon from '../../../svgs/close'
import transformIcon from '../../../svgs/transform'
import triangleIcon from '../../../svgs/triangle'

const className = 'editable-live-columns'
const pcn = getPCN(className)

function EditableLiveColumns(props, ref) {
    const { liveObjectVersion = {}, selectLiveColumnFormatter = noop } = props
    const dataSourceOptions = useMemo(() => (
        (liveObjectVersion.properties || []).map(p => ({ value: p.name, label: `.${p.name}` }))
    ), [liveObjectVersion])
    const [liveColumns, setLiveColumns] = useState(props.liveColumns || [{}])
    const manuallyChangedColName = useRef({})

    useImperativeHandle(ref, () => ({
        serialize: () => liveColumns
    }), [liveColumns])

    const setColData = useCallback((idx, key, value) => {
        const updatedNewCols = []

        let colData
        for (let i = 0; i < liveColumns.length; i++) {
            colData = liveColumns[i]
            if (i === idx) {
                colData[key] = value
            }
            updatedNewCols.push(colData)
        }

        if (key === 'columnName' && !manuallyChangedColName.current[idx]) {
            manuallyChangedColName.current[idx] = true
        }

        else if (key === 'dataSource' && !manuallyChangedColName.current[idx]) {
            const dataSource = liveObjectVersion.properties.find(p => p.name === value)
            if (dataSource && dataSource.type !== 'hash' && liveObjectVersion.name === 'ENS Profile') {
                updatedNewCols[idx].columnName = camelToSnake(value)
            }
        }

        else if (key === 'formatter' && value?.type === 'key-val' && !manuallyChangedColName.current[idx]) {
            updatedNewCols[idx].columnName = camelToSnake(value.config.key)
        }

        setLiveColumns(updatedNewCols)
    }, [liveColumns, liveObjectVersion])

    const addNewColumn = useCallback(() => {
        setLiveColumns(prevState => [ ...prevState, {}])
    }, [])

    const removeCol = useCallback((idx) => {
        const updatedNewCols = []
        for (let i = 0; i < liveColumns.length; i++) {
            if (i === idx) {
                continue
            }
            updatedNewCols.push(liveColumns[i])
        }
        setLiveColumns(updatedNewCols)

        // TODO: Do something to adjust manuallyChangedColName map
    }, [liveColumns])

    const customizeFormatter = useCallback((i, dataSource)=> {
        let property
        if (dataSource === liveObjectVersion.name) {
            property = {
                isLiveObject: true,
                type: 'hash',
                name: ''
            }
        } else {
            property = liveObjectVersion.properties.find(p => p.name === dataSource)
        }

        selectLiveColumnFormatter(liveObjectVersion, property, formatter => {
            setColData(i, 'formatter', formatter)
        })
    }, [selectLiveColumnFormatter, liveObjectVersion, setColData])

    const renderFormatter = useCallback(formatter => {
        switch (formatter?.type) {
            case 'key-val':
                return `.${formatter.config.key}`
            case 'custom-function':
                return liveObjectVersion.name === 'NFT' ? 'setName()' : 'Custom'
            case 'stringify':
                return 'Stringify'
            default:
                return 'None'
        }
    }, [])

    const renderColInputs = useCallback(() => liveColumns.map((col, i) => (
        <div key={i} className={pcn('__col-input')}>
            <SelectInput
                className={pcn(
                    '__col-input-field', 
                    '__col-input-field--data-source', 
                    !!col.dataSource ? '__col-input-field--has-value' : '',
                )}
                classNamePrefix='spec'
                value={col.dataSource}
                options={dataSourceOptions}
                placeholder='.property'
                isRequired={true}
                updateFromAbove={true}
                onChange={value => setColData(i, 'dataSource', value)}
            />
            <div className={pcn('__col-arrow', !!col.dataSource ? '__col-arrow--shown' : '')}>
                <div className={pcn('__col-arrow-line')}>
                    <span></span>
                    <span className={pcn('__col-arrow-point')} dangerouslySetInnerHTML={{ __html: triangleIcon }}></span>
                </div>
            </div>
            {/* <div
                className={pcn(
                    '__formatter',
                    '__formatter',
                    col.dataSource ? '' : '__formatter--disabled',
                    !!col.formatter ? '__formatter--exists' : '',
                    !!col.formatter?.type ? `__formatter--${col.formatter.type}` : ''
                )}
                onClick={ col.dataSource ? () => customizeFormatter(i, col.dataSource) : noop }
                >
                <div className={pcn('__formatter-button')}>
                    <span>+</span>
                </div>
                <span className={pcn('__formatter-icon')} dangerouslySetInnerHTML={{ __html: transformIcon }}></span>
            </div> */}
            <TextInput
                className={pcn('__col-input-field', '__col-input-field--col-name')}
                value={col.columnName || ''}
                placeholder='column_name'
                isRequired={true}
                updateFromAbove={true}
                spellCheck={false}
                onChange={value => setColData(i, 'columnName', value)}
            />
            <div
                className={pcn('__col-input-icon-button', '__col-input-icon-button--settings')}
                onClick={() => {}}
                dangerouslySetInnerHTML={{ __html: gearIcon }}>
            </div>
            <div
                className={pcn('__col-input-icon-button', '__col-input-icon-button--remove')}
                onClick={() => removeCol(i)}
                dangerouslySetInnerHTML={{ __html: closeIcon }}>
            </div>
        </div>
    )), [liveColumns, setColData, dataSourceOptions, customizeFormatter, renderFormatter, removeCol])

    return (
        <div className={className}>
            <div className={pcn('__liner')}>
                { liveColumns.length > 0 && 
                    <div className={pcn('__header')}>
                        <span>{liveObjectVersion.name} (Source)</span>
                        <span>Destination Column</span>
                    </div>
                }
                <div className={pcn('__col-inputs')}>
                    { renderColInputs() }
                </div>
                <div className={pcn('__action-buttons')}>
                    <button onClick={addNewColumn}>
                        <span>+</span>
                        <span>New Live Column</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

EditableLiveColumns = forwardRef(EditableLiveColumns)
export default EditableLiveColumns