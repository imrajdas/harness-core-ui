/* eslint-disable no-restricted-imports */
/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'

import { Container, Button, ButtonVariation, Layout, MultiStepProgressIndicator, PageSpinner } from '@harness/uicore'
import { useStrings } from 'framework/strings'

import {
  WizardStep,
  StepStatus,
  DeployProvisiongWizardStepId,
  DeployProvisioningWizardProps

  // eslint-disable-next-line import/namespace
} from './Constants'
import { SelectWorkload, SelectWorkloadRef } from '../SelectWorkload/SelectWorkload'
import { SelectInfrastructure } from '../SelectInfrastructure/SelectInfrastructure'
import { SelectArtifact, SelectArtifactRef } from '../SelectArtifact/SelectArtifact'
import css from './DeployProvisioningWizard.module.scss'
export const DeployProvisioningWizard: React.FC<DeployProvisioningWizardProps> = props => {
  const { lastConfiguredWizardStepId = DeployProvisiongWizardStepId.SelectWorkload } = props
  const { getString } = useStrings()
  const [disableBtn, setDisableBtn] = useState<boolean>(false)

  const [currentWizardStepId, setCurrentWizardStepId] =
    useState<DeployProvisiongWizardStepId>(lastConfiguredWizardStepId)

  const selectWorkloadRef = React.useRef<SelectWorkloadRef | null>(null)
  const selectArtifactRef = React.useRef<SelectArtifactRef | null>(null)
  // const [showError, setShowError] = useState<boolean>(false)
  // const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  // const history = useHistory()
  const [showPageLoader] = useState<boolean>(false)

  const [wizardStepStatus, setWizardStepStatus] = useState<Map<DeployProvisiongWizardStepId, StepStatus>>(
    new Map<DeployProvisiongWizardStepId, StepStatus>([
      [DeployProvisiongWizardStepId.SelectWorkload, StepStatus.InProgress],
      [DeployProvisiongWizardStepId.SelectArtifact, StepStatus.ToDo],
      [DeployProvisiongWizardStepId.SelectInfrastructure, StepStatus.ToDo]
    ])
  )

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
            disableNextBtn={() => setDisableBtn(true)}
            enableNextBtn={() => setDisableBtn(false)}
          />
        ),
        onClickNext: () => {
          const { values, setFieldTouched } = selectWorkloadRef.current || {}
          const { workloadType, serviceDeploymentType } = values || {}
          if (!workloadType) {
            setFieldTouched?.('workloadType', true)
            return
          }
          if (!serviceDeploymentType) {
            setFieldTouched?.('serviceDeploymentType', true)
            return
          }
          // if (validate?.()) {
          setCurrentWizardStepId(DeployProvisiongWizardStepId.SelectArtifact)
          updateStepStatus([DeployProvisiongWizardStepId.SelectWorkload], StepStatus.Success)
          updateStepStatus([DeployProvisiongWizardStepId.SelectArtifact], StepStatus.InProgress)
          updateStepStatus([DeployProvisiongWizardStepId.SelectInfrastructure], StepStatus.ToDo)
          // }
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
            // showError={showError}
            // validatedConnectorRef={selectGitProviderRef.current?.validatedConnector?.identifier}
            disableNextBtn={() => setDisableBtn(true)}
            enableNextBtn={() => setDisableBtn(false)}
          />
        ),
        onClickBack: () => {
          setCurrentWizardStepId(DeployProvisiongWizardStepId.SelectWorkload)
          updateStepStatus(
            [DeployProvisiongWizardStepId.SelectWorkload, DeployProvisiongWizardStepId.SelectArtifact],
            StepStatus.ToDo
          )
        },
        onClickNext: () => {
          const { values, setFieldTouched } = selectArtifactRef.current || {}
          const { artifactType } = values || {}
          if (!artifactType) {
            setFieldTouched?.('artifactType', true)
            return
          }
          setCurrentWizardStepId(DeployProvisiongWizardStepId.SelectInfrastructure)
          updateStepStatus(
            [DeployProvisiongWizardStepId.SelectWorkload, DeployProvisiongWizardStepId.SelectArtifact],
            StepStatus.Success
          )
          updateStepStatus([DeployProvisiongWizardStepId.SelectInfrastructure], StepStatus.ToDo)
        },

        stepFooterLabel: 'cd.getStartedWithCD.manifestFile'
      }
    ],
    [
      DeployProvisiongWizardStepId.SelectInfrastructure,
      {
        stepRender: (
          <SelectInfrastructure
            // ref={selectInfrastructureProviderRef}
            disableNextBtn={() => setDisableBtn(true)}
            enableNextBtn={() => setDisableBtn(false)}
          />
        ),
        onClickBack: () => {
          setCurrentWizardStepId(DeployProvisiongWizardStepId.SelectArtifact)
          updateStepStatus(
            [DeployProvisiongWizardStepId.SelectWorkload, DeployProvisiongWizardStepId.SelectArtifact],
            StepStatus.ToDo
          )
        },
        onClickNext: () => {
          updateStepStatus(
            [
              DeployProvisiongWizardStepId.SelectWorkload,
              DeployProvisiongWizardStepId.SelectArtifact,
              DeployProvisiongWizardStepId.SelectInfrastructure
            ],
            StepStatus.Success
          )
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
              [0, wizardStepStatus.get(DeployProvisiongWizardStepId.SelectWorkload) || 'TODO'],
              [1, wizardStepStatus.get(DeployProvisiongWizardStepId.SelectArtifact) || 'TODO'],
              [2, wizardStepStatus.get(DeployProvisiongWizardStepId.SelectInfrastructure) || 'TODO']
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
