/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FC, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { PageError, useToaster } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { Feature, Segment, usePatchSegment } from 'services/cf'
import type { PatchOperation } from 'services/cf'
import useResponseError from '@cf/hooks/useResponseError'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import { getErrorMessage } from '@cf/utils/CFUtils'
import { PERCENTAGE_ROLLOUT_VALUE } from '@cf/constants'
import type { TargetManagementFlagConfigurationPanelFormValues as FormValues } from '@cf/components/TargetManagementFlagConfigurationPanel/types'
import TargetManagementFlagConfigurationPanel from '@cf/components/TargetManagementFlagConfigurationPanel/TargetManagementFlagConfigurationPanel'
import { useFFGitSyncContext } from '@cf/contexts/ff-git-sync-context/FFGitSyncContext'
import { useGovernance } from '@cf/hooks/useGovernance'
import { AUTO_COMMIT_MESSAGES } from '@cf/constants/GitSyncConstants'
import useGetTargetGroupFlags from '../../hooks/useGetTargetGroupFlags'
import { getAddFlagsInstruction, getFlagSettingsInstructions } from './flagSettingsInstructions'

export interface FlagSettingsPanelProps {
  targetGroup: Segment
}

const FlagSettingsPanel: FC<FlagSettingsPanelProps> = ({ targetGroup }) => {
  const { getString } = useStrings()
  const { showSuccess } = useToaster()
  const { saveWithGit } = useFFGitSyncContext()

  const { accountId: accountIdentifier, orgIdentifier, projectIdentifier } = useParams<Record<string, string>>()
  const { handleError: handleGovernanceError, isGovernanceError } = useGovernance()
  const { handleResponseError } = useResponseError()

  const {
    data: flags,
    loading,
    error,
    refetch
  } = useGetTargetGroupFlags({
    targetGroup,
    accountIdentifier,
    orgIdentifier,
    projectIdentifier
  })

  const initialValues = useMemo<FormValues>(
    () => ({
      flags: (flags || []).reduce((values, flag) => {
        const serve = flag.envProperties?.rules?.find(({ clauses }) =>
          clauses.some(
            ({ op, values: segmentIds }) => op === 'segmentMatch' && segmentIds.includes(targetGroup.identifier)
          )
        )?.serve

        if (serve?.variation) {
          return { ...values, [flag.identifier]: { variation: serve.variation } }
        } else {
          return {
            ...values,
            [flag.identifier]: {
              variation: PERCENTAGE_ROLLOUT_VALUE,
              percentageRollout: serve?.distribution
            }
          }
        }
      }, {})
    }),
    [flags, targetGroup.identifier]
  )

  const { mutate: patchTargetGroup } = usePatchSegment({
    identifier: targetGroup.identifier,
    queryParams: {
      environmentIdentifier: targetGroup.environment as string,
      projectIdentifier,
      accountIdentifier,
      orgIdentifier
    }
  })

  const handleSave = async (data: PatchOperation): Promise<void> => {
    try {
      const response = await patchTargetGroup(data)
      if (isGovernanceError(response)) {
        handleGovernanceError(response)
      }
      refetch()
    } catch (e: unknown) {
      handleResponseError(e)
    }
  }

  const onChange = useCallback(
    async (values: FormValues) => {
      const instructions = getFlagSettingsInstructions(
        targetGroup.identifier,
        values,
        initialValues,
        flags as Feature[]
      )

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
    },
    [targetGroup.identifier, initialValues, flags, saveWithGit, showSuccess, getString]
  )

  const onAdd = useCallback(
    async (values: FormValues) => {
      const instructions = [getAddFlagsInstruction(values.flags)]

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
    },
    [saveWithGit, refetch, showSuccess, handleSave]
  )

  if (error) {
    return <PageError message={getErrorMessage(error)} onClick={() => refetch()} />
  }

  if (loading) {
    return <ContainerSpinner height="100%" flex={{ align: 'center-center' }} />
  }

  return (
    <TargetManagementFlagConfigurationPanel
      includePercentageRollout
      item={targetGroup}
      flags={flags as Feature[]}
      onChange={onChange}
      onAdd={onAdd}
      initialValues={initialValues}
      noFlagsMessage={getString('cf.segmentDetail.noFlags')}
      addFlagsDialogTitle={getString('cf.segmentDetail.addFlagToTargetGroup')}
    />
  )
}

export default FlagSettingsPanel
