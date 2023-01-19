import React, { useRef, useState, useImperativeHandle, forwardRef, useEffect, useCallback } from 'react'
import { cn, getPCN } from '../../../utils/classes'
import { noop } from '../../../utils/nodash'
import { nonEmptyStringWhenTrimmed, notNull } from '../../../utils/validators'
import styles from '../../../utils/styles'
import Editor from '@monaco-editor/react'

const className = 'code-input'
const pcn = getPCN(className)

function CodeInput(props, ref) {
    const {
        id = '',
        placeholder = '',
        onChange = noop,
        validator = nonEmptyStringWhenTrimmed,
        isRequired = false,
        updateFromAbove = false,
        validateWhenValueExists = false,
        onTab = noop,
    } = props
    const editorRef = useRef()
    const [data, setData] = useState({
        value: props.value,
        isValid: true,
    })

    const focus = useCallback(() => {
        if (!editorRef.current) return
        editorRef.current.focus()
        if (data.value === '""' || data.value === '[]') {
            editorRef.current.setPosition({ lineNumber: 1, column: 2 })
        } else if (data.value === '[""]') {
            editorRef.current.setPosition({ lineNumber: 1, column: 3 })
        }
    }, [data.value])

    useImperativeHandle(ref, () => ({
        focus: () => focus(),
        blur: () => editorRef.current?.blur(),
        getValue: () => data.value,
        validate,
    }), [data.value, focus])

    const validate = (updateState = true) => {
        const performValidation = () => {
            const isValid = validator( data.value )

            if ( updateState && isValid !== data.isValid ) {
                setData(prevState => ({ ...prevState, isValid }))
            }

            return isValid
        }

        // Always validate when required.
        if ( isRequired ) {
            return performValidation()
        }

        // If not required, but should be validated if a value exists,
        // then check if a value exists, and validate if so.
        if ( validateWhenValueExists ) {
            return notNull( data.value ) && data.value.toString() ? performValidation() : true
        }

        return true
    }

    const handleChange = useCallback(value => {
        value !== data.value && onChange(value)
    }, [onChange, data.value])

    const onMount = useCallback((editor, monaco) => {
        editorRef.current = editor
        focus()
        editor.onKeyDown(e => {
            if (e.keyCode == monaco.KeyCode.Enter) {
                if (editor.getContribution('editor.contrib.suggestController').model.state == 0) {
                    e.preventDefault()
                }
            }
            else if (e.keyCode == monaco.KeyCode.Tab) {
                if (editor.getContribution('editor.contrib.suggestController').model.state == 0) {
                    e.preventDefault()
                    document.activeElement?.blur()
                    onTab()
                }
            }
        })
        editor.onDidPaste(e => {
            if (e.range.endLineNumber > 1) {
                const model = editor.getModel()
                let newContent = ""
                let lineCount = model.getLineCount()
                for (let i = 0; i < lineCount; i++) {
                    newContent += model.getLineContent(i + 1)
                }
                handleChange(newContent)
            }
        })
    }, [handleChange, focus, onTab])

    useEffect(() => {
        if (!updateFromAbove) return
        if (props.value !== data.value) {
            setData(prevState => ({ ...prevState, value: props.value }))
        }
    }, [updateFromAbove, props.value, data.value])

    return (
        <div className={cn(
            className,
            !data.isValid ? `${className}--invalid` : '',
            props.className,
        )} onClick={() => editorRef.current?.focus()}>
            <Editor
                theme='spec'
                path={`/${id}.ts`}
                language='typescript'
                value={data.value}
                options={styles.editor.singleLineOptions()}
                loading=''
                onChange={val => handleChange(val)}
                onMount={onMount}
            />
            <span className={pcn('__ph')}>
                { data.value ? '' : placeholder }
            </span>
        </div>
    )
}

CodeInput = forwardRef(CodeInput)
export default CodeInput