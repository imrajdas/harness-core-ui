/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { useParams } from 'react-router-dom'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { ObjectSchema } from 'yup'
import * as yup from 'yup'
import { useModalHook } from '@harness/use-modal'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import {
  GitRepo,
  GitSyncErrorResponse,
  PatchInstruction,
  PatchOperation,
  useGetGitRepo,
  usePatchGitRepo
} from 'services/cf'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import { useStrings } from 'framework/strings'
import GitErrorModal from '@cf/components/GitErrorModal/GitErrorModal'
import InvalidYamlModal from '@cf/components/InvalidYamlModal/InvalidYamlModal'

import SaveFlagToGitModal from '@cf/components/SaveFlagToGitModal/SaveFlagToGitModal'

export interface GitDetails {
  branch: string
  filePath: string
  repoIdentifier: string
  rootFolder: string
  commitMsg: string
}

export interface GitSyncFormValues {
  gitDetails: GitDetails
  autoCommit: boolean
}

interface GitSyncFormMeta {
  gitSyncInitialValues: GitSyncFormValues
  gitSyncValidationSchema: ObjectSchema<Record<string, unknown> | undefined>
}

interface SaveWithGitArgs {
  featureFlagName?: string
  featureFlagIdentifier?: string
  autoCommitMessage: string
  patchInstructions: PatchOperation
  onSave: (reqData: PatchOperation) => Promise<void>
}
export interface UseGitSync {
  gitRepoDetails?: GitRepo
  isAutoCommitEnabled: boolean
  isGitSyncEnabled: boolean
  isGitSyncPaused: boolean
  isGitSyncActionsEnabled: boolean
  gitSyncLoading: boolean
  apiError: string
  saveWithGit: (reqData: SaveWithGitArgs) => void
  handleAutoCommit: (newAutoCommitValue: boolean) => Promise<void>
  handleGitPause: (newGitPauseValue: boolean) => Promise<void>
  getGitSyncFormMeta: (autoCommitMessage?: string) => GitSyncFormMeta
  handleError: (error: GitSyncErrorResponse) => void
}

export const GIT_SYNC_ERROR_CODE = 424

export const useGitSync = (): UseGitSync => {
  const {
    projectIdentifier,
    accountId: accountIdentifier,
    orgIdentifier
  } = useParams<ProjectPathProps & ModulePathParams>()
  const { getString } = useStrings()

  const getGitRepo = useGetGitRepo({
    identifier: projectIdentifier,
    queryParams: {
      accountIdentifier,
      orgIdentifier
    }
  })

  const patchGitRepo = usePatchGitRepo({
    identifier: projectIdentifier,
    queryParams: {
      accountIdentifier,
      orgIdentifier
    }
  })

  const FF_GITSYNC = useFeatureFlag(FeatureFlag.FF_GITSYNC)

  const [isLoading, setIsLoading] = useState(false)

  const isGitSyncEnabled = useMemo<boolean>(
    () => !!(FF_GITSYNC && getGitRepo?.data?.repoSet && getGitRepo?.data?.repoDetails?.enabled),
    [FF_GITSYNC, getGitRepo?.data?.repoDetails?.enabled, getGitRepo?.data?.repoSet]
  )

  const isAutoCommitEnabled = useMemo<boolean>(
    () => !!(FF_GITSYNC && getGitRepo?.data?.repoSet && getGitRepo?.data?.repoDetails?.autoCommit),
    [FF_GITSYNC, getGitRepo?.data?.repoDetails?.autoCommit, getGitRepo?.data?.repoSet]
  )

  const isGitSyncActionsEnabled = useMemo<boolean>(
    () => !!(FF_GITSYNC && getGitRepo?.data?.repoSet),
    [FF_GITSYNC, getGitRepo?.data?.repoSet]
  )

  const isGitSyncPaused = useMemo<boolean>(
    () => !!(FF_GITSYNC && getGitRepo?.data?.repoSet && !getGitRepo?.data?.repoDetails?.enabled),
    [FF_GITSYNC, getGitRepo?.data?.repoDetails?.enabled, getGitRepo?.data?.repoSet]
  )

  const gitSyncLoading = getGitRepo.loading || patchGitRepo.loading || isLoading

  const getGitSyncFormMeta = (autoCommitMessage?: string): GitSyncFormMeta => ({
    gitSyncInitialValues: {
      gitDetails: {
        branch: getGitRepo?.data?.repoDetails?.branch || '',
        filePath: getGitRepo?.data?.repoDetails?.filePath || '',
        repoIdentifier: getGitRepo?.data?.repoDetails?.repoIdentifier || '',
        rootFolder: getGitRepo?.data?.repoDetails?.rootFolder || '',
        commitMsg:
          isAutoCommitEnabled && autoCommitMessage
            ? getString('cf.gitSync.autoCommitMsg', { msg: autoCommitMessage })
            : ''
      },
      autoCommit: isAutoCommitEnabled
    },
    gitSyncValidationSchema: yup.object().shape({
      commitMsg: isGitSyncEnabled ? yup.string().required(getString('cf.gitSync.commitMsgRequired')) : yup.string()
    })
  })

  useEffect(() => {
    if (getGitRepo.data?.repoDetails?.yamlError) {
      showInvalidYamlModal()
    } else {
      hideInvalidYamlModal()
    }
  }, [getGitRepo.data?.repoDetails?.yamlError])

  const [apiError, setApiError] = useState<string>('')

  const handleError = (error: GitSyncErrorResponse): void => {
    setApiError(error.message)
    showErrorModal()
  }

  const entityDataRef = useRef<{
    featureFlagIdentifier?: string
    featureFlagName?: string
    instructions: PatchInstruction
    onSave?: (reqData: PatchOperation) => Promise<void>
  }>({
    featureFlagIdentifier: '',
    featureFlagName: '',
    instructions: [],
    onSave: undefined
  })

  const onSaveGitSyncSubmit = async (gitFormValues: GitSyncFormValues): Promise<void> => {
    const reqData = {
      instructions: entityDataRef.current.instructions,
      gitDetails: gitFormValues.gitDetails
    }

    setIsLoading(true)
    await entityDataRef.current.onSave?.(reqData)
    if (gitFormValues.autoCommit) {
      handleAutoCommit(true)
    }
    hideGitSyncModal()
    await getGitRepo.refetch()
    setIsLoading(false)
  }

  const onSaveAutoCommit = async (autoCommitMessage: string): Promise<void> => {
    const reqData = {
      instructions: entityDataRef.current.instructions,
      gitDetails: {
        branch: getGitRepo.data?.repoDetails?.branch,
        filePath: getGitRepo.data?.repoDetails?.filePath,
        repoIdentifier: getGitRepo?.data?.repoDetails?.repoIdentifier,
        rootFolder: getGitRepo?.data?.repoDetails?.rootFolder,
        commitMsg: getString('cf.gitSync.autoCommitMsg', { msg: autoCommitMessage })
      }
    }
    setIsLoading(true)
    await entityDataRef.current.onSave?.(reqData)
    setIsLoading(false)
  }

  const [showGitSyncModal, hideGitSyncModal] = useModalHook(
    () => (
      <SaveFlagToGitModal
        flagName={entityDataRef.current.featureFlagName}
        flagIdentifier={entityDataRef.current.featureFlagIdentifier}
        gitSyncInitialValues={getGitSyncFormMeta().gitSyncInitialValues}
        gitSyncValidationSchema={getGitSyncFormMeta().gitSyncValidationSchema}
        onSubmit={onSaveGitSyncSubmit}
        onClose={hideGitSyncModal}
      />
    ),
    [getGitSyncFormMeta]
  )

  const [showErrorModal, hideErrorModal] = useModalHook(
    () => (
      <GitErrorModal
        onClose={hideErrorModal}
        onSubmit={() => {
          const newGitPauseValue = false
          handleGitPause(newGitPauseValue)
          hideErrorModal()
        }}
        apiError={apiError}
      />
    ),
    [apiError]
  )

  const [showInvalidYamlModal, hideInvalidYamlModal] = useModalHook(
    () => (
      <InvalidYamlModal
        handleRetry={() => getGitRepo.refetch()}
        isLoading={getGitRepo.loading}
        apiError={getGitRepo.data?.repoDetails?.yamlError}
        flagsYamlFilename={getGitRepo.data?.repoDetails?.filePath}
        handleClose={hideInvalidYamlModal}
      />
    ),
    [getGitRepo.data?.repoDetails?.yamlError, getGitRepo.loading]
  )

  const handleAutoCommit = async (newAutoCommitValue: boolean): Promise<void> => {
    if (isAutoCommitEnabled !== newAutoCommitValue) {
      const instruction = {
        instructions: [
          {
            kind: 'setAutoCommit',
            parameters: {
              autoCommit: newAutoCommitValue
            }
          }
        ]
      }

      await patchGitRepo.mutate(instruction)
      await getGitRepo.refetch()
    }
  }

  const handleGitPause = async (newGitPauseValue: boolean): Promise<void> => {
    const instruction = {
      instructions: [
        {
          kind: 'setEnabled',
          parameters: {
            enabled: newGitPauseValue
          }
        }
      ]
    }

    await patchGitRepo.mutate(instruction)
    await getGitRepo.refetch()
  }

  const saveWithGit = async ({
    featureFlagName,
    featureFlagIdentifier,
    autoCommitMessage,
    patchInstructions,
    onSave
  }: SaveWithGitArgs): Promise<void> => {
    entityDataRef.current = {
      featureFlagIdentifier,
      featureFlagName,
      instructions: patchInstructions.instructions,
      onSave
    }

    if (isGitSyncEnabled) {
      if (isAutoCommitEnabled) {
        onSaveAutoCommit(autoCommitMessage)
      } else {
        showGitSyncModal()
      }
    } else {
      onSave(patchInstructions)
    }
  }

  return {
    gitRepoDetails: getGitRepo?.data?.repoDetails,
    isAutoCommitEnabled,
    isGitSyncEnabled,
    isGitSyncPaused,
    isGitSyncActionsEnabled,
    gitSyncLoading,
    apiError,
    saveWithGit,
    handleAutoCommit,
    handleGitPause,
    getGitSyncFormMeta,
    handleError
  }
}
