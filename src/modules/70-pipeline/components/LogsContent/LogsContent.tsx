/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */
import React from 'react'
import { Link, useParams } from 'react-router-dom'
import cx from 'classnames'
import {
  Button,
  ButtonSize,
  ButtonVariation,
  Color,
  Container,
  ExpandingSearchInput,
  ExpandingSearchInputHandle,
  Icon
} from '@harness/uicore'
import type { GroupedVirtuosoHandle, VirtuosoHandle } from 'react-virtuoso'

import { defaultTo } from 'lodash-es'
import routes from '@common/RouteDefinitions'
import { ErrorList, extractInfo } from '@common/components/ErrorHandler/ErrorHandler'
import { String as StrTemplate, useStrings } from 'framework/strings'
import { useExecutionContext } from '@pipeline/context/ExecutionContext'
import { useGlobalEventListener } from '@common/hooks'
import type {
  ConsoleViewStepDetailProps,
  LogsContentProps,
  RenderLogsInterface
} from '@pipeline/factories/ExecutionFactory/types'
import type { ExecutionPageQueryParams } from '@pipeline/utils/types'
import type { ModulePathParams, ExecutionPathProps } from '@common/interfaces/RouteInterfaces'
import { addHotJarSuppressionAttribute } from '@common/utils/utils'
import { isExecutionComplete } from '@pipeline/utils/statusHelpers'
import { PreferenceScope, usePreferenceStore } from 'framework/PreferenceStore/PreferenceStoreContext'
import { LinkifyText } from '@common/components/LinkifyText/LinkifyText'
import { useLogsContent } from './useLogsContent'
import { GroupedLogsWithRef as GroupedLogs } from './components/GroupedLogs'
import { SingleSectionLogsWithRef as SingleSectionLogs } from './components/SingleSectionLogs'
import type { UseActionCreatorReturn } from './LogsState/actions'
import css from './LogsContent.module.scss'

function resolveCurrentStep(selectedStepId: string, queryParams: ExecutionPageQueryParams): string {
  return queryParams.retryStep ? queryParams.retryStep : selectedStepId
}

function isStepSelected(selectedStageId?: string, selectedStepId?: string): boolean {
  return !!(selectedStageId && selectedStepId)
}

function isPositiveNumber(index: unknown): index is number {
  return typeof index === 'number' && index >= 0
}

function handleKeyDown(actions: UseActionCreatorReturn) {
  return (e: React.KeyboardEvent<HTMLElement>): void => {
    /* istanbul ignore else */
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      actions.goToPrevSearchResult()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      actions.goToNextSearchResult()
    }
  }
}

function getKeyDownListener(searchRef: React.MutableRefObject<ExpandingSearchInputHandle | undefined>) {
  return (e: KeyboardEvent) => {
    const isMetaKey = navigator.userAgent.includes('Mac') ? e.metaKey : e.ctrlKey

    if (e.key === 'f' && isMetaKey && searchRef.current) {
      e.preventDefault()
      searchRef.current.focus()
    }
  }
}

function handleSearchChange(actions: UseActionCreatorReturn) {
  return (term: string): void => {
    if (term) {
      actions.search(term)
    } else {
      actions.resetSearch()
    }
  }
}

function handleFullScreen(rootRef: React.MutableRefObject<HTMLDivElement | null>, isFullScreen: boolean) {
  return async (): Promise<void> => {
    if (!rootRef.current) {
      return
    }

    try {
      if (isFullScreen) {
        await document.exitFullscreen()
      } else {
        await rootRef.current.requestFullscreen()
      }
    } catch (_e) {
      // catch any errors and do nothing
    }
  }
}

const isDocumentFullScreen = (elem: HTMLDivElement | null): boolean =>
  !!(document.fullscreenElement && document.fullscreenElement === elem)

export enum SavedExecutionViewTypes {
  GRAPH = 'graph',
  LOG = 'log'
}

export const logsRenderer = ({ hasLogs, isSingleSectionLogs, virtuosoRef, state, actions }: RenderLogsInterface) => {
  return hasLogs ? (
    isSingleSectionLogs ? (
      <SingleSectionLogs ref={virtuosoRef} state={state} actions={actions} />
    ) : (
      <GroupedLogs ref={virtuosoRef} state={state} actions={actions} />
    )
  ) : (
    <pre className={css.container} {...addHotJarSuppressionAttribute()}>
      <StrTemplate tagName="div" className={css.noLogs} stringID="common.logs.noLogsText" />
    </pre>
  )
}

export function LogsContent(props: LogsContentProps): React.ReactElement {
  const { mode, toConsoleView = '', isWarning, renderLogs = logsRenderer } = props
  const pathParams = useParams<ExecutionPathProps & ModulePathParams>()
  const { pipelineStagesMap, selectedStageId, allNodeMap, selectedStepId, pipelineExecutionDetail, queryParams } =
    useExecutionContext()
  const { state, actions } = useLogsContent()
  const { getString } = useStrings()
  const { linesWithResults, currentIndex } = state.searchData
  const searchRef = React.useRef<ExpandingSearchInputHandle>()
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const [isFullScreen, setIsFullScreen] = React.useState(false)
  const hasLogs = state.units.length > 0
  const isSingleSectionLogs = state.units.length === 1

  const virtuosoRef = React.useRef<null | GroupedVirtuosoHandle | VirtuosoHandle>(null)
  const { setPreference: setSavedExecutionView } = usePreferenceStore<string | undefined>(
    PreferenceScope.USER,
    'executionViewType'
  )
  /* istanbul ignore next */
  function getSectionName(index: number): string {
    return getString('pipeline.logs.sectionName', { index })
  }

  React.useEffect(() => {
    const currentStepId1 = resolveCurrentStep(selectedStepId, queryParams)
    const selectedStep = allNodeMap[currentStepId1]

    actions.createSections({
      node: selectedStep,
      selectedStep: selectedStepId,
      selectedStage: selectedStageId,
      getSectionName
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    queryParams.retryStep,
    mode,
    selectedStepId,
    allNodeMap,
    pipelineStagesMap,
    selectedStageId,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    pipelineExecutionDetail?.pipelineExecutionSummary?.runSequence
  ])

  // scroll to current search result
  React.useEffect(() => {
    const index = linesWithResults[currentIndex]

    /* istanbul ignore next */
    if (virtuosoRef.current && isPositiveNumber(index)) {
      virtuosoRef.current.scrollToIndex(index)
    }
  }, [currentIndex, linesWithResults])

  /* istanbul ignore next */
  useGlobalEventListener('keydown', getKeyDownListener(searchRef))

  // we need to update `isFullScreen` flag based on event,
  // as it can be changed via keyboard too
  React.useEffect(() => {
    const elem = rootRef.current
    const callback = (): void => {
      setIsFullScreen(isDocumentFullScreen(elem))
    }

    const errCallback = (): void => {
      setIsFullScreen(false)
    }

    elem?.addEventListener('fullscreenchange', callback)
    elem?.addEventListener('fullscreenerror', errCallback)

    return () => {
      elem?.removeEventListener('fullscreenchange', callback)
      elem?.removeEventListener('fullscreenerror', errCallback)
    }
  }, [])

  const currentStepId = resolveCurrentStep(selectedStepId, queryParams)
  const currentStep = allNodeMap[currentStepId]
  let errorObjects = extractInfo(defaultTo(currentStep?.failureInfo?.responseMessages, []))
  let hasError = Array.isArray(errorObjects) && errorObjects.length > 0

  if (!hasError && currentStep?.failureInfo?.message) {
    errorObjects = [{ error: { message: currentStep.failureInfo.message } }]
    hasError = true
  }

  return (
    <div ref={rootRef} className={cx(css.main, { [css.hasErrorMessage]: hasError })} data-mode={mode}>
      <div className={css.header}>
        <StrTemplate
          tagName="div"
          stringID={mode === 'console-view' ? 'execution.consoleLogs' : 'execution.stepLogs'}
        />
        <div className={css.rhs} onKeyDown={handleKeyDown(actions)}>
          <ExpandingSearchInput
            onChange={handleSearchChange(actions)}
            ref={searchRef}
            showPrevNextButtons
            flip
            theme={'dark'}
            className={css.search}
            fixedText={`${Math.min(currentIndex + 1, linesWithResults.length)} / ${linesWithResults.length}`}
            onNext={/* istanbul ignore next */ () => actions.goToNextSearchResult()}
            onPrev={/* istanbul ignore next */ () => actions.goToPrevSearchResult()}
            onEnter={/* istanbul ignore next */ () => actions.goToNextSearchResult()}
          />
          <Button
            icon={isFullScreen ? 'full-screen-exit' : 'full-screen'}
            iconProps={{ size: 22 }}
            className={css.fullScreen}
            variation={ButtonVariation.ICON}
            withoutCurrentColor
            onClick={handleFullScreen(rootRef, isFullScreen)}
          />
          {isStepSelected(selectedStageId, currentStepId) && isExecutionComplete(currentStep?.status) ? (
            <Link
              className={css.newTab}
              to={routes.toPipelineLogs({
                stepIndentifier: currentStepId,
                stageIdentifier: selectedStageId,
                ...pathParams
              })}
              target="_blank"
              rel="noopener noreferer"
            >
              <Icon name="launch" size={16} />
            </Link>
          ) : null}
          {mode === 'step-details' ? (
            <Link
              className={css.toConsoleView}
              onClick={() => setSavedExecutionView(SavedExecutionViewTypes.LOG)}
              to={toConsoleView}
            >
              <StrTemplate stringID="consoleView" />
            </Link>
          ) : null}
        </div>
      </div>
      {renderLogs({ hasLogs, isSingleSectionLogs, virtuosoRef, state, actions })}
      {mode === 'console-view' && hasError ? (
        <div className={cx(css.errorMsgs, { [css.isWarning]: isWarning })}>
          {errorObjects.map((errorObject, index) => {
            const { error = {}, explanations = [], hints = [] } = errorObject
            return (
              <div key={index} className={css.errorMsgContainer}>
                <Container margin={{ bottom: 'medium' }}>
                  <Icon className={css.errorIcon} name={isWarning ? 'warning-sign' : 'circle-cross'} />
                  <LinkifyText
                    content={error.message}
                    textProps={{ font: { weight: 'bold' }, color: Color.RED_700 }}
                    linkStyles={css.link}
                  />
                </Container>
                <ErrorList
                  items={explanations}
                  header={getString('common.errorHandler.issueCouldBe')}
                  icon={'info'}
                  color={Color.WHITE}
                />
                <ErrorList
                  items={hints}
                  header={getString('common.errorHandler.tryTheseSuggestions')}
                  icon={'lightbulb'}
                  color={Color.WHITE}
                />
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export interface LogsContentState {
  hasError: boolean
}

export class LogsContentWithErrorBoundary extends React.Component<LogsContentProps, LogsContentState> {
  constructor(props: LogsContentProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): LogsContentState {
    return { hasError: true }
  }

  componentDidCatch(error: unknown): void {
    window?.bugsnagClient?.notify?.(error)
  }

  handleRetry = (): void => {
    this.setState({ hasError: false })
  }

  render(): React.ReactElement {
    if (this.state.hasError) {
      return (
        <div className={css.errorContainer}>
          <StrTemplate tagName="div" className={css.txt} stringID="pipeline.logs.errorText" />
          <Button onClick={this.handleRetry} variation={ButtonVariation.PRIMARY} size={ButtonSize.SMALL}>
            <StrTemplate stringID="pipeline.logs.retry" />
          </Button>
        </div>
      )
    }

    return <LogsContent {...this.props} />
  }
}

export function DefaultConsoleViewStepDetails(props: ConsoleViewStepDetailProps): React.ReactElement {
  const { errorMessage, isSkipped, renderLogs } = props

  return (
    <div className={css.logViewer}>
      <LogsContentWithErrorBoundary
        mode="console-view"
        errorMessage={errorMessage}
        isWarning={isSkipped}
        renderLogs={renderLogs}
      />
    </div>
  )
}
