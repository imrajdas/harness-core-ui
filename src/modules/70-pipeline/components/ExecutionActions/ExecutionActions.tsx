/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Button, Popover, ButtonProps, useConfirmationDialog, getErrorInfoFromErrorObject } from '@harness/uicore'
import { useModalHook } from '@harness/use-modal'
import { Dialog, IDialogProps, Intent, Menu, MenuItem } from '@blueprintjs/core'
import { Link, useLocation, matchPath } from 'react-router-dom'
import { defaultTo } from 'lodash-es'

import { HandleInterruptQueryParams, useHandleInterrupt, useHandleStageInterrupt } from 'services/pipeline-ng'
import routes from '@common/RouteDefinitions'
import { useToaster } from '@common/exports'
import RbacButton from '@rbac/components/Button/Button'
import RbacMenuItem from '@rbac/components/MenuItem/MenuItem'
import {
  isExecutionComplete,
  isExecutionActive,
  isExecutionPaused,
  isExecutionPausing,
  ExecutionStatus,
  isRetryPipelineAllowed
} from '@pipeline/utils/statusHelpers'
import { getFeaturePropsForRunPipelineButton } from '@pipeline/utils/runPipelineUtils'
import { useStrings } from 'framework/strings'
import type { StringKeys } from 'framework/strings'
import { useAppStore } from 'framework/AppStore/AppStoreContext'

import type { ExecutionPathProps, GitQueryParams, PipelineType } from '@common/interfaces/RouteInterfaces'
import RetryPipeline from '../RetryPipeline/RetryPipeline'
import { useRunPipelineModal } from '../RunPipelineModal/useRunPipelineModal'
import { useExecutionCompareContext } from '../ExecutionCompareYaml/ExecutionCompareContext'
import css from './ExecutionActions.module.scss'

const commonButtonProps: ButtonProps = {
  minimal: true,
  small: true,
  tooltipProps: {
    isDark: true
  },
  withoutBoxShadow: true
}

export interface ExecutionActionsProps {
  executionStatus?: ExecutionStatus
  params: PipelineType<{
    orgIdentifier: string
    projectIdentifier: string
    pipelineIdentifier: string
    executionIdentifier: string
    accountId: string
    stagesExecuted?: string[]
  }> &
    GitQueryParams
  refetch?(): Promise<void>
  noMenu?: boolean
  stageId?: string
  stageName?: string
  canEdit?: boolean
  canExecute?: boolean
  canRetry?: boolean
  modules?: string[]
  showEditButton?: boolean
  isPipelineInvalid?: boolean
  source: ExecutionPathProps['source']
  onViewCompiledYaml?: () => void
  onCompareExecutions?: () => void
}
function getValidExecutionActions(canExecute: boolean, executionStatus?: ExecutionStatus) {
  return {
    canAbort: isExecutionActive(executionStatus) && canExecute,
    canPause:
      isExecutionActive(executionStatus) &&
      !isExecutionPaused(executionStatus) &&
      !isExecutionPausing(executionStatus) &&
      canExecute,
    canRerun: isExecutionComplete(executionStatus) && canExecute,
    canResume: isExecutionPaused(executionStatus) && canExecute
  }
}

function getActionTexts(stageId?: string): {
  abortText: StringKeys
  pauseText: StringKeys
  rerunText: StringKeys
  resumeText: StringKeys
} {
  return {
    abortText: stageId ? 'pipeline.execution.actions.abortStage' : 'pipeline.execution.actions.abortPipeline',
    pauseText: stageId ? 'pipeline.execution.actions.pauseStage' : 'pipeline.execution.actions.pausePipeline',
    rerunText: stageId ? 'pipeline.execution.actions.rerunStage' : 'pipeline.execution.actions.rerunPipeline',
    resumeText: stageId ? 'pipeline.execution.actions.resumeStage' : 'pipeline.execution.actions.resumePipeline'
  }
}

function getSuccessMessage(
  getString: (key: StringKeys, vars?: Record<string, any>) => string,
  interruptType: HandleInterruptQueryParams['interruptType'],
  stageId?: string,
  stageName?: string
): string {
  if (stageId) {
    return interruptType === 'AbortAll'
      ? getString('pipeline.execution.stageActionMessages.abortedMessage', {
          stageName
        })
      : interruptType === 'Pause'
      ? getString('pipeline.execution.stageActionMessages.pausedMessage', {
          stageName
        })
      : interruptType === 'Resume'
      ? getString('pipeline.execution.stageActionMessages.resumedMessage', {
          stageName
        })
      : ''
  } else {
    return interruptType === 'AbortAll'
      ? getString('pipeline.execution.pipelineActionMessages.abortedMessage')
      : interruptType === 'Pause'
      ? getString('pipeline.execution.pipelineActionMessages.pausedMessage')
      : interruptType === 'Resume'
      ? getString('pipeline.execution.pipelineActionMessages.resumedMessage')
      : ''
  }
}

export default function ExecutionActions(props: ExecutionActionsProps): React.ReactElement {
  const {
    executionStatus,
    params,
    noMenu,
    stageId,
    canEdit = true,
    canExecute = true,
    stageName,
    canRetry = false,
    modules,
    source,
    showEditButton = true,
    isPipelineInvalid,
    onViewCompiledYaml,
    onCompareExecutions
  } = props
  const {
    orgIdentifier,
    executionIdentifier,
    accountId,
    projectIdentifier,
    pipelineIdentifier,
    module,
    branch,
    repoIdentifier,
    connectorRef,
    repoName,
    storeType,
    stagesExecuted
  } = params
  const { mutate: interrupt } = useHandleInterrupt({
    planExecutionId: executionIdentifier
  })
  const { mutate: stageInterrupt } = useHandleStageInterrupt({
    planExecutionId: executionIdentifier,
    nodeExecutionId: defaultTo(stageId, '')
  })

  const { showSuccess, showError, clear } = useToaster()
  const { getString } = useStrings()
  const location = useLocation()
  const { isGitSyncEnabled } = useAppStore()
  const { isCompareMode } = useExecutionCompareContext()

  const { openDialog: openAbortDialog } = useConfirmationDialog({
    cancelButtonText: getString('cancel'),
    contentText: getString('pipeline.execution.dialogMessages.abortExecution'),
    titleText: getString('pipeline.execution.dialogMessages.abortTitle'),
    confirmButtonText: getString('confirm'),
    intent: Intent.WARNING,
    onCloseDialog: async isConfirmed => {
      // istanbul ignore else
      if (isConfirmed) {
        abortPipeline()
      }
    }
  })

  const { canAbort, canPause, canRerun, canResume } = getValidExecutionActions(canExecute, executionStatus)
  const { abortText, pauseText, rerunText, resumeText } = getActionTexts(stageId)

  const interruptMethod = stageId ? stageInterrupt : interrupt

  const executionPipelineViewRoute = routes.toExecutionPipelineView({
    source,
    orgIdentifier,
    pipelineIdentifier,
    executionIdentifier,
    projectIdentifier,
    accountId,
    module
  })
  const isExecutionPipelineViewPage = !!matchPath(location.pathname, {
    path: executionPipelineViewRoute
  })

  async function executeAction(interruptType: HandleInterruptQueryParams['interruptType']): Promise<void> {
    clear()
    try {
      const successMessage = getSuccessMessage(getString, interruptType, stageId, stageName)
      await interruptMethod({} as never, {
        queryParams: {
          orgIdentifier,
          accountIdentifier: accountId,
          projectIdentifier,
          interruptType
        }
      })
      showSuccess(successMessage)
    } catch (e) {
      const errorMessage = getErrorInfoFromErrorObject(e)
      showError(errorMessage)
    }
  }

  async function abortPipeline(): Promise<void> {
    await executeAction('AbortAll')
  }

  async function pausePipeline(): Promise<void> {
    await executeAction('Pause')
  }

  async function resumePipeline(): Promise<void> {
    await executeAction('Resume')
  }

  /*--------------------------------------Retry Pipeline---------------------------------------------*/
  const retryPipeline = (): void => {
    showRetryPipelineModal()
  }
  const showRetryPipeline = (): boolean => {
    return isRetryPipelineAllowed(executionStatus) && canRetry
  }

  const DIALOG_PROPS: IDialogProps = {
    isOpen: true,
    usePortal: true,
    autoFocus: true,
    canEscapeKeyClose: false,
    canOutsideClickClose: false,
    enforceFocus: false,
    className: css.runPipelineDialog,
    style: { width: 872, height: 'fit-content', overflow: 'auto' }
  }

  const [showRetryPipelineModal, hideRetryPipelineModal] = useModalHook(() => {
    const onClose = (): void => {
      hideRetryPipelineModal()
    }

    return (
      <Dialog onClose={onClose} {...DIALOG_PROPS}>
        <div className={css.modalContent}>
          <RetryPipeline
            onClose={onClose}
            executionIdentifier={executionIdentifier}
            pipelineIdentifier={pipelineIdentifier}
            modules={modules}
          />
          <Button minimal icon="cross" onClick={onClose} className={css.crossIcon} />
        </div>
      </Dialog>
    )
  }, [pipelineIdentifier, executionIdentifier])

  /*--------------------------------------Retry Pipeline---------------------------------------------*/

  /*--------------------------------------Run Pipeline---------------------------------------------*/

  const reRunPipeline = (): void => {
    openRunPipelineModal()
  }

  const { openRunPipelineModal } = useRunPipelineModal({
    pipelineIdentifier,
    executionId: executionIdentifier,
    repoIdentifier: isGitSyncEnabled ? repoIdentifier : repoName,
    branch,
    connectorRef,
    storeType,
    stagesExecuted
  })

  /*--------------------------------------Run Pipeline---------------------------------------------*/

  function killEvent(e: React.MouseEvent<HTMLDivElement>): void {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <div className={css.main} onClick={killEvent}>
      {canResume ? (
        <Button
          icon="play"
          tooltip={getString(resumeText)}
          onClick={resumePipeline}
          {...commonButtonProps}
          disabled={!canExecute}
        />
      ) : null}
      {!stageId && canRerun ? (
        <RbacButton
          icon="repeat"
          tooltip={isPipelineInvalid ? getString('pipeline.cannotRunInvalidPipeline') : getString(rerunText)}
          onClick={reRunPipeline}
          {...commonButtonProps}
          disabled={!canExecute || isPipelineInvalid}
          featuresProps={getFeaturePropsForRunPipelineButton({ modules, getString })}
        />
      ) : null}
      {canPause ? (
        <Button
          icon="pause"
          tooltip={getString(pauseText)}
          onClick={pausePipeline}
          {...commonButtonProps}
          disabled={!canExecute}
        />
      ) : null}
      {canAbort ? (
        <Button
          icon="stop"
          tooltip={getString(abortText)}
          onClick={openAbortDialog}
          {...commonButtonProps}
          disabled={!canExecute}
        />
      ) : null}
      {noMenu ? null : (
        <Popover position="bottom-right" minimal>
          <Button icon="more" {...commonButtonProps} className={css.more} />
          <Menu>
            {!isExecutionPipelineViewPage && (
              <Link
                className="bp3-menu-item"
                target="_blank"
                to={executionPipelineViewRoute}
                onClick={e => e.stopPropagation()}
              >
                {getString('pipeline.openInNewTab')}
              </Link>
            )}
            {showEditButton ? (
              <Link
                className={`bp3-menu-item${!canEdit ? ' bp3-disabled' : ''}`}
                to={routes.toPipelineStudio({
                  orgIdentifier,
                  projectIdentifier,
                  pipelineIdentifier,
                  accountId,
                  module,
                  branch,
                  repoIdentifier,
                  connectorRef,
                  repoName,
                  storeType
                })}
                onClick={e => !canEdit && e.preventDefault()}
              >
                {getString('editPipeline')}
              </Link>
            ) : null}
            {stageId ? null : (
              <RbacMenuItem
                featuresProps={getFeaturePropsForRunPipelineButton({ modules, getString })}
                text={getString(rerunText)}
                disabled={!canRerun || isPipelineInvalid}
                onClick={reRunPipeline}
              />
            )}
            <MenuItem text={getString(pauseText)} onClick={pausePipeline} disabled={!canPause} />
            <MenuItem text={getString(abortText)} onClick={openAbortDialog} disabled={!canAbort} />
            <MenuItem text={getString(resumeText)} onClick={resumePipeline} disabled={!canResume} />
            {onViewCompiledYaml && (
              <MenuItem text={getString('pipeline.execution.actions.viewCompiledYaml')} onClick={onViewCompiledYaml} />
            )}
            {onCompareExecutions && (
              <MenuItem
                text={getString('pipeline.execution.actions.compareExecutions')}
                onClick={onCompareExecutions}
                disabled={isCompareMode}
              />
            )}
            {showRetryPipeline() && (
              <RbacMenuItem
                featuresProps={getFeaturePropsForRunPipelineButton({ modules, getString })}
                text={getString('pipeline.retryPipeline')}
                onClick={retryPipeline}
                data-testid="retry-pipeline-menu"
                disabled={isPipelineInvalid}
              />
            )}
            {/* {stageId ? null : <MenuItem text={getString('pipeline.execution.actions.downloadLogs')} disabled />} */}
          </Menu>
        </Popover>
      )}
    </div>
  )
}
