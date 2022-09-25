import React, { useState, useCallback, useMemo, useRef, forwardRef, useImperativeHandle, useEffect } from 'react'
import { getPCN } from '../../../utils/classes'
import SelectInput from '../inputs/SelectInput'
import TextInput from '../inputs/TextInput'
import { noop } from '../../../utils/nodash'
import Editor from '@monaco-editor/react'
import styles from '../../../utils/styles'

const className = 'select-live-column-formatter-panel'
const pcn = getPCN(className)

const initialEditorValue = `// Your custom column type.
type ColType = string | null;

async function transform({{instanceName}}: {{typeName}}): Promise<ColType> {
    
}`
 
const editorStartPosition = {
    lineNumber: 5,
    column: 4,
}

const getFormatterTypeOptions = (propertyType) => {
    switch (propertyType) {
        case 'hash':
            return [
                { value: 'key-val', label: 'Get key value' },
                { value: 'stringify', label: 'Stringify' },
                { value: 'custom-function', label: 'Custom function' },
            ]
        default:
            return [
                { value: 'custom-function', label: 'Custom function' },
            ]
    }
}

const typeDefNameToInstanceName = typeDefName => {
    switch (typeDefName) {
        case 'ENSProfile':
            return 'ensProfile'
        case 'NFT':
            return 'nft'
        default:
            return typeDefName
    }
}

const getPropertyOverview = (state) => {
    const { liveObjectSpec, property } = state
    const typeDefName = liveObjectSpec.typeDef?.name

    switch (property.type) {
        case 'hash':
            return property.isLiveObject ? (
                <span><span className='comment'>{typeDefNameToInstanceName(typeDefName)}:</span>&nbsp;<span className='type'>{typeDefName}</span></span>
            ) : (
                <span><span className='comment'>{property.name}:</span>&nbsp;<span className='default'>{ '{ [key: '}</span><span className="type">string</span><span className="default">]: </span><span className="type">string</span><span className="default">{ ' }' }</span></span>
            )
        case 'string':
            return (
                <span><span className='comment'>{property.name}:</span>&nbsp;<span className='type'>string</span></span>
            )
        case 'number':
            return (
                <span><span className='comment'>{property.name}:</span>&nbsp;<span className='type'>number</span></span>
            )
        default:
            return <span></span>
    }
}

function SelectLiveColumnFormatterPanel(props, ref) {
    const { onDone = noop } = props
    const [state, setState] = useState({ liveObjectSpec: {}, property: {} })
    const [formatter, setFormatter] = useState({ type: null, config: null })
    const formatterTypeOptions = useMemo(() => getFormatterTypeOptions(state.property.type), [state.property.type])
    const onSelect = useRef()
    const editorRef = useRef()
    const keyInputRef = useRef()
    const m = useRef()

    useImperativeHandle(ref, () => ({
        configure: (liveObjectSpec, property, cb) => {
            onSelect.current = cb || noop
            if (property === state.property) return

            if (property.type === 'hash') {
                setFormatter(prevState => ({ ...prevState, type: 'key-val' }))                
            }
            setState(prevState => ({ ...prevState, liveObjectSpec, property }))

            setTimeout(() => {
                keyInputRef.current?.focus()
            }, 500)
        }
    }))

    const onClickSave = useCallback(() => {
        onSelect.current && onSelect.current(formatter)
        setTimeout(onDone, 10)
    }, [formatter, onDone])

    const defineTheme = useCallback(monaco => {
        m.current = monaco
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: true,
            noSyntaxValidation: true,
        });
        monaco.editor.defineTheme(className, styles.editor.theme)
    }, [])

    const onMount = useCallback(async (editor, monaco) => {
        editorRef.current = editor
        editor.setPosition(editorStartPosition)
    }, [])

    useEffect(() => {
        formatter.type === 'custom-function' && setTimeout(() => editorRef.current?.focus(), 50)
    }, [formatter])

    const renderHeader = useCallback(() => {
        return (
            <div className={pcn('__header')}>
                <div className={pcn('__header-liner')}>
                    <div className={pcn('__header-title')}>
                        <span>
                            <span>{state.liveObjectSpec.typeDef?.name}</span>
                            { state.property?.isLiveObject ? '' : '.' }
                            { !state.property?.isLiveObject && state.property.name }
                        </span>
                        <span>&mdash;</span>
                        <span>Add custom transform</span>
                    </div>
                </div>
            </div>
        )
    }, [state])

    const getInitialEditorValue = useCallback(() => {
        let typeName, instanceName

        if (state.property.isLiveObject) {
            typeName = state.liveObjectSpec.typeDef?.name
            instanceName = typeDefNameToInstanceName(typeName)
        } else {
            typeName = state.property.type === 'hash'
                ? '{ [key: string]: string }'
                : state.property.type
            instanceName = state.property.name
        }

        return initialEditorValue
            .replace('{{instanceName}}', instanceName)
            .replace('{{typeName}}', typeName)
    }, [state]) 

    const renderEditor = useCallback(() => (
        <div className={pcn('__editor')}>
            <Editor
                theme={className}
                path={`/${state.property.type || 'editor'}.ts`}
                language='typescript'
                value={getInitialEditorValue()}
                options={styles.editor.options(false, 1, false)}
                loading=''
                beforeMount={defineTheme}
                onMount={onMount}
            />
        </div>
    ), [getInitialEditorValue])

    const renderConfigInputs = useCallback(() => {
        switch (formatter.type) {
            case 'key-val':
                const instanceName = state.property.isLiveObject 
                    ? typeDefNameToInstanceName(state.liveObjectSpec.typeDef?.name)
                    : state.property.name
                return (
                    <div className={pcn('__key-val-config')}>
                        <TextInput
                            className={pcn('__input-field', '__input-field--key')}
                            value={formatter.config?.key || ''}
                            placeholder='key'
                            isRequired={true}
                            updateFromAbove={true}
                            spellCheck={false}
                            onChange={value => setFormatter(prevState => ({ ...prevState, config: { key: value } }))}
                            ref={keyInputRef}
                        />
                        <div className={pcn('__key-val-config-preview')}>
                            <span className='keyword'>return </span>
                            <span className='default'>{` ${instanceName}[` }</span>
                            <span className='string'>"{formatter.config?.key || ''}"</span>
                            <span className='default'>{']'}</span>
                        </div>
                    </div>
                )
            default:
                return null
        }
    }, [formatter, state.property])

    const renderBody = useCallback(() => (
        <div className={pcn('__body', `__body--formatter-${formatter.type}`)}>
            <div className={pcn('__body-liner')}>
                <span className={pcn('__property-overview')}>
                    { getPropertyOverview(state) }
                </span>
                <SelectInput
                    className={pcn('__input-field', '__input-field--formatter-type')}
                    classNamePrefix='spec'
                    value={formatter.type}
                    options={formatterTypeOptions}
                    placeholder='Select function'
                    isRequired={true}
                    updateFromAbove={true}
                    onChange={value => setFormatter(prevState => ({ ...prevState, type: value }))}
                />
                { renderConfigInputs() }
                { renderEditor() }
            </div>
        </div>
    ), [formatter, formatterTypeOptions, state.property, renderConfigInputs])

    const renderFooter= useCallback(() => (
        <div className={pcn('__footer')}>
            <div className={pcn('__footer-liner')}>
                <div
                    className={pcn('__footer-button', '__footer-button--shown')}
                    onClick={onDone}>
                    <span>Cancel</span>
                </div>
                <button
                    className={pcn('__footer-button', '__footer-button--shown')}
                    onClick={onClickSave}>
                    <span>Save</span>
                </button>
            </div>
        </div>
    ), [onClickSave, onDone])

    return (
        <div className={className}>
            { renderHeader() }
            { renderBody() }
            { renderFooter() }
        </div>
    )
}

SelectLiveColumnFormatterPanel = forwardRef(SelectLiveColumnFormatterPanel)
export default SelectLiveColumnFormatterPanel