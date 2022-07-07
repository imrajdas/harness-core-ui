/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useHistory, useParams } from 'react-router-dom'
import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
import { stagesCollection } from '@pipeline/components/PipelineStudio/Stages/StagesCollection'
import routes from '@common/RouteDefinitions'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import type {
  AccountPathProps,
  GitQueryParams,
  PipelinePathProps,
  PipelineType
} from '@common/interfaces/RouteInterfaces'
import { getCDPipelineStages } from '@cd/components/PipelineStudio/CDPipelineStagesUtils'
import { useStrings } from 'framework/strings'
import { PipelineProvider } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { PipelineStudio } from '@pipeline/components/PipelineStudio/PipelineStudio'
import { getCDTrialDialog } from '@cd/modals/CDTrial/useCDTrialModal'
import { TrialType } from '@pipeline/components/TrialModalTemplate/trialModalUtils'
import type { PipelineInfoConfig } from 'services/pipeline-ng'
import { useQueryParams } from '@common/hooks'
import { useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import { FeatureFlag } from '@common/featureFlags'
import type { ModuleLicenseType } from '@common/constants/SubscriptionTypes'
import css from './CDPipelineStudio.module.scss'

const CDPipelineStudio: React.FC = (): JSX.Element => {
  const { accountId, projectIdentifier, orgIdentifier, pipelineIdentifier, module } =
    useParams<PipelineType<PipelinePathProps & AccountPathProps>>()

  const { branch, repoIdentifier, repoName, connectorRef, storeType } = useQueryParams<GitQueryParams>()

  const history = useHistory()

  const getTrialPipelineCreateForm = (
    onSubmit: (values: PipelineInfoConfig) => void,
    onClose: () => void
  ): React.ReactElement => {
    return getCDTrialDialog({
      actionProps: { onSuccess: onSubmit },
      trialType: TrialType.SET_UP_PIPELINE,
      onCloseModal: onClose
    })
  }

  const { modal } = useQueryParams<{ modal?: ModuleLicenseType }>()

  const getOtherModal = modal ? getTrialPipelineCreateForm : undefined
  const handleRunPipeline = (): void => {
    history.push(
      routes.toPipelineStudio({
        accountId,
        orgIdentifier,
        projectIdentifier,
        pipelineIdentifier,
        module,
        branch,
        repoIdentifier,
        repoName,
        connectorRef,
        storeType,
        runPipeline: true
      })
    )
  }
  const { licenseInformation } = useLicenseStore()
  const isCFEnabled = useFeatureFlag(FeatureFlag.CFNG_ENABLED)
  const isCIEnabled = useFeatureFlag(FeatureFlag.CING_ENABLED)
  const isCDEnabled = useFeatureFlag(FeatureFlag.CDNG_ENABLED)
  const isSTOEnabled = useFeatureFlag(FeatureFlag.SECURITY_STAGE)
  const isCustomStageEnabled = useFeatureFlag(FeatureFlag.NG_CUSTOM_STAGE)
  const { getString } = useStrings()

  return (
    <PipelineProvider
      stagesMap={stagesCollection.getAllStagesAttributes(getString)}
      queryParams={{ accountIdentifier: accountId, orgIdentifier, projectIdentifier, repoIdentifier, branch }}
      pipelineIdentifier={pipelineIdentifier}
      renderPipelineStage={args =>
        getCDPipelineStages({
          args,
          getString,
          isCIEnabled: licenseInformation['CI'] && isCIEnabled,
          isCDEnabled: licenseInformation['CD'] && isCDEnabled,
          isCFEnabled: licenseInformation['CF'] && isCFEnabled,
          isSTOEnabled,
          isApprovalStageEnabled: true,
          isCustomStageEnabled
        })
      }
      stepsFactory={factory}
      runPipeline={handleRunPipeline}
    >
      <PipelineStudio
        className={css.container}
        routePipelineStudio={routes.toPipelineStudio}
        routePipelineProject={routes.toDeployments}
        routePipelineDetail={routes.toPipelineDetail}
        routePipelineList={routes.toPipelines}
        getOtherModal={getOtherModal}
      />
    </PipelineProvider>
  )
}

export default CDPipelineStudio
