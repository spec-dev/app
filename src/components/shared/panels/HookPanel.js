import React, { useState, useCallback, useRef, forwardRef, useImperativeHandle, useEffect } from 'react'
import { getPCN } from '../../../utils/classes'
import LiveObjectSearch from './LiveObjectSearch'
import NewLiveColumnSpecs from './NewLiveColumnSpecs'
import { animated, useTransition } from 'react-spring'
import { noop } from '../../../utils/nodash'
import invokeIcon from '../../../svgs/invoke'
import tfCode from '../../../svgs/transform-code'
import checkIcon from '../../../svgs/check'
import SelectInput from '../inputs/SelectInput'
import githubIcon from '../../../svgs/github'
import examples from '../../../data/examples'
import { specs } from '../../../data/specs'
import spinner from '../../../svgs/chasing-tail-spinner'
import Editor from '@monaco-editor/react'
import styles from '../../../utils/styles'
import clockIcon from '../../../svgs/clock'

const className = 'hook-panel'
const pcn = getPCN(className)

const beforeInsertValue = `import { NFTAsset } from '@spec.types/nft-asset'

async function beforeInsert(nftAsset: NFTAsset) {
    
}

export default beforeInsert`

const beforeUpdateValue = `import { NFTAsset } from '@spec.types/nft-asset'

async function beforeUpdate(nftAsset: NFTAsset) {
    
}

export default beforeUpdate`

const beforeDeleteValue = `import { NFTAsset } from '@spec.types/nft-asset'

async function beforeDelete(nftAsset: NFTAsset) {
    
}

export default beforeDelete`

const afterInsertValue = `import { NFTAsset } from '@spec.types/nft-asset'
import { NFTAsset as NFTAssetRecord } from 'tables'

async function afterInsert(
    nftAsset: NFTAsset,
    record: NFTAssetRecord,
) {
    
}

export default afterInsert`

const afterUpdateValue = `import { NFTAsset } from '@spec.types/nft-asset'
import { NFTAsset as NFTAssetRecord } from 'tables'

async function afterUpdate(
    nftAsset: NFTAsset,
    record: NFTAssetRecord,
) {
    
}

export default afterUpdate`

const afterDeleteValue = `import { NFTAsset } from '@spec.types/nft-asset'
import { NFTAsset as NFTAssetRecord } from 'tables'

async function afterDelete(
    nftAsset: NFTAsset,
    record: NFTAssetRecord,
) {
    
}

export default afterDelete`

const orderedHooks = [
    {
        id: 'before-insert',
        name: 'Before Insert',
    },
    {
        id: 'after-insert',
        name: 'After Insert',
    },
    {
        id: 'before-update',
        name: 'Before Update',
    },
    {
        id: 'after-update',
        name: 'After Update',
    },
    {
        id: 'before-delete',
        name: 'Before Delete',
    },
    {
        id: 'after-delete',
        name: 'After Delete',
    },
]

const getBeforeInsert = () => {
    switch (window.liveObjectSpec?.name) {
        case 'ENS Profile':
            return `import { ENSProfile } from '@spec.types/ens'

async function beforeInsert(ensProfile: ENSProfile) {
    
}

export default beforeInsert`
        case 'NFTAsset':
            return `import { NFTAsset } from '@spec.types/nft-asset'

async function beforeInsert(nftAsset: NFTAsset) {
    
}

export default beforeInsert`
    }
}

const getTemplate = hookId => {
    switch (hookId) {
        case 'before-insert':
            return getBeforeInsert()
        case 'after-insert':
            return afterInsertValue
        case 'before-update':
            return beforeUpdateValue
        case 'after-update':
            return afterUpdateValue
        case 'before-delete':
            return beforeDeleteValue
        case 'after-delete':
            return afterDeleteValue
        default:
            return ''
    }
}

const hookOptions = orderedHooks.map(h => ({ value: h.id, label: h.name }))

const editorStartPosition = {
    lineNumber: 4,
    column: 5,
}

function HookPanel(props, ref) {
    const { onCancel = noop } = props
    const editorRef = useRef()
    const m = useRef()
    const [hook, setHook] = useState(orderedHooks[0])

    const onClickCancel = useCallback(() => {
        onCancel()
    }, [onCancel])

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
        setTimeout(() => editorRef.current?.focus(), 500)
    }, [])

    useEffect(() => {
        editorRef.current?.setValue(getTemplate(hook?.id))
    }, [hook.id])

    const renderHeader = useCallback(() => (
        <div className={pcn('__header')}>
            <div className={pcn('__header-liner')}>
                <div className={pcn('__header-title')}>
                    <span dangerouslySetInnerHTML={{ __html: invokeIcon }}></span>
                    <span>Hooks</span>
                </div>
            </div>
        </div>
    ), [])

    const renderSubheader = useCallback(() => (
        <div className={pcn('__subheader')}>
            <span dangerouslySetInnerHTML={{ __html: clockIcon }}></span>
            <SelectInput
                className={pcn('__hook-input')}
                classNamePrefix='spec'
                value={hook.id}
                options={hookOptions}
                placeholder='When should this function run?'
                isRequired={true}
                updateFromAbove={true}
                onChange={value => setHook(orderedHooks.find(h => h.id === value))}
            />
        </div>
    ), [hook])

    const renderEditor = useCallback(() => (
        <div className={pcn('__editor')}>
            <Editor
                theme={className}
                path='/hook.ts'
                language='typescript'
                value={getTemplate(hook?.id)}
                options={styles.editor.options(false, 1, false)}
                loading=''
                beforeMount={defineTheme}
                onMount={onMount}
            />
        </div>
    ), [defineTheme, onMount])

    const renderBody = useCallback(() => (
        <div className={pcn('__body')}>
            { renderEditor() }
        </div>
    ), [renderEditor])

    const renderFooter = useCallback(() => (
        <div className={pcn('__footer')}>
            <div className={pcn('__footer-liner')}>
                <div
                    className={pcn('__footer-button', '__footer-button--shown')}
                    onClick={onClickCancel}>
                    <span>Cancel</span>
                </div>
                <button
                    className={pcn('__footer-button', '__footer-button--shown')}
                    onClick={onClickCancel}>
                    <span>Save</span>
                </button>
            </div>
        </div>
    ), [onClickCancel])

    return (
        <div className={className}>
            { renderHeader() }
            { renderSubheader() }
            { renderBody() }
            { renderFooter() }
        </div>
    )
}

HookPanel = forwardRef(HookPanel)
export default HookPanel