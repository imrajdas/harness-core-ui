/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { MutableRefObject, PropsWithChildren, useCallback, useContext, useEffect, useRef } from 'react'
import { debounce, get, isEmpty, set } from 'lodash-es'
import produce from 'immer'
import cx from 'classnames'

import { Card, Container, Text } from '@harness/uicore'

import { useStrings } from 'framework/strings'
import type { StageElementConfig } from 'services/cd-ng'

import { StageErrorContext } from '@pipeline/context/StageErrorContext'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepWidget } from '@pipeline/components/AbstractSteps/StepWidget'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { DeployTabs } from '@pipeline/components/PipelineStudio/CommonUtils/DeployStageSetupShellUtils'
import { useValidationErrors } from '@pipeline/components/PipelineStudio/PiplineHooks/useValidationErrors'
import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import type { DeploymentStageElementConfig } from '@pipeline/utils/pipelineTypes'
import { StageType } from '@pipeline/utils/stageHelpers'
import DeployServiceErrors from '@cd/components/PipelineStudio/DeployServiceSpecifications/DeployServiceErrors'
import stageCss from '../DeployStageSetupShell/DeployStage.module.scss'

export default function DeployEnvSpecifications(props: PropsWithChildren<unknown>): JSX.Element {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const { getString } = useStrings()
  const { submitFormsForTab } = useContext(StageErrorContext)
  const { errorMap } = useValidationErrors()
  useEffect(() => {
    if (errorMap.size > 0) {
      submitFormsForTab(DeployTabs.ENVIRONMENT)
    }
  }, [errorMap])

  const {
    state: {
      selectionState: { selectedStageId }
    },
    isReadonly,
    allowableTypes,
    getStageFromPipeline,
    updateStage
  } = usePipelineContext()

  const debounceUpdateStage = useCallback(
    debounce(
      (changedStage?: StageElementConfig) =>
        changedStage ? updateStage(changedStage) : /* instanbul ignore next */ Promise.resolve(),
      300
    ),
    [updateStage]
  )

  const { stage } = getStageFromPipeline<DeploymentStageElementConfig>(selectedStageId || '')

  useEffect(() => {
    if (isEmpty((stage?.stage?.spec as any)?.environment) && stage?.stage?.type === StageType.DEPLOY) {
      const stageData = produce(stage, draft => {
        if (draft) {
          set(draft, 'stage.spec', {
            ...stage.stage?.spec,
            environment: {}
          })
        }
      })
      debounceUpdateStage(stageData?.stage)
    }
  }, [])

  const updateEnvStep = useCallback(
    (value: any) => {
      const stageData = produce(stage, draft => {
        const specObject: any = get(draft, 'stage.spec', {})

        if (specObject) {
          if (value.environment) {
            specObject.environment = value.environment
            delete specObject.environmentGroup
          } else if (value.environmentGroup) {
            specObject.environmentGroup = value.environmentGroup
            delete specObject.environment
          }
        }
      })
      debounceUpdateStage(stageData?.stage)
    },
    [stage, debounceUpdateStage, stage?.stage?.spec?.infrastructure?.infrastructureDefinition]
  )

  return (
    <div className={stageCss.deployStage} key="1">
      <DeployServiceErrors domRef={scrollRef as MutableRefObject<HTMLElement | undefined>} />
      <div className={cx(stageCss.contentSection, stageCss.paddedSection)} ref={scrollRef}>
        <Text className={stageCss.tabHeading} id="environment" margin={{ bottom: 'small' }}>
          {getString('environment')}
        </Text>
        <Card>
          <StepWidget
            type={StepType.DeployInfrastructure}
            readonly={isReadonly}
            initialValues={{
              gitOpsEnabled: get(stage, 'stage.spec.gitOpsEnabled', false),
              ...(get(stage, 'stage.spec.environment', false) && { environment: get(stage, 'stage.spec.environment') }),
              ...(get(stage, 'stage.spec.environmentGroup', false) && {
                environmentGroup: get(stage, 'stage.spec.environmentGroup')
              })
            }}
            allowableTypes={allowableTypes}
            onUpdate={val => updateEnvStep(val)}
            factory={factory}
            stepViewType={StepViewType.Edit}
            customStepProps={{
              getString: getString,
              serviceRef: stage?.stage?.spec?.service?.serviceRef
            }}
          />
        </Card>
        <Container margin={{ top: 'xxlarge' }}>{props.children}</Container>
      </div>
    </div>
  )
}
