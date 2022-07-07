/* eslint-disable no-restricted-imports */
/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'

import {
  Container,
  Button,
  ButtonVariation,
  Layout,
  MultiStepProgressIndicator,
  PageSpinner,
  useToaster
} from '@harness/uicore'
import produce from 'immer'
import { cloneDeep, defaultTo, get, isEmpty, omit, set } from 'lodash-es'
import { useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'

import {
  ManifestConfigWrapper,
  NGServiceConfig,
  ServiceRequestDTO,
  useCreateEnvironmentV2,
  useCreateServiceV2,
  useUpdateServiceV2
} from 'services/cd-ng'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { GitRepoName, ManifestDataType } from '@pipeline/components/ManifestSelection/Manifesthelper'
import type { ManifestTypes } from '@pipeline/components/ManifestSelection/ManifestInterface'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
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
import {
  cleanServiceDataUtil,
  cleanEnvironmentDataUtil,
  newEnvironmentState,
  newServiceState
} from '../cdOnboardingUtils'
import css from './DeployProvisioningWizard.module.scss'

export const DeployProvisioningWizard: React.FC<DeployProvisioningWizardProps> = props => {
  const { lastConfiguredWizardStepId = DeployProvisiongWizardStepId.SelectWorkload } = props
  const { getString } = useStrings()
  const { getRBACErrorMessage } = useRBACError()
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

  const {
    saveServiceData,
    saveEnvironmentData,
    saveInfrastructureData,
    state: { service: serviceData, environment: environmentData, infrastructure: infrastructureData }
  } = useCDOnboardingContext()

  const updateStepStatus = React.useCallback((stepIds: DeployProvisiongWizardStepId[], status: StepStatus) => {
    if (Array.isArray(stepIds)) {
      setWizardStepStatus((prevState: Map<DeployProvisiongWizardStepId, StepStatus>) => {
        const clonedState = new Map(prevState)
        stepIds.forEach((item: DeployProvisiongWizardStepId) => clonedState.set(item, status))
        return clonedState
      })
    }
  }, [])
  const { loading: createLoading, mutate: createService } = useCreateServiceV2({
    queryParams: {
      accountIdentifier: accountId
    }
  })
  const { mutate: updateService } = useUpdateServiceV2({
    queryParams: {
      accountIdentifier: accountId
    },
    requestOptions: {
      headers: {
        'content-type': 'application/yaml'
      }
    }
  })

  const { loading: createEnvLoading, mutate: createEnvironment } = useCreateEnvironmentV2({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const { showSuccess, showError, clear } = useToaster()

  const getUniqueServiceRef = (serviceRef: string): string => {
    return `${serviceRef}_${new Date().getTime().toString()}`
  }

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
        onClickNext: async () => {
          const {
            values,
            setFieldTouched
            //  validate
          } = selectWorkloadRef.current || {}
          const { workloadType, serviceDeploymentType, serviceRef } = values || {}
          if (!workloadType) {
            setFieldTouched?.('workloadType', true)
            return
          }
          if (!serviceDeploymentType) {
            setFieldTouched?.('serviceDeploymentType', true)
            return
          }

          const isServiceNameUpdated =
            isEmpty(get(serviceData, 'serviceDefinition.type')) || get(serviceData, 'name') !== serviceRef
          const updatedContextService = produce(newServiceState as NGServiceConfig, draft => {
            set(draft, 'service.name', serviceRef)
            set(
              draft,
              'service.identifier',
              isServiceNameUpdated ? getUniqueServiceRef(serviceRef as string) : get(serviceData, 'identifier')
            )
            set(draft, 'service.data.workload', workloadType)
            set(draft, 'service.serviceDefinition.type', serviceDeploymentType)
          })

          const cleanServiceData = cleanServiceDataUtil(updatedContextService.service as ServiceRequestDTO)

          if (isServiceNameUpdated) {
            try {
              const response = await createService({ ...cleanServiceData, orgIdentifier, projectIdentifier })
              if (response.status === 'SUCCESS') {
                serviceRef && saveServiceData({ service: updatedContextService.service, serviceResponse: response })
                clear()
                showSuccess(getString('cd.serviceCreated'))
              } else {
                throw response
              }
            } catch (error: any) {
              showError(getRBACErrorMessage(error))
            }
          }

          // if (validate?.()) {
          setCurrentWizardStepId(DeployProvisiongWizardStepId.SelectArtifact)
          updateStepStatus([DeployProvisiongWizardStepId.SelectWorkload], StepStatus.Success)
          updateStepStatus([DeployProvisiongWizardStepId.SelectArtifact], StepStatus.InProgress)
          updateStepStatus([DeployProvisiongWizardStepId.SelectInfrastructure], StepStatus.ToDo)
          updateStepStatus([DeployProvisiongWizardStepId.CreatePipeline], StepStatus.ToDo)

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
          updateStepStatus([DeployProvisiongWizardStepId.SelectArtifact], StepStatus.ToDo)
        },
        onClickNext: async () => {
          const { values, gitValues, manifestValues, repoValues, connectorResponse, setFieldTouched } =
            selectArtifactRef.current || {}
          const { artifactType } = values || {}
          if (!artifactType) {
            setFieldTouched?.('artifactType', true)
            return
          }
          const selectedManifest = ManifestDataType.K8sManifest as ManifestTypes
          const connectionType = GitRepoName.Account
          const manifestObj: ManifestConfigWrapper = {
            manifest: {
              identifier: defaultTo(manifestValues?.identifier, ''),
              type: selectedManifest, // fixed for initial designs
              spec: {
                store: {
                  type: gitValues?.gitProvider?.type,
                  spec: {
                    connectorRef: connectorResponse?.data?.connectorResponseDTO?.connector?.identifier,
                    gitFetchType: manifestValues?.gitFetchType,
                    paths:
                      typeof manifestValues?.paths === 'string'
                        ? manifestValues?.paths
                        : manifestValues?.paths?.map((path: { path: string }) => path.path)
                  }
                },
                valuesPaths:
                  typeof manifestValues?.valuesPaths === 'string'
                    ? manifestValues?.valuesPaths
                    : manifestValues?.valuesPaths?.map((path: { path: string }) => path.path)
              }
            }
          }
          if (connectionType === GitRepoName.Account) {
            set(manifestObj, 'manifest.spec.store.spec.repoName', repoValues?.name)
          }

          if (manifestObj?.manifest?.spec?.store) {
            if (manifestValues?.gitFetchType === 'Branch') {
              set(manifestObj, 'manifest.spec.store.spec.branch', manifestValues?.branch)
            } else if (manifestValues?.gitFetchType === 'Commit') {
              set(manifestObj, 'manifest.spec.store.spec.commitId', manifestValues?.commitId)
            }
          }

          if (selectedManifest === ManifestDataType.K8sManifest) {
            set(manifestObj, 'manifest.spec.skipResourceVersioning', false)
          }

          const updatedContextService = produce(serviceData as NGServiceConfig, draft => {
            set(draft, 'serviceDefinition.spec.manifests[0]', manifestObj)
            set(draft, 'data.artifactType', artifactType)
            set(draft, 'data.gitValues', gitValues)
            set(draft, 'data.manifestValues', manifestValues)
            set(draft, 'data.repoValues', repoValues)
          })

          saveServiceData({ service: updatedContextService })

          const serviceBody = { service: { ...omit(cloneDeep(updatedContextService), 'data') } }
          const body = {
            ...omit(cloneDeep(serviceBody.service), 'serviceDefinition', 'gitOpsEnabled'),
            projectIdentifier,
            orgIdentifier,
            yaml: yamlStringify({ ...serviceBody })
          }

          try {
            const response = await updateService(body)
            if (response.status !== 'SUCCESS') {
              //   showSuccess(getString('common.serviceCreated'))
              //   // fetchPipeline({ forceFetch: true, forceUpdate: true })
              // } else {
              throw response
            }
          } catch (e: any) {
            showError(e?.data?.message || e?.message || getString('commonError'))
          }

          setCurrentWizardStepId(DeployProvisiongWizardStepId.SelectInfrastructure)
          updateStepStatus(
            [DeployProvisiongWizardStepId.SelectWorkload, DeployProvisiongWizardStepId.SelectArtifact],
            StepStatus.Success
          )
          updateStepStatus([DeployProvisiongWizardStepId.SelectInfrastructure], StepStatus.InProgress)
          updateStepStatus([DeployProvisiongWizardStepId.CreatePipeline], StepStatus.ToDo)
        },

        stepFooterLabel: 'cd.getStartedWithCD.manifestFile'
      }
    ],
    [
      DeployProvisiongWizardStepId.SelectInfrastructure,
      {
        stepRender: (
          <SelectInfrastructure
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
          const { values, setFieldTouched } = selectInfrastructureRef.current || {}
          const { infraType, envId, infraId, namespace } = values || {}
          if (!infraType) {
            setFieldTouched?.('infraType', true)
            return
          }
          // const isEnvironmentNameUpdated =
          // isEmpty(get(environmentData, 'type')) || get(environmentData, 'name') !== envId

          const updatedContextEnvironment = produce(newEnvironmentState.environment, draft => {
            set(draft, 'name', envId)
            set(
              draft,
              'identifier',
              // isEnvironmentNameUpdated ?
              getUniqueServiceRef(envId as string)
              // : get(environmentData, 'identifier')
            )
          })

          const cleanEnvironmentData = cleanEnvironmentDataUtil(updatedContextEnvironment as ServiceRequestDTO)
          // if (isEnvironmentNameUpdated) {
          try {
            const response = await createEnvironment({ ...cleanEnvironmentData, orgIdentifier, projectIdentifier })
            if (response.status === 'SUCCESS') {
              envId &&
                saveEnvironmentData({
                  environment: updatedContextEnvironment,
                  environmentResponse: response
                })
              const updatedContextInfra = produce(newEnvironmentState.infrastructure, draft => {
                set(draft, 'type', infraType)
                set(draft, 'name', infraId)
                set(draft, 'environmentRef', envId)
                set(draft, 'infrastructureDefinition.spec.namespace', namespace)
              })
              saveInfrastructureData({
                infrastructure: { ...updatedContextInfra }
              })
              clear()
              showSuccess(getString('cd.environmentCreated'))
            } else {
              throw response
            }
          } catch (error: any) {
            showError(getRBACErrorMessage(error))
          }
          // }

          // setCurrentWizardStepId(DeployProvisiongWizardStepId.CreatePipeline)
          updateStepStatus(
            [
              DeployProvisiongWizardStepId.SelectWorkload,
              DeployProvisiongWizardStepId.SelectArtifact,
              DeployProvisiongWizardStepId.SelectInfrastructure
            ],
            StepStatus.Success
          )
          updateStepStatus([DeployProvisiongWizardStepId.CreatePipeline], StepStatus.InProgress)
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

  if (createLoading || createEnvLoading) {
    return <PageSpinner />
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
