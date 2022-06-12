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
  InfraProvisioningWizardProps,
  WizardStep,
  InfraProvisiongWizardStepId,
  StepStatus

  // eslint-disable-next-line import/namespace
} from './Constants'
import { SelectWorkload, SelectWorkloadRef } from './SelectWorkload'
import css from './DeployProvisioningWizard.module.scss'
export const InfraProvisioningWizard: React.FC<InfraProvisioningWizardProps> = props => {
  const { lastConfiguredWizardStepId = InfraProvisiongWizardStepId.SelectWorkload } = props
  const { getString } = useStrings()
  const [disableBtn, setDisableBtn] = useState<boolean>(false)

  const [currentWizardStepId, setCurrentWizardStepId] =
    useState<InfraProvisiongWizardStepId>(lastConfiguredWizardStepId)

  const selectWorkloadRef = React.useRef<SelectWorkloadRef | null>(null)
  // const [showError, setShowError] = useState<boolean>(false)
  // const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  // const history = useHistory()
  const [showPageLoader] = useState<boolean>(false)

  const [wizardStepStatus, setWizardStepStatus] = useState<Map<InfraProvisiongWizardStepId, StepStatus>>(
    new Map<InfraProvisiongWizardStepId, StepStatus>([
      [InfraProvisiongWizardStepId.SelectWorkload, StepStatus.InProgress],
      [InfraProvisiongWizardStepId.SelectRepository, StepStatus.ToDo],
      [InfraProvisiongWizardStepId.SelectInfraStructure, StepStatus.ToDo]
    ])
  )

  const updateStepStatus = React.useCallback((stepIds: InfraProvisiongWizardStepId[], status: StepStatus) => {
    if (Array.isArray(stepIds)) {
      setWizardStepStatus((prevState: Map<InfraProvisiongWizardStepId, StepStatus>) => {
        const clonedState = new Map(prevState)
        stepIds.forEach((item: InfraProvisiongWizardStepId) => clonedState.set(item, status))
        return clonedState
      })
    }
  }, [])

  const WizardSteps: Map<InfraProvisiongWizardStepId, WizardStep> = new Map([
    [
      InfraProvisiongWizardStepId.SelectWorkload,
      {
        stepRender: (
          <SelectWorkload
            // ref={selectGitProviderRef}
            disableNextBtn={() => setDisableBtn(true)}
            enableNextBtn={() => setDisableBtn(false)}
            // selectedHosting={Hosting.SaaS}
          />
        ),
        onClickNext: () => {
          const { validate } = selectWorkloadRef.current || {}

          if (validate?.()) {
            setCurrentWizardStepId(InfraProvisiongWizardStepId.SelectRepository)
            updateStepStatus([InfraProvisiongWizardStepId.SelectWorkload], StepStatus.Success)
            updateStepStatus([InfraProvisiongWizardStepId.SelectRepository], StepStatus.InProgress)
            updateStepStatus([InfraProvisiongWizardStepId.SelectInfraStructure], StepStatus.ToDo)
          }
        },
        stepFooterLabel: 'cd.getStartedWithCD.configureRepo'
      }
    ]
    // [
    //   InfraProvisiongWizardStepId.SelectRepository,
    //   {
    //     stepRender: (
    //       <SelectRepository
    //         ref={selectRepositoryRef}
    //         showError={showError}
    //         validatedConnectorRef={selectGitProviderRef.current?.validatedConnector?.identifier}
    //         disableNextBtn={() => setDisableBtn(true)}
    //         enableNextBtn={() => setDisableBtn(false)}
    //       />
    //     ),
    //     onClickBack: () => {
    //       setCurrentWizardStepId(InfraProvisiongWizardStepId.SelectGitProvider)
    //       updateStepStatus(
    //         [InfraProvisiongWizardStepId.SelectGitProvider, InfraProvisiongWizardStepId.SelectRepository],
    //         StepStatus.ToDo
    //       )
    //     },
    //     onClickNext: () => {
    //       const selectedRepo = selectRepositoryRef.current?.repository
    //       if (selectedRepo && selectGitProviderRef?.current?.validatedConnector?.spec) {
    //         updateStepStatus([InfraProvisiongWizardStepId.SelectRepository], StepStatus.Success)
    //         setDisableBtn(true)
    //         setShowPageLoader(true)
    //         createSCMConnector({
    //           connector: set(
    //             set(
    //               selectGitProviderRef.current.validatedConnector,
    //               'spec.validationRepo',
    //               getFullRepoName(selectRepositoryRef?.current?.repository || {})
    //             ),
    //             'spec.authentication.spec.spec.username',
    //             OAUTH2_USER_NAME
    //           ),
    //           secret: selectGitProviderRef?.current?.validatedSecret
    //         }).then((validateRepositoryResponse: ResponseScmConnectorResponse) => {
    //           if (validateRepositoryResponse.status === Status.SUCCESS) {
    //             createPipelineV2Promise({
    //               body: constructPipelinePayload(selectedRepo) || '',
    //               queryParams: {
    //                 accountIdentifier: accountId,
    //                 orgIdentifier,
    //                 projectIdentifier
    //               },
    //               requestOptions: { headers: { 'Content-Type': 'application/yaml' } }
    //             })
    //               .then((createPipelineResponse: ResponsePipelineSaveResponse) => {
    //                 const { status } = createPipelineResponse
    //                 if (status === Status.SUCCESS && createPipelineResponse?.data?.identifier) {
    //                   const commonQueryParams = {
    //                     accountIdentifier: accountId,
    //                     orgIdentifier,
    //                     projectIdentifier,
    //                     targetIdentifier: createPipelineResponse?.data?.identifier
    //                   }
    //                 }
    //               })
    //               .catch(() => {
    //                 setDisableBtn(false)
    //                 setShowPageLoader(false)
    //               })
    //           }
    //         })
    //       } else {
    //         setShowError(true)
    //       }
    //     },
    //     stepFooterLabel: 'ci.getStartedWithCI.createPipeline'
    //   }
    // ]
  ])

  const { stepRender, onClickBack, onClickNext, stepFooterLabel } = WizardSteps.get(currentWizardStepId) ?? {}

  let buttonLabel: string
  if (stepFooterLabel) {
    if (currentWizardStepId === InfraProvisiongWizardStepId.SelectRepository) {
      buttonLabel = getString(stepFooterLabel)
    } else {
      buttonLabel = `${getString('next')}: ${getString(stepFooterLabel)}`
    }
  } else {
    buttonLabel = getString('next')
  }

  return stepRender ? (
    <Layout.Vertical
      padding={{ left: 'huge', right: 'huge', top: 'huge' }}
      flex={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
      height="100%"
    >
      <Container padding={{ top: 'large', bottom: 'large' }}>
        <MultiStepProgressIndicator
          progressMap={
            new Map([
              [0, wizardStepStatus.get(InfraProvisiongWizardStepId.SelectWorkload) || 'TODO'],
              [1, wizardStepStatus.get(InfraProvisiongWizardStepId.SelectRepository) || 'TODO'],
              [2, wizardStepStatus.get(InfraProvisiongWizardStepId.SelectInfraStructure) || 'TODO']
            ])
          }
        />
      </Container>
      <Layout.Vertical width="100%" height="80%" className={css.main}>
        {stepRender}
      </Layout.Vertical>
      <Layout.Horizontal
        spacing="medium"
        padding={{ top: 'large', bottom: 'xlarge' }}
        className={css.footer}
        width="100%"
      >
        {currentWizardStepId !== InfraProvisiongWizardStepId.SelectWorkload ? (
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
  ) : null
}
