const EDITOR_VPADDING = 21
const EDITOR_LINE_HEIGHT = 18
const EXTRA_PADDING_DUE_TO_FOLDING = 16
const SNIPPET_EDITOR_VOFFSET = 4
const VSTACKED_SNIPPET_OUTPUT_HEIGHT = 140

const styles = {
    spec: {
        sideBarWidth: 228,
        contentPaddingLeft: 80,
        contentPaddingRight: 84,
    },
    editor: {
        hPadding: 0,
        defaultSidebarWidth: 200,
        menuBarWidth: 0,
        minEditorWidth: 250,
        fileTreeIndentSize: 9,
        calculateHeight: (numLines, startLinesFolded, isStackedVertically) => (
            (2 * EDITOR_VPADDING) +
            (numLines * EDITOR_LINE_HEIGHT) +
            (2 * SNIPPET_EDITOR_VOFFSET) +
            (startLinesFolded ? EXTRA_PADDING_DUE_TO_FOLDING : 0) +
            (isStackedVertically ? VSTACKED_SNIPPET_OUTPUT_HEIGHT : 0)
        ),
        options: () => ({
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            scrollbar: {
                useShadows: false,
                verticalScrollbarSize: 0,
                horizontalScrollbarSize: 0,
            },
            renderLineHighlight: false,
            folding: false,
            selectOnLineNumbers: false,
            quickSuggestions: {
                other: false,
                comments: false,
                strings: false
            },
            parameterHints: {
                enabled: false
            },
            suggestOnTriggerCharacters: false,
            acceptSuggestionOnEnter: 'off',
            tabCompletion: 'off',
            wordBasedSuggestions: false,
        }),
        singleLineOptions: () => ({
            hPadding: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            scrollbar: {
                useShadows: false,
                verticalScrollbarSize: 0,
                horizontalScrollbarSize: 0,
            },
            fontSize: '11px',
            fontFamily: 'CodeRegular',
            lineNumbers: 'off',
            glyphMargin: false,
            folding: false,
            lineDecorationsWidth: 0,
            lineNumbersMinChars: 0,
            renderLineHighlight: false,
            folding: false,
            selectOnLineNumbers: false,
            quickSuggestions: {
                other: false,
                comments: false,
                strings: false
            },
            parameterHints: {
                enabled: false
            },
            matchBrackets: 'never',
            overviewRulerLanes: 0,
            overviewRulerBorder: false,
            suggestOnTriggerCharacters: false,
            acceptSuggestionOnEnter: 'off',
            tabCompletion: 'off',
            wordBasedSuggestions: false,
            scrollBeyondLastColumn: 0,
            hideCursorInOverviewRuler: true,
            find: {addExtraSpaceOnTop: false, autoFindInSelection: 'never', seedSearchStringFromSelection: false},
        }),
        theme: {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: '', foreground: 'FFFFFF', background: '1E1E1E' },
                { token: 'invalid', foreground: 'f44747' },

                { token: 'variable', foreground: 'FFFFFF' },
                { token: 'variable.predefined', foreground: '4864AA' },
                { token: 'variable.parameter', foreground: 'FFFFFF' },
                { token: 'constant', foreground: '6874FF' },
                { token: 'comment', foreground: '727A92' },
                { token: 'number', foreground: 'e9d9b1' },
                { token: 'number.hex', foreground: 'e9d9b1' },
                { token: 'regexp', foreground: 'B46695' },
                { token: 'annotation', foreground: 'cc6666' },
                { token: 'type', foreground: '00ded7' },

                { token: 'delimiter', foreground: 'DCDCDC' },
                { token: 'delimiter.html', foreground: '808080' },
                { token: 'delimiter.xml', foreground: '808080' },

                { token: 'tag', foreground: '6874FF' },
                { token: 'tag.id.jade', foreground: '4F76AC' },
                { token: 'tag.class.jade', foreground: '4F76AC' },
                { token: 'meta.scss', foreground: 'A79873' },
                { token: 'meta.tag', foreground: 'CE9178' },
                { token: 'meta.function.python', foreground: 'E064B1' },
                { token: 'metatag', foreground: 'DD6A6F' },
                { token: 'metatag.content.html', foreground: '9CDCFE' },
                { token: 'metatag.html', foreground: '6874FF' },
                { token: 'metatag.xml', foreground: '6874FF' },
                { token: 'metatag.php', fontStyle: 'bold' },

                { token: 'key', foreground: '9CDCFE' },
                { token: 'string.key.json', foreground: '0dcefd' },
                { token: 'string.value.json', foreground: '0dcefd' },

                { token: 'attribute.name', foreground: '9CDCFE' },
                { token: 'attribute.value', foreground: 'CE9178' },
                { token: 'attribute.value.number.css', foreground: 'e9d9b1' },
                { token: 'attribute.value.unit.css', foreground: 'e9d9b1' },
                { token: 'attribute.value.hex.css', foreground: 'EEEEEE' },

                { token: 'string', foreground: '0dcefd' },
                { token: 'string.sql', foreground: '0dcefd' },

                { token: 'keyword', foreground: '6874FF' },
                { token: 'keyword.flow', foreground: 'C586C0' },
                { token: 'keyword.json', foreground: 'CE9178' },
                { token: 'keyword.flow.scss', foreground: '6874FF' },
                { token: 'keyword.spec', foreground: 'e04ca8' },

                { token: 'operator.scss', foreground: '909090' },
                { token: 'operator.sql', foreground: '778899' },
                { token: 'operator.swift', foreground: '909090' },
                { token: 'predefined.sql', foreground: 'FF00FF' },
            ],
            colors: {
                'editor.background': '#00000000',
                'editor.foreground': '#00000000',
                'editor.inactiveSelectionBackground': '#00000000',
                'editorIndentGuide.background': '#8193B235',
                'editor.selectionHighlightBackground': '#ADD6FF4D',
                'editorLineNumber.foreground': '#818690',
                'editorLineNumber.activeForeground': '#dbdcde',
                'editor.lineHighlightBackground': '#00000000',
                'editor.lineHighlightBorder': '#FFFFFF08',
                'editorSuggestWidget.foreground': '#000000',
                'editorSuggestWidget.selectedBackground': '#87abef25',
                'editorSuggestWidget.highlightForeground': '#00D4FF',
                'list.highlightForeground': '#00D4FF',
                'scrollbar.shadow': '#00000050',
                'scrollbarSlider.background': '#00000000',
                'scrollbarSlider.hoverBackground': '#FFFFFF14',
                'scrollbarSlider.activeBackground': '#FFFFFF20',
            },
        },
    },
    snippet: {
        loadingHeight: 180,
        maxHeight: isStackedVertically => 590 + (isStackedVertically ? VSTACKED_SNIPPET_OUTPUT_HEIGHT : 0),
        verticallyStackedOutputHeight: VSTACKED_SNIPPET_OUTPUT_HEIGHT,
    },
    preview: {
        keystrokeDelay: 30,
    },
}

export default styles
