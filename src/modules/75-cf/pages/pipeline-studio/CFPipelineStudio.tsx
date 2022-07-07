/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams, useHistory } from 'react-router-dom'
import type { UseStringsReturn } from 'framework/strings'
import { PipelineStages, PipelineStagesProps } from '@pipeline/components/PipelineStages/PipelineStages'
import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
import { stagesCollection } from '@pipeline/components/PipelineStudio/Stages/StagesCollection'
import routes from '@common/RouteDefinitions'
import { StageType } from '@pipeline/utils/stageHelpers'
import type {
  AccountPathProps,
  GitQueryParams,
  PipelinePathProps,
  PipelineType
} from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'
import { PipelineProvider } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { PipelineStudio } from '@pipeline/components/PipelineStudio/PipelineStudio'
import { useQueryParams } from '@common/hooks'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import { FeatureFlag } from '@common/featureFlags'
import css from './CFPipelineStudio.module.scss'

const CIPipelineStudio: React.FC = (): JSX.Element => {
  const {
    accountId: accountIdentifier,
    projectIdentifier,
    orgIdentifier,
    pipelineIdentifier,
    module
  } = useParams<PipelineType<PipelinePathProps & AccountPathProps>>()
  const { branch, repoIdentifier, connectorRef, repoName, storeType } = useQueryParams<GitQueryParams>()
  const { getString } = useStrings()
  const history = useHistory()
  const handleRunPipeline = (): void => {
    history.push(
      routes.toPipelineStudio({
        accountId: accountIdentifier,
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
  const isCustomStageEnabled = useFeatureFlag(FeatureFlag.NG_CUSTOM_STAGE)
  const { licenseInformation } = useLicenseStore()
  return (
    <PipelineProvider
      stagesMap={stagesCollection.getAllStagesAttributes(getString)}
      queryParams={{ accountIdentifier, orgIdentifier, projectIdentifier, repoIdentifier, branch }}
      pipelineIdentifier={pipelineIdentifier}
      renderPipelineStage={args =>
        getCFPipelineStages(
          args,
          getString,
          licenseInformation['CI'] && isCIEnabled,
          licenseInformation['CD'] && isCDEnabled,
          licenseInformation['CF'] && isCFEnabled,
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
      />
    </PipelineProvider>
  )
}

export const getCFPipelineStages: (
  args: Omit<PipelineStagesProps, 'children'>,
  getString: UseStringsReturn['getString'],
  isCIEnabled?: boolean,
  isCDEnabled?: boolean,
  isCFEnabled?: boolean,
  isApprovalStageEnabled?: boolean,
  isCustomStageEnabled?: boolean
) => React.ReactElement<PipelineStagesProps> = (
  args,
  getString,
  _isCIEnabled = false,
  _isCDEnabled = false,
  isCFEnabled = false,
  isApprovalStageEnabled = true,
  isCustomStageEnabled = false
) => {
  return (
    <PipelineStages {...args}>
      {stagesCollection.getStage(StageType.FEATURE, isCFEnabled, getString)}
      {/* {stagesCollection.getStage(StageType.DEPLOY, isCDEnabled, getString)}
      {stagesCollection.getStage(StageType.BUILD, isCIEnabled, getString)}
      {stagesCollection.getStage(StageType.PIPELINE, false, getString)} */}
      {stagesCollection.getStage(StageType.APPROVAL, isApprovalStageEnabled, getString)}
      {stagesCollection.getStage(StageType.CUSTOM, isCustomStageEnabled, getString)}
      {stagesCollection.getStage(StageType.Template, false, getString)}
    </PipelineStages>
  )
}

export default CIPipelineStudio
