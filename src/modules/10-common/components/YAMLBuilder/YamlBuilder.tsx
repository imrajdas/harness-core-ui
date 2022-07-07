/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState, useRef, ReactElement, useCallback } from 'react'
import type { MonacoEditorProps } from 'react-monaco-editor'
//@ts-ignore
import ReactMonacoEditor from 'react-monaco-editor'
import MonacoEditor from '@common/components/MonacoEditor/MonacoEditor'
import '@wings-software/monaco-yaml/lib/esm/monaco.contribution'
import { IKeyboardEvent, languages } from 'monaco-editor/esm/vs/editor/editor.api'
import type { editor } from 'monaco-editor/esm/vs/editor/editor.api'
import { debounce, isEmpty, truncate, throttle, defaultTo, attempt, every, isEqualWith, isNil } from 'lodash-es'
import { useToaster } from '@common/exports'
import { useParams } from 'react-router-dom'
import SplitPane from 'react-split-pane'
import { Intent, Popover, PopoverInteractionKind, Position } from '@blueprintjs/core'
import { useStrings } from 'framework/strings'
import cx from 'classnames'
import { scalarOptions, defaultOptions } from 'yaml'
import { Tag, Icon, Container, useConfirmationDialog } from '@wings-software/uicore'
import type {
  YamlBuilderProps,
  YamlBuilderHandlerBinding,
  CompletionItemInterface,
  Theme
} from '@common/interfaces/YAMLBuilderProps'
import SnippetSection from '@common/components/SnippetSection/SnippetSection'
import { getSchemaWithLanguageSettings } from '@common/utils/YamlUtils'
import { sanitize } from '@common/utils/JSONUtils'
import { getYAMLFromEditor, getMetaDataForKeyboardEventProcessing, verifyYAML } from './YAMLBuilderUtils'

import css from './YamlBuilder.module.scss'
import './resizer.scss'
import {
  DEFAULT_EDITOR_HEIGHT,
  EditorTheme,
  EDITOR_BASE_DARK_THEME,
  EDITOR_BASE_LIGHT_THEME,
  EDITOR_DARK_BG,
  EDITOR_DARK_FG,
  EDITOR_DARK_SELECTION,
  EDITOR_LIGHT_BG,
  EDITOR_WHITESPACE,
  MIN_SNIPPET_SECTION_WIDTH,
  TRIGGER_CHARS_FOR_NEW_EXPR,
  TRIGGER_CHAR_FOR_PARTIAL_EXPR,
  KEY_CODE_FOR_PLUS_SIGN,
  ANGULAR_BRACKET_CHAR,
  KEY_CODE_FOR_SEMI_COLON,
  KEY_CODE_FOR_PERIOD,
  KEY_CODE_FOR_SPACE,
  KEY_CODE_FOR_CHAR_Z,
  MAX_ERR_MSSG_LENGTH,
  CONTROL_EVENT_KEY_CODE,
  META_EVENT_KEY_CODE,
  KEY_CODE_FOR_CHAR_V,
  KEY_CODE_FOR_CHAR_C
} from './YAMLBuilderConstants'
import CopyToClipboard from '../CopyToClipBoard/CopyToClipBoard'
import { yamlStringify } from '@common/utils/YamlHelperMethods'

// Please do not remove this, read this https://eemeli.org/yaml/#scalar-options
scalarOptions.str.fold.lineWidth = 100000
defaultOptions.indent = 4

const getTheme = (theme: Theme) => (theme === 'DARK' ? EDITOR_BASE_DARK_THEME : EDITOR_BASE_LIGHT_THEME)

const setUpEditor = (theme: Theme): void => {
  //@ts-ignore
  monaco.editor.defineTheme(getTheme(theme), {
    base: getTheme(theme),
    inherit: theme === 'DARK',
    rules: theme === 'DARK' ? EditorTheme.DARK : EditorTheme.LIGHT,
    colors:
      theme === 'DARK'
        ? {
            'editor.background': `#${EDITOR_DARK_BG}`,
            'editor.foreground': `#${EDITOR_DARK_FG}`,
            'editor.selectionBackground': `#${EDITOR_DARK_SELECTION}`,

            'editor.lineHighlightBackground': `#${EDITOR_DARK_SELECTION}`,
            'editorCursor.foreground': `#${EDITOR_DARK_FG}`,
            'editorWhitespace.foreground': `#${EDITOR_WHITESPACE}`
          }
        : { 'editor.background': `#${EDITOR_LIGHT_BG}` }
  })
  //@ts-ignore
  monaco.editor.setTheme(getTheme(theme))
}

const YAMLBuilder: React.FC<YamlBuilderProps> = (props: YamlBuilderProps): JSX.Element => {
  const {
    height,
    width,
    fileName,
    entityType,
    existingJSON,
    existingYaml,
    isReadOnlyMode,
    isEditModeSupported = true,
    isHarnessManaged = false,
    hideErrorMesageOnReadOnlyMode = false,
    showSnippetSection = true,
    invocationMap,
    bind,
    showIconMenu = false,
    onExpressionTrigger,
    snippets,
    onSnippetCopy,
    snippetFetchResponse,
    schema,
    onEnableEditMode,
    theme = 'LIGHT',
    yamlSanityConfig,
    onChange,
    onErrorCallback,
    renderCustomHeader
  } = props
  setUpEditor(theme)
  const params = useParams()
  const [currentYaml, setCurrentYaml] = useState<string>(defaultTo(existingYaml, ''))
  const [currentJSON, setCurrentJSON] = useState<object>()
  const [initialSelectionRemoved, setInitialSelectionRemoved] = useState<boolean>(
    !defaultTo(existingYaml, existingJSON)
  )
  const [yamlValidationErrors, setYamlValidationErrors] = useState<Map<number, string> | undefined>()
  const { innerWidth } = window
  const [dynamicWidth, setDynamicWidth] = useState<number>(innerWidth - 2 * MIN_SNIPPET_SECTION_WIDTH)

  const editorRef = useRef<ReactMonacoEditor>(null)
  const yamlRef = useRef<string | undefined>('')
  const yamlValidationErrorsRef = useRef<Map<number, string>>()
  yamlValidationErrorsRef.current = yamlValidationErrors
  const editorVersionRef = useRef<number>()

  let expressionCompletionDisposer: { dispose: () => void }
  let runTimeCompletionDisposer: { dispose: () => void }

  const { showError } = useToaster()
  const { getString } = useStrings()

  const yamlError = getString('yamlBuilder.yamlError')

  const handler = React.useMemo(
    () =>
      ({
        getLatestYaml: () => yamlRef.current,
        setLatestYaml: (json: Record<string, any>) => {
          attempt(verifyIncomingJSON, json)
          setCurrentJSON(json)
        },
        getYAMLValidationErrorMap: () => yamlValidationErrorsRef.current
      } as YamlBuilderHandlerBinding),
    []
  )

  useEffect(() => {
    bind?.(handler)
  }, [bind, handler])

  useEffect(() => {
    setDynamicWidth(width as number)
  }, [width])

  const handleResize = (newSize: number): void => {
    setDynamicWidth(newSize)
  }

  const getEditorCurrentVersion = (): number | undefined => {
    return editorRef.current?.editor?.getModel()?.getAlternativeVersionId()
  }

  const verifyIncomingJSON = (jsonObj?: Record<string, any>): void => {
    const sanitizedJSONObj = jsonObj ? sanitize(jsonObj, yamlSanityConfig) : null
    if (sanitizedJSONObj && Object.keys(sanitizedJSONObj).length > 0) {
      const yamlEqOfJSON = yamlStringify(sanitizedJSONObj)
      const sanitizedYAML = yamlEqOfJSON.replace(': null\n', ': \n')
      setCurrentYaml(sanitizedYAML)
      yamlRef.current = sanitizedYAML
      verifyYAML({
        updatedYaml: sanitizedYAML,
        setYamlValidationErrors,
        showError,
        schema,
        errorMessage: yamlError
      })
    } else {
      setCurrentYaml('')
      yamlRef.current = ''
      setYamlValidationErrors(undefined)
    }
  }

  /* #region Bootstrap editor with schema */

  useEffect(() => {
    //for optimization, restrict setting value to editor if previous and current json inputs are the same.
    //except when editor is reset/cleared, by setting empty json object as input
    if (
      every([existingJSON, isEmpty(existingJSON), isEmpty(currentJSON)]) ||
      JSON.stringify(existingJSON) !== JSON.stringify(currentJSON)
    ) {
      attempt(verifyIncomingJSON, existingJSON)
      setCurrentJSON(existingJSON)
    }
  }, [existingJSON])

  useEffect(() => {
    if (existingYaml) {
      setCurrentYaml(existingYaml)
      yamlRef.current = existingYaml
      verifyYAML({
        updatedYaml: existingYaml,
        setYamlValidationErrors,
        showError,
        schema,
        errorMessage: yamlError
      })
    }
  }, [existingYaml, schema])

  useEffect(() => {
    if (schema) {
      const languageSettings = getSchemaWithLanguageSettings(schema)
      setUpYAMLBuilderWithLanguageSettings(languageSettings)
    }
  }, [schema])

  const setUpYAMLBuilderWithLanguageSettings = (languageSettings: string | Record<string, any>): void => {
    //@ts-ignore
    const { yaml } = defaultTo(languages, {})
    yaml?.yamlDefaults.setDiagnosticsOptions(languageSettings)
  }

  /* #endregion */

  /* #region Handle various interactions with the editor */

  const onYamlChange = useCallback(
    debounce((updatedYaml: string): void => {
      setCurrentYaml(updatedYaml)
      yamlRef.current = updatedYaml
      verifyYAML({
        updatedYaml,
        setYamlValidationErrors,
        showError,
        schema,
        errorMessage: yamlError
      })
      onChange?.(!(updatedYaml === ''))
    }, 500),
    [setYamlValidationErrors, showError, schema, yamlError, setCurrentYaml, onChange]
  )

  const showNoPermissionError = useCallback(
    throttle(() => {
      showError(getString('noPermission'), 5000)
    }, 5000),
    []
  )

  const showHarnessManagedError = useCallback(
    throttle(() => {
      showError(getString('common.showHarnessManagedError'), 5000)
    }, 5000),
    []
  )

  const editorDidMount = (editor: editor.IStandaloneCodeEditor): void => {
    // editor.addAction({
    //   id: 'Paste',
    //   label: getString('common.paste'),
    //   keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_V],
    //   contextMenuGroupId: '9_cutcopypaste',
    //   run: async (editor: editor.IStandaloneCodeEditor) => {
    //     try {
    //       const response = await navigator?.clipboard?.readText()
    //       const line = editor.getPosition()
    //       editor.executeEdits('', [
    //         {
    //           range: new monaco.Range(line?.lineNumber, line?.column, line?.lineNumber, line?.column),
    //           text: response ?? ''
    //         }
    //       ])
    //     } catch (e) {
    //       showError(e)
    //     }
    //   }
    // })
    editorVersionRef.current = editor.getModel()?.getAlternativeVersionId()
    if (!props.isReadOnlyMode) {
      editor?.focus()
    }
    editor.onKeyDown((event: IKeyboardEvent) => handleEditorKeyDownEvent(event, editor))
  }

  const disposePreviousSuggestions = (): void => {
    if (expressionCompletionDisposer) {
      expressionCompletionDisposer.dispose()
    }
    if (runTimeCompletionDisposer) {
      runTimeCompletionDisposer.dispose()
    }
  }

  /* #endregion */

  /* #region Custom invocations */

  /** Expressions support */
  const getEditorContentInCurrentLine = (editor: editor.IStandaloneCodeEditor): string | undefined => {
    const currentLineNum = editor.getPosition()?.lineNumber
    if (currentLineNum) {
      return editor.getModel()?.getLineContent(currentLineNum)
    }
  }

  const getExpressionFromCurrentLine = (editor: editor.IStandaloneCodeEditor): string | undefined => {
    const expression = getEditorContentInCurrentLine(editor)
      ?.split(':')
      .map((item: string) => item.trim())?.[1]
    return expression
  }

  function registerCompletionItemProviderForExpressions(
    editor: editor.IStandaloneCodeEditor,
    triggerCharacters: string[],
    matchingPath: string | undefined,
    currentExpression: string | undefined = ''
  ): void {
    if (editor && matchingPath) {
      const suggestionsPromise = onExpressionTrigger ? onExpressionTrigger(matchingPath, currentExpression) : null
      if (suggestionsPromise) {
        suggestionsPromise.then(suggestions => {
          // @ts-ignore
          expressionCompletionDisposer = monaco?.languages?.registerCompletionItemProvider('yaml', {
            triggerCharacters,
            provideCompletionItems: () => {
              return { suggestions }
            }
          })
        })
      }
    }
  }

  /** Run-time Inputs support */
  function registerCompletionItemProviderForRTInputs(
    editor: editor.IStandaloneCodeEditor,
    suggestionsPromise: Promise<CompletionItemInterface[]>
  ): void {
    if (editor) {
      suggestionsPromise.then(suggestions => {
        // @ts-ignore
        runTimeCompletionDisposer = monaco?.languages?.registerCompletionItemProvider('yaml', {
          triggerCharacters: [' '],
          provideCompletionItems: () => {
            return { suggestions }
          }
        })
      })
    }
  }

  const invokeCallBackForMatchingYAMLPaths = (
    editor: editor.IStandaloneCodeEditor,
    matchingPath: string | undefined
  ): void => {
    if (editor && matchingPath) {
      invocationMap?.forEach((callBackFunc, yamlPath) => {
        if (matchingPath.match(yamlPath) && typeof callBackFunc === 'function') {
          const yamlFromEditor = getYAMLFromEditor(editor, true) as string
          const suggestionsPromise = callBackFunc(matchingPath, yamlFromEditor, params)
          registerCompletionItemProviderForRTInputs(editor, suggestionsPromise)
        }
      })
    }
  }

  const shouldInvokeExpressions = (editor: editor.IStandaloneCodeEditor, event: IKeyboardEvent): boolean => {
    const lastKeyStrokeCharacter = getEditorContentInCurrentLine(editor)?.substr(-1)
    const { shiftKey, code } = event
    return lastKeyStrokeCharacter === ANGULAR_BRACKET_CHAR && shiftKey && code === KEY_CODE_FOR_PLUS_SIGN
  }

  /* #endregion */

  const { openDialog } = useConfirmationDialog({
    contentText: getString('yamlBuilder.enableEditContext'),
    titleText: getString('confirm'),
    confirmButtonText: getString('enable'),
    cancelButtonText: getString('cancel'),
    intent: Intent.WARNING,
    onCloseDialog: async didConfirm => {
      if (didConfirm) {
        onEnableEditMode?.()
      }
    }
  })

  const handleEditorKeyDownEvent = (event: IKeyboardEvent, editor: any): void => {
    if (isHarnessManaged) {
      showHarnessManagedError()
    } else if (props.isReadOnlyMode && isEditModeSupported) {
      const { keyCode, code, ctrlKey, metaKey } = event
      const isMetaOrControlKeyPressed = [CONTROL_EVENT_KEY_CODE, META_EVENT_KEY_CODE].includes(keyCode)
      const isMetaOrControlKeyPressedForCopyPaste =
        (ctrlKey || metaKey) && [KEY_CODE_FOR_CHAR_V, KEY_CODE_FOR_CHAR_C].includes(code)
      if (!(isMetaOrControlKeyPressed || isMetaOrControlKeyPressedForCopyPaste)) {
        // this is to avoid showing warning dialog if user just wants to copy paste
        openDialog()
      }
    } else if (props.isReadOnlyMode && !isEditModeSupported && !hideErrorMesageOnReadOnlyMode) {
      showNoPermissionError()
    }
    try {
      const { shiftKey, code, ctrlKey, metaKey } = event
      //TODO Need to check hotkey for cross browser/cross OS compatibility

      // this is to prevent reset of the editor to empty when there is no undo history
      if ((ctrlKey || metaKey) && code === KEY_CODE_FOR_CHAR_Z) {
        if (editorVersionRef.current && editorVersionRef.current + 1 === getEditorCurrentVersion()) {
          event.stopPropagation()
          event.preventDefault()
        }
      }
      if (ctrlKey && code === KEY_CODE_FOR_SPACE) {
        disposePreviousSuggestions()
      }

      // dispose expressionCompletion if (+) sign is not preceding with (<)
      if (code === KEY_CODE_FOR_PLUS_SIGN) {
        const lastKeyStrokeCharacter = getEditorContentInCurrentLine(editor)?.substr(-1)
        if (lastKeyStrokeCharacter !== ANGULAR_BRACKET_CHAR) {
          expressionCompletionDisposer?.dispose()
        }
      }

      if (shiftKey) {
        // this is to invoke expressions callback
        if (shouldInvokeExpressions(editor, event)) {
          const yamlPath = getMetaDataForKeyboardEventProcessing({
            editor,
            onErrorCallback
          })?.parentToCurrentPropertyPath
          disposePreviousSuggestions()
          registerCompletionItemProviderForExpressions(editor, TRIGGER_CHARS_FOR_NEW_EXPR, yamlPath)
        }
        // this is to invoke run-time inputs as suggestions
        else if (code === KEY_CODE_FOR_SEMI_COLON && invocationMap && invocationMap.size > 0) {
          const yamlPath = getMetaDataForKeyboardEventProcessing({
            editor,
            onErrorCallback,
            shouldAddPlaceholder: true
          })?.parentToCurrentPropertyPath
          disposePreviousSuggestions()
          invokeCallBackForMatchingYAMLPaths(editor, yamlPath)
        }
      }
      // this is to invoke partial expressions callback e.g. invoke expressions callback on hitting a period(.) after an expression: expr1.expr2. <-
      if (code === KEY_CODE_FOR_PERIOD) {
        const yamlPath = getMetaDataForKeyboardEventProcessing({ editor, onErrorCallback })?.parentToCurrentPropertyPath
        disposePreviousSuggestions()
        registerCompletionItemProviderForExpressions(
          editor,
          [TRIGGER_CHAR_FOR_PARTIAL_EXPR],
          yamlPath,
          getExpressionFromCurrentLine(editor)
        )
      }
    } catch (err) {
      showError(yamlError)
    }
  }

  const getErrorSummary = (errorMap?: Map<number, string>): React.ReactElement => {
    const errors: React.ReactElement[] = []
    errorMap?.forEach((value, key) => {
      const error = (
        <li className={css.item} title={value} key={key}>
          {getString('yamlBuilder.lineNumberLabel')}&nbsp;
          {key + 1},&nbsp;
          {truncate(value, { length: MAX_ERR_MSSG_LENGTH })}
        </li>
      )
      errors.push(error)
    })
    return (
      <div className={css.errorSummary}>
        <ol className={css.errorList}>{errors}</ol>
      </div>
    )
  }

  const renderSnippetSection = (): ReactElement => {
    return (
      <SnippetSection
        showIconMenu={showIconMenu}
        entityType={entityType}
        snippets={snippets}
        onSnippetCopy={onSnippetCopy}
        snippetFetchResponse={snippetFetchResponse}
      />
    )
  }

  const renderHeader = useCallback(
    (): JSX.Element => (
      <div className={cx(css.header)}>
        <div className={css.flexCenter}>
          <span className={cx(css.filePath, css.flexCenter, { [css.lightBg]: theme === 'DARK' })}>{fileName}</span>
          {fileName && entityType ? <Tag className={css.entityTag}>{entityType}</Tag> : null}
          {yamlRef.current ? (
            <Container padding={{ left: 'medium' }}>
              <CopyToClipboard content={defaultTo(yamlRef.current, '')} showFeedback={true} />
            </Container>
          ) : null}
        </div>
        <div className={cx(css.flexCenter, css.validationStatus)}>
          {yamlValidationErrors && yamlValidationErrors.size > 0 ? (
            <Popover
              interactionKind={PopoverInteractionKind.HOVER}
              position={Position.TOP}
              content={getErrorSummary(yamlValidationErrors)}
              popoverClassName={css.summaryPopover}
            >
              <div>
                <Icon name="main-issue-filled" size={14} className={css.validationIcon} />
                <span className={css.invalidYaml}>{getString('invalidText')}</span>
              </div>
            </Popover>
          ) : null}
        </div>
      </div>
    ),
    [yamlValidationErrors, fileName, entityType, theme]
  )

  // used to remove initial selection that appears when yaml builder is loaded with an initial value
  useEffect(() => {
    if (every([!initialSelectionRemoved, editorRef.current?.editor?.getValue()])) {
      editorRef.current?.editor?.setSelection(new monaco.Range(0, 0, 0, 0))
      setInitialSelectionRemoved(true)
    }
  }, [currentYaml])

  const renderEditor = useCallback(
    (): JSX.Element => (
      <MonacoEditor
        width={dynamicWidth}
        height={defaultTo(height, DEFAULT_EDITOR_HEIGHT)}
        language="yaml"
        value={currentYaml}
        onChange={onYamlChange}
        editorDidMount={editorDidMount}
        options={
          {
            readOnly: defaultTo(isReadOnlyMode, !isEditModeSupported),
            wordBasedSuggestions: false,
            fontFamily: "'Roboto Mono', monospace",
            fontSize: 13,
            minimap: {
              enabled: false
            }
          } as MonacoEditorProps['options']
        }
        ref={editorRef}
      />
    ),
    [dynamicWidth, height, currentYaml, onYamlChange]
  )

  const throttledOnResize = throttle(() => {
    editorRef.current?.editor?.layout()
  }, 500)

  useEffect(() => {
    window.addEventListener('resize', throttledOnResize)
    return () => {
      window.removeEventListener('resize', throttledOnResize)
      disposePreviousSuggestions()
    }
  }, [])

  return (
    <div className={cx(css.main, { [css.darkBg]: theme === 'DARK' })}>
      {showSnippetSection ? (
        <SplitPane
          split="vertical"
          className={css.splitPanel}
          onChange={handleResize}
          maxSize={-1 * MIN_SNIPPET_SECTION_WIDTH}
          style={{ height: defaultTo(height, DEFAULT_EDITOR_HEIGHT) }}
          pane1Style={{ minWidth: MIN_SNIPPET_SECTION_WIDTH, width: dynamicWidth }}
          pane2Style={{ minWidth: MIN_SNIPPET_SECTION_WIDTH }}
        >
          <div className={css.editor}>
            {defaultTo(renderCustomHeader, renderHeader)()}
            {renderEditor()}
          </div>
          {showSnippetSection ? renderSnippetSection() : null}
        </SplitPane>
      ) : (
        <div className={css.editor}>
          {defaultTo(renderCustomHeader, renderHeader)()}
          {renderEditor()}
        </div>
      )}
    </div>
  )
}

export default YAMLBuilder

export const YamlBuilderMemo = React.memo(YAMLBuilder, (prevProps, nextProps) => {
  if (isNil(prevProps.schema) && !isNil(nextProps.schema)) {
    return false
  }
  return isEqualWith(nextProps, prevProps, (_arg1, _arg2, key) => {
    if (['existingJSON', 'onExpressionTrigger', 'schema', 'onEnableEditMode'].indexOf(key as string) > -1) {
      return true
    }
  })
})
