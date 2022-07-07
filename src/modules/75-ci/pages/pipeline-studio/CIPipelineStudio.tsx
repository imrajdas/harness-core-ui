/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { getCIPipelineStages } from '@ci/components/PipelineStudio/CIPipelineStagesUtils'
import { getCITrialDialog } from '@ci/modals/CITrial/useCITrialModal'
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
import { useStrings } from 'framework/strings'
import { PipelineProvider } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { PipelineStudio } from '@pipeline/components/PipelineStudio/PipelineStudio'

import type { PipelineInfoConfig } from 'services/pipeline-ng'
import { useQueryParams } from '@common/hooks'
import { useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import { TrialType } from '@pipeline/components/TrialModalTemplate/trialModalUtils'
import { FeatureFlag } from '@common/featureFlags'
import type { ModuleLicenseType } from '@common/constants/SubscriptionTypes'
import css from './CIPipelineStudio.module.scss'

const CIPipelineStudio: React.FC = (): JSX.Element => {
  const { accountId, projectIdentifier, orgIdentifier, pipelineIdentifier, module } =
    useParams<PipelineType<PipelinePathProps & AccountPathProps>>()
  const { getString } = useStrings()
  const history = useHistory()

  const getTrialPipelineCreateForm = (
    onSubmit: (values: PipelineInfoConfig) => void,
    onClose: () => void
  ): React.ReactElement =>
    getCITrialDialog({
      actionProps: { onSuccess: onSubmit },
      trialType: TrialType.SET_UP_PIPELINE,
      onCloseModal: onClose
    })

  const { modal, branch, repoIdentifier, connectorRef, repoName, storeType } = useQueryParams<
    { modal?: ModuleLicenseType } & GitQueryParams
  >()

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
        connectorRef,
        repoName,
        storeType,
        runPipeline: true
      })
    )
  }
  const isCDEnabled = useFeatureFlag(FeatureFlag.CDNG_ENABLED)
  const isCFEnabled = useFeatureFlag(FeatureFlag.CFNG_ENABLED)
  const isCIEnabled = useFeatureFlag(FeatureFlag.CING_ENABLED)
  const isSTOEnabled = useFeatureFlag(FeatureFlag.SECURITY_STAGE)
  const isCustomStageEnabled = useFeatureFlag(FeatureFlag.NG_CUSTOM_STAGE)
  const { licenseInformation } = useLicenseStore()
  return (
    <PipelineProvider
      stagesMap={stagesCollection.getAllStagesAttributes(getString)}
      queryParams={{ accountIdentifier: accountId, orgIdentifier, projectIdentifier, repoIdentifier, branch }}
      pipelineIdentifier={pipelineIdentifier}
      renderPipelineStage={args =>
        getCIPipelineStages(
          args,
          getString,
          licenseInformation['CI'] && isCIEnabled,
          licenseInformation['CD'] && isCDEnabled,
          licenseInformation['CF'] && isCFEnabled,
          isSTOEnabled,
          true,
          isCustomStageEnabled
        )
      }
      stepsFactory={factory}
      runPipeline={handleRunPipeline}
    >
      <PipelineStudio
        className={css.container}
        routePipelineStudio={routes.toPipelineStudio}
        routePipelineDetail={routes.toPipelineDetail}
        routePipelineProject={routes.toDeployments}
        routePipelineList={routes.toPipelines}
        getOtherModal={getOtherModal}
      />
    </PipelineProvider>
  )
}

export default CIPipelineStudio
