/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FC, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useToaster } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { Feature, Target, useGetAllFeatures, usePatchTarget } from 'services/cf'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import { Page } from '@common/exports'
import { getErrorMessage } from '@cf/utils/CFUtils'
import type { TargetManagementFlagConfigurationPanelFormValues as FormValues } from '@cf/components/TargetManagementFlagConfigurationPanel/types'
import TargetManagementFlagConfigurationPanel from '@cf/components/TargetManagementFlagConfigurationPanel/TargetManagementFlagConfigurationPanel'
import { useFFGitSyncContext } from '@cf/contexts/ff-git-sync-context/FFGitSyncContext'
import { AUTO_COMMIT_MESSAGES } from '@cf/constants/GitSyncConstants'
import { useGovernance } from '@cf/hooks/useGovernance'
import useResponseError from '@cf/hooks/useResponseError'
import type { PatchOperation } from 'services/cf'
import buildInstructions from './buildInstructions'

export interface FlagSettingsProps {
  target: Target
}

const FlagSettings: FC<FlagSettingsProps> = ({ target }) => {
  const { getString } = useStrings()
  const { showSuccess } = useToaster()
  const { accountId: accountIdentifier, projectIdentifier, orgIdentifier } = useParams<Record<string, string>>()
  const { saveWithGit } = useFFGitSyncContext()
  const { handleError: handleGovernanceError, isGovernanceError } = useGovernance()
  const { handleResponseError } = useResponseError()

  const {
    data: flags,
    loading: loadingFlags,
    error: flagsError,
    refetch: refetchFlags
  } = useGetAllFeatures({
    queryParams: {
      accountIdentifier,
      projectIdentifier,
      orgIdentifier,
      environmentIdentifier: target.environment,
      targetIdentifierFilter: target.identifier,
      pageSize: 10000 // bring back everything
    }
  })

  const initialValues = useMemo<FormValues>(
    () => ({
      flags: (flags?.features || []).reduce(
        (values, { identifier: flagIdentifier, envProperties }) => ({
          ...values,
          [flagIdentifier]: {
            variation: /* istanbul ignore else */ envProperties?.variationMap?.find(({ targets }) =>
              targets?.find(({ identifier }) => identifier === target.identifier)
            )?.variation
          }
        }),
        {}
      )
    }),
    [flags?.features, target.identifier]
  )

  const { mutate: patchTarget } = usePatchTarget({
    identifier: target.identifier,
    queryParams: {
      orgIdentifier,
      projectIdentifier,
      accountIdentifier,
      environmentIdentifier: target.environment
    }
  })

  const handleSave = useCallback(
    async (data: PatchOperation): Promise<void> => {
      try {
        const response = await patchTarget(data)
        if (isGovernanceError(response)) {
          handleGovernanceError(response)
        }
        refetchFlags()
      } catch (e: unknown) {
        handleResponseError(e)
      }
    },
    [handleGovernanceError, handleResponseError, isGovernanceError, patchTarget, refetchFlags]
  )

  const onChange = useCallback(
    async (values: FormValues) => {
      const instructions = buildInstructions(values, initialValues)

      /* istanbul ignore else */
      if (instructions.length) {
        try {
          saveWithGit({
            autoCommitMessage: AUTO_COMMIT_MESSAGES.UPDATED_FLAG_VARIATIONS,
            patchInstructions: { instructions },
            onSave: handleSave
          })
          showSuccess(getString('cf.segmentDetail.updateSuccessful'))
        } catch (e: unknown) {
          handleResponseError(e)
        }
      }
    },
    [initialValues, saveWithGit, handleSave, handleResponseError, showSuccess, getString]
  )

  const onAdd = useCallback(
    async (values: FormValues) => {
      const instructions = buildInstructions(values, { flags: {} })

      /* istanbul ignore else */
      if (instructions.length) {
        try {
          saveWithGit({
            autoCommitMessage: AUTO_COMMIT_MESSAGES.ADDED_FLAG_TARGETS,
            patchInstructions: { instructions },
            onSave: handleSave
          })
          showSuccess(getString('cf.segmentDetail.flagsAddedSuccessfully'))
        } catch (e: unknown) {
          handleResponseError(e)
        }
      }
    },
    [saveWithGit, handleSave, handleResponseError, showSuccess, getString]
  )

  if (loadingFlags) {
    return <ContainerSpinner flex={{ align: 'center-center' }} />
  }

  if (flagsError) {
    return <Page.Error message={getErrorMessage(flagsError)} onClick={() => refetchFlags()} />
  }

  return (
    <TargetManagementFlagConfigurationPanel
      item={target}
      flags={flags?.features as Feature[]}
      onChange={onChange}
      onAdd={onAdd}
      initialValues={initialValues}
      noFlagsMessage={getString('cf.targetDetail.noFlagConfigured')}
      addFlagsDialogTitle={getString('cf.targetDetail.addFlagToTarget')}
    />
  )
}

export default FlagSettings
