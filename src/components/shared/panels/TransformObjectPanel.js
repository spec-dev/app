import React, { useState, useCallback, useRef, forwardRef, useImperativeHandle, useEffect } from 'react'
import { getPCN } from '../../../utils/classes'
import LiveObjectSearch from './LiveObjectSearch'
import NewLiveColumnSpecs from './NewLiveColumnSpecs'
import { animated, useTransition } from 'react-spring'
import { noop } from '../../../utils/nodash'
import transformIcon from '../../../svgs/shuffle'
import tfCode from '../../../svgs/transform-code'
import checkIcon from '../../../svgs/check'
import githubIcon from '../../../svgs/github'
import examples from '../../../data/examples'
import { specs } from '../../../data/specs'
import spinner from '../../../svgs/chasing-tail-spinner'
import Editor from '@monaco-editor/react'
import styles from '../../../utils/styles'

const className = 'transform-object-panel'
const pcn = getPCN(className)

const nftAssetTemplate = `import { NFTAsset } from '@spec.types/nft-asset'

interface MyCustomType {
    collection: string
    contractAddress: string
    tokenId: number
    ownerAddress: string
    tokenURI: string
    chain: string
    standard: string
    metadata: {
        [key: string]: string
    }
}

async function transform(
    nftAsset: NFTAsset
): Promise<MyCustomType> {
    
}

export { transform, MyCustomType }`

const ensProfileTemplate = `import { ENSProfile } from '@spec.types/ens'

interface MyCustomType {
    address: string
    domain: string
    textRecords: {
        [key: string]: string
    }
}

async function transform(
    ensProfile: ENSProfile
): Promise<MyCustomType> {
    
}

export { transform, MyCustomType }`

const getInitialEditorValue = () => {
    switch (window.liveObjectSpec.name) {
        case 'NFTAsset':
            return nftAssetTemplate
        case 'ENS Profile': 
            return ensProfileTemplate
        default:
            return ''
    }
}

const getStartPosition = () => {
    switch (window.liveObjectSpec.name) {
        case 'NFTAsset':
            return {
                lineNumber: 19,
                column: 5,
            }
        case 'ENS Profile': 
            return {
                lineNumber: 14,
                column: 5,
            }
        default:
            return {
                lineNumber: 1,
                column: 1,
            }
    }
}

function TransformObjectPanel(props, ref) {
    const { onCancel = noop } = props
    const editorRef = useRef()
    const m = useRef()

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
        editor.setPosition(getStartPosition())
    }, [])

    useEffect(() => {
        setTimeout(() => editorRef.current?.focus(), 500)
    }, [])

    const renderHeader = useCallback(() => (
        <div className={pcn('__header')}>
            <div className={pcn('__header-liner')}>
                <div className={pcn('__header-title')}>
                    <span dangerouslySetInnerHTML={{ __html: transformIcon }}></span>
                    <span>Transform NFTAsset</span>
                </div>
            </div>
        </div>
    ), [])

    const renderSubheader = useCallback(() => (
        <div className={pcn('__subheader')}>
            <div className={pcn('__tf')}>
                // Transform NFTAsset into your own custom type.
            </div>
        </div>
    ))

    const renderEditor = useCallback(() => (
        <div className={pcn('__editor')}>
            <Editor
                theme={className}
                path='/transform.ts'
                language='typescript'
                value={getInitialEditorValue()}
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

TransformObjectPanel = forwardRef(TransformObjectPanel)
export default TransformObjectPanel