/* eslint-disable no-restricted-imports */
/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'

import { Container, Button, ButtonVariation, Layout, MultiStepProgressIndicator, PageSpinner } from '@harness/uicore'
import { get } from 'lodash-es'
import { useHistory, useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'

import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import { createPipelineV2Promise, ResponsePipelineSaveResponse } from 'services/pipeline-ng'
import { Status } from '@common/utils/Constants'
import routes from '@common/RouteDefinitions'
import type { UserRepoResponse } from 'services/cd-ng'
import {
  WizardStep,
  StepStatus,
  DeployProvisiongWizardStepId,
  DeployProvisioningWizardProps

  // eslint-disable-next-line import/namespace
} from './Constants'
import { SelectWorkload, SelectWorkloadRef } from '../SelectWorkload/SelectWorkload'
import { SelectInfrastructure, SelectInfrastructureRef } from '../SelectInfrastructure/SelectInfrastructure'
import { SelectArtifact, SelectArtifactRef } from '../SelectArtifact/SelectArtifact'
import { useCDOnboardingContext } from '../CDOnboardingStore'
import { DEFAULT_PIPELINE_PAYLOAD, getUniqueEntityIdentifier } from '../cdOnboardingUtils'
import css from './DeployProvisioningWizard.module.scss'

export const DeployProvisioningWizard: React.FC<DeployProvisioningWizardProps> = props => {
  const { lastConfiguredWizardStepId = DeployProvisiongWizardStepId.SelectWorkload } = props
  const { getString } = useStrings()
  const [disableBtn, setDisableBtn] = useState<boolean>(false)

  const [currentWizardStepId, setCurrentWizardStepId] =
    useState<DeployProvisiongWizardStepId>(lastConfiguredWizardStepId)

  const selectWorkloadRef = React.useRef<SelectWorkloadRef | null>(null)
  const selectArtifactRef = React.useRef<SelectArtifactRef | null>(null)
  const selectInfrastructureRef = React.useRef<SelectInfrastructureRef | null>(null)
  // const [showError, setShowError] = useState<boolean>(false)
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  // const history = useHistory()
  const [showPageLoader] = useState<boolean>(false)

  const [wizardStepStatus, setWizardStepStatus] = useState<Map<DeployProvisiongWizardStepId, StepStatus>>(
    new Map<DeployProvisiongWizardStepId, StepStatus>([
      [DeployProvisiongWizardStepId.SelectWorkload, StepStatus.InProgress],
      [DeployProvisiongWizardStepId.SelectArtifact, StepStatus.ToDo],
      [DeployProvisiongWizardStepId.SelectInfrastructure, StepStatus.ToDo]
    ])
  )
  const history = useHistory()
  const {
    state: { service: serviceData }
  } = useCDOnboardingContext()

  const constructPipelinePayload = React.useCallback(
    (repository: UserRepoResponse): string | undefined => {
      const { name: repoName, namespace } = repository
      if (
        !repoName ||
        !namespace
        // || !selectGitProviderRef.current?.validatedConnector?.identifier
      ) {
        return
      }

      const payload = DEFAULT_PIPELINE_PAYLOAD
      payload.pipeline.name = `${getString('buildText')} ${repoName}`
      payload.pipeline.identifier = `${getString(
        'pipelineSteps.deploy.create.deployStageName'
      )}_${getUniqueEntityIdentifier(repoName)}` // pipeline identifier cannot have spaces
      payload.pipeline.projectIdentifier = projectIdentifier
      payload.pipeline.orgIdentifier = orgIdentifier
      // payload.pipeline.stages[0].stage.type = orgIdentifier
      // payload.pipeline.stages[0].stage.spec.deploymentType = get(serviceData, 'serviceDefinition.type')
      // payload.pipeline.stages[0].stage.spec.service.serviceRef = orgIdentifier
      // payload.pipeline.stages[0].stage.spec.environment.environmentRef = orgIdentifier
      // payload.pipeline.stages[0].stage.spec.environment.infrastructureDefinitions[0].identifier = orgIdentifier

      try {
        return yamlStringify(payload)
      } catch (e) {
        // Ignore error
      }
    },
    [projectIdentifier, orgIdentifier]
  )

  const setupPipeline = () => {
    try {
      createPipelineV2Promise({
        body: constructPipelinePayload(get(serviceData, 'data.repoValues')) || '',
        queryParams: {
          accountIdentifier: accountId,
          orgIdentifier,
          projectIdentifier
        },
        requestOptions: { headers: { 'Content-Type': 'application/yaml' } }
      }).then((createPipelineResponse: ResponsePipelineSaveResponse) => {
        const { status } = createPipelineResponse
        if (status === Status.SUCCESS && createPipelineResponse?.data?.identifier) {
          if (createPipelineResponse?.data?.identifier) {
            history.push(
              routes.toPipelineStudio({
                accountId: accountId,
                module: 'cd',
                orgIdentifier,
                projectIdentifier,
                pipelineIdentifier: createPipelineResponse?.data?.identifier,
                stageId: getString('buildText')
              })
            )
          }
        }
      })
    } catch (e) {
      setDisableBtn(false)
      // setShowPageLoader(false)
    }
  }

  const updateStepStatus = React.useCallback((stepIds: DeployProvisiongWizardStepId[], status: StepStatus) => {
    if (Array.isArray(stepIds)) {
      setWizardStepStatus((prevState: Map<DeployProvisiongWizardStepId, StepStatus>) => {
        const clonedState = new Map(prevState)
        stepIds.forEach((item: DeployProvisiongWizardStepId) => clonedState.set(item, status))
        return clonedState
      })
    }
  }, [])

  const WizardSteps: Map<DeployProvisiongWizardStepId, WizardStep> = new Map([
    [
      DeployProvisiongWizardStepId.SelectWorkload,
      {
        stepRender: (
          <SelectWorkload
            ref={selectWorkloadRef}
            onSuccess={() => {
              setCurrentWizardStepId(DeployProvisiongWizardStepId.SelectArtifact)
              updateStepStatus([DeployProvisiongWizardStepId.SelectWorkload], StepStatus.Success)
              updateStepStatus([DeployProvisiongWizardStepId.SelectArtifact], StepStatus.InProgress)
              updateStepStatus([DeployProvisiongWizardStepId.SelectInfrastructure], StepStatus.ToDo)
              updateStepStatus([DeployProvisiongWizardStepId.CreatePipeline], StepStatus.ToDo)
            }}
            disableNextBtn={() => setDisableBtn(true)}
            enableNextBtn={() => setDisableBtn(false)}
          />
        ),
        onClickNext: async () => {
          const { submitForm } = selectWorkloadRef.current || {}
          try {
            submitForm?.()
          } catch (_e) {
            // catch any errors and do nothing
          }
        },
        stepFooterLabel: 'cd.getStartedWithCD.configureRepo'
      }
    ],
    [
      DeployProvisiongWizardStepId.SelectArtifact,
      {
        stepRender: (
          <SelectArtifact
            ref={selectArtifactRef}
            onSuccess={() => {
              setCurrentWizardStepId(DeployProvisiongWizardStepId.SelectInfrastructure)
              updateStepStatus(
                [DeployProvisiongWizardStepId.SelectWorkload, DeployProvisiongWizardStepId.SelectArtifact],
                StepStatus.Success
              )
              updateStepStatus([DeployProvisiongWizardStepId.SelectInfrastructure], StepStatus.InProgress)
              updateStepStatus([DeployProvisiongWizardStepId.CreatePipeline], StepStatus.ToDo)
            }}
            // showError={showError}
            // validatedConnectorRef={selectGitProviderRef.current?.validatedConnector?.identifier}
            disableNextBtn={() => setDisableBtn(true)}
            enableNextBtn={() => setDisableBtn(false)}
          />
        ),
        onClickBack: () => {
          setCurrentWizardStepId(DeployProvisiongWizardStepId.SelectWorkload)
          updateStepStatus([DeployProvisiongWizardStepId.SelectArtifact], StepStatus.ToDo)
        },
        onClickNext: async () => {
          const { submitForm } = selectArtifactRef.current || {}

          try {
            submitForm?.()
          } catch (_e) {
            // catch any errors and do nothing
          }
        },

        stepFooterLabel: 'cd.getStartedWithCD.manifestFile'
      }
    ],
    [
      DeployProvisiongWizardStepId.SelectInfrastructure,
      {
        stepRender: (
          <SelectInfrastructure
            onSuccess={() => {
              setupPipeline()
              updateStepStatus(
                [
                  DeployProvisiongWizardStepId.SelectWorkload,
                  DeployProvisiongWizardStepId.SelectArtifact,
                  DeployProvisiongWizardStepId.SelectInfrastructure
                ],
                StepStatus.Success
              )
              updateStepStatus([DeployProvisiongWizardStepId.CreatePipeline], StepStatus.InProgress)
            }}
            ref={selectInfrastructureRef}
            disableNextBtn={() => setDisableBtn(true)}
            enableNextBtn={() => setDisableBtn(false)}
          />
        ),
        onClickBack: () => {
          setCurrentWizardStepId(DeployProvisiongWizardStepId.SelectArtifact)
          updateStepStatus([DeployProvisiongWizardStepId.SelectInfrastructure], StepStatus.ToDo)
        },
        onClickNext: async () => {
          // const { values, setFieldTouched, authValues } = selectInfrastructureRef.current || {}
          // const { infraType, envId, infraId, namespace } = values || {}
          // if (!infraType) {
          //   setFieldTouched?.('infraType', true)
          //   return
          // }
          const { submitForm } = selectInfrastructureRef.current || {}

          try {
            submitForm?.()
          } catch (_e) {
            // catch any errors and do nothing
          }
        },
        stepFooterLabel: 'common.createPipeline'
      }
    ]
  ])

  const { stepRender, onClickBack, onClickNext, stepFooterLabel } = WizardSteps.get(currentWizardStepId) ?? {}

  let buttonLabel: string
  if (stepFooterLabel) {
    if (currentWizardStepId === DeployProvisiongWizardStepId.SelectArtifact) {
      buttonLabel = getString(stepFooterLabel)
    } else {
      buttonLabel = `${getString('next')}: ${getString(stepFooterLabel)}`
    }
  } else {
    buttonLabel = getString('next')
  }

  return stepRender ? (
    <>
      <Container className={css.header}>
        <MultiStepProgressIndicator
          progressMap={
            new Map([
              [
                0,
                {
                  StepStatus: wizardStepStatus.get(DeployProvisiongWizardStepId.SelectWorkload) || 'TODO',
                  StepName: getString('pipelineSteps.workload')
                }
              ],
              [
                1,
                {
                  StepStatus: wizardStepStatus.get(DeployProvisiongWizardStepId.SelectArtifact) || 'TODO',
                  StepName: getString('pipeline.artifactTriggerConfigPanel.artifact')
                }
              ],
              [
                2,
                {
                  StepStatus: wizardStepStatus.get(DeployProvisiongWizardStepId.SelectInfrastructure) || 'TODO',
                  StepName: getString('infrastructureText')
                }
              ],
              [
                3,
                {
                  StepStatus: wizardStepStatus.get(DeployProvisiongWizardStepId.CreatePipeline) || 'TODO',
                  StepName: getString('common.pipeline')
                }
              ]
            ])
          }
        />
      </Container>
      <Layout.Vertical
        padding={{ left: 'huge', right: 'huge', top: 'huge' }}
        flex={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
        height="90%"
      >
        <Layout.Vertical width="100%" height="80%" className={css.main}>
          {stepRender}
        </Layout.Vertical>
        <Layout.Horizontal
          spacing="medium"
          padding={{ top: 'large', bottom: 'xlarge' }}
          className={css.footer}
          width="100%"
        >
          {currentWizardStepId !== DeployProvisiongWizardStepId.SelectWorkload ? (
            <Button
              variation={ButtonVariation.SECONDARY}
              text={getString('back')}
              icon="chevron-left"
              minimal
              onClick={() => onClickBack?.()}
            />
          ) : null}
          <Button
            text={buttonLabel}
            variation={ButtonVariation.PRIMARY}
            rightIcon="chevron-right"
            onClick={() => onClickNext?.()}
            disabled={disableBtn}
          />
        </Layout.Horizontal>
        {showPageLoader ? <PageSpinner /> : null}
      </Layout.Vertical>
    </>
  ) : null
}
