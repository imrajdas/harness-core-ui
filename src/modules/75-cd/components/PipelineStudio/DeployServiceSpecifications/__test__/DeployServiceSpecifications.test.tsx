/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

/* eslint-disable jest/no-disabled-tests */
import React from 'react'
import { act, fireEvent, render, waitFor, getByText as getElementByText } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { noop } from 'lodash-es'
import { Formik } from '@wings-software/uicore'

import { TestWrapper } from '@common/utils/testUtils'
import {
  PipelineContextInterface,
  PipelineContext
} from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { StageType } from '@pipeline/utils/stageHelpers'
import * as useValidationErrors from '@pipeline/components/PipelineStudio/PiplineHooks/useValidationErrors'
import { StageErrorContext } from '@pipeline/context/StageErrorContext'
import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
import { DeployServiceStep } from '@cd/components/PipelineSteps/DeployServiceStep/DeployServiceStep'
import { KubernetesServiceSpec } from '@cd/components/PipelineSteps/K8sServiceSpec/K8sServiceSpec'
import { ServerlessAwsLambdaServiceSpec } from '@cd/components/PipelineSteps/ServerlessAwsLambdaServiceSpec/ServerlessAwsLambdaServiceSpec'
import services, { servicesV2Mock } from './servicesMock'
import mockListSecrets from './mockListSecret.json'
import connectorListJSON from './connectorList.json'
import DeployServiceSpecifications from '../DeployServiceSpecifications'
import overridePipelineContext from './overrideSetPipeline.json'

const setDefaultServiceSchema = jest.fn()
const mockchildren = <div />
const getOverrideContextValue = (): PipelineContextInterface => {
  return {
    ...overridePipelineContext,
    getStageFromPipeline: jest.fn().mockReturnValue({
      stage: {
        stage: {
          name: 'Stage 3',
          identifier: 's3',
          type: StageType.DEPLOY,
          description: '',
          spec: {}
        }
      }
    }),
    updateStage: jest.fn(),
    updatePipeline: jest.fn()
  } as any
}

jest.mock('@common/components/YAMLBuilder/YamlBuilder')
jest.mock('@wings-software/monaco-yaml/lib/esm/languageservice/yamlLanguageService', () => ({
  getLanguageService: jest.fn()
}))

jest.mock('services/cd-ng', () => ({
  getConnectorListPromise: () => Promise.resolve(connectorListJSON),
  useGetConnectorListV2: jest.fn().mockImplementation(() => ({
    loading: false,
    data: connectorListJSON,
    mutate: jest.fn().mockImplementation(() => ({ loading: false, data: connectorListJSON })),
    refetch: jest.fn()
  })),
  useGetServiceList: jest.fn().mockImplementation(() => ({ loading: false, data: servicesV2Mock, refetch: jest.fn() })),
  useGetServiceV2: jest.fn().mockImplementation(() => ({ loading: false, data: {}, refetch: jest.fn() })),
  listSecretsV2Promise: jest.fn().mockImplementation(() => Promise.resolve(mockListSecrets)),
  useGetServiceListForProject: jest
    .fn()
    .mockImplementation(() => ({ loading: false, data: services, refetch: jest.fn() })),
  usePostSecretTextV2: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  usePostSecretFileV2: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  usePutSecret: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  usePostSecret: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  usePutSecretTextV2: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  usePutSecretFileV2: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  usePutSecretViaYaml: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  useGetConnectorList: jest.fn(() => ({ data: null }))
}))

jest.mock('lodash-es', () => ({
  ...(jest.requireActual('lodash-es') as Record<string, any>),
  debounce: jest.fn(fn => {
    fn.cancel = jest.fn()
    return fn
  }),
  noop: jest.fn()
}))

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const intersectionObserverMock = () => ({
  observe: () => null,
  unobserve: () => null
})

window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock)

describe('Deploy service stage specifications', () => {
  beforeAll(() => {
    factory.registerStep(new DeployServiceStep())
    factory.registerStep(new KubernetesServiceSpec())
    factory.registerStep(new ServerlessAwsLambdaServiceSpec())
  })
  test(`Propagate from option and dropdown to select previous stage and service should be present`, async () => {
    const { getByPlaceholderText, getByText } = render(
      <TestWrapper>
        <Formik initialValues={{}} onSubmit={noop} formName="deployServiceSpecificationsTest">
          <PipelineContext.Provider value={getOverrideContextValue()}>
            <DeployServiceSpecifications setDefaultServiceSchema={setDefaultServiceSchema}>
              {mockchildren}
            </DeployServiceSpecifications>
          </PipelineContext.Provider>
        </Formik>
      </TestWrapper>
    )

    const propagateFromDropdownDiv = document.getElementsByClassName('stageSelectDropDown')[0]
    act(() => {
      fireEvent.click(propagateFromDropdownDiv)
    })
    const propagateFromDropdown = getByPlaceholderText('- pipeline.selectStagePlaceholder -')
    act(() => {
      userEvent.selectOptions(propagateFromDropdown, 'st1')
    })

    //  Service 1 Option
    const service1Option = getByText('Stage [Stage 1] - Service [Service 1]')
    expect(service1Option).toBeInTheDocument()
    act(() => {
      fireEvent.click(service1Option)
    })
    expect((propagateFromDropdown as HTMLInputElement).value).toBe('Stage [Stage 1] - Service [Service 1]')

    //  Other Service Option
    const service2Option = getByText('Stage [Stage 2] - Service [Other Service]')
    expect(service2Option).toBeInTheDocument()
    act(() => {
      fireEvent.click(service2Option)
    })
    expect((propagateFromDropdown as HTMLInputElement).value).toBe('Stage [Stage 2] - Service [Other Service]')

    //  Another Service Option
    const service3Option = getByText('Stage [Template Stage] - [Template]')
    expect(service3Option).toBeInTheDocument()
    act(() => {
      fireEvent.click(service3Option)
    })
    expect((propagateFromDropdown as HTMLInputElement).value).toBe('Stage [Template Stage] - [Template]')
  })

  test(`Variables section is present`, async () => {
    const { queryByText } = render(
      <TestWrapper>
        <Formik initialValues={{}} onSubmit={noop} formName="deployServiceSpecificationsTest">
          <PipelineContext.Provider value={getOverrideContextValue()}>
            <DeployServiceSpecifications setDefaultServiceSchema={setDefaultServiceSchema}>
              {mockchildren}
            </DeployServiceSpecifications>
          </PipelineContext.Provider>
        </Formik>
      </TestWrapper>
    )

    await waitFor(() => expect(queryByText('common.variables')).toBeTruthy())
  })

  test('Should Deployment Type section be present', async () => {
    const { findByText } = render(
      <TestWrapper>
        <Formik initialValues={{}} onSubmit={noop} formName="deployServiceSpecificationsTest">
          <PipelineContext.Provider value={getOverrideContextValue()}>
            <DeployServiceSpecifications setDefaultServiceSchema={setDefaultServiceSchema}>
              {mockchildren}
            </DeployServiceSpecifications>
          </PipelineContext.Provider>
        </Formik>
      </TestWrapper>
    )

    expect(await waitFor(() => findByText('deploymentTypeText'))).toBeInTheDocument()
  })

  test('Should call submitFormsForTab when errorMap is not empty', async () => {
    const errorContextProvider = {
      state: {} as any,
      checkErrorsForTab: jest.fn().mockResolvedValue(Promise.resolve()),
      subscribeForm: () => undefined,
      unSubscribeForm: () => undefined,
      submitFormsForTab: jest.fn()
    }

    jest.spyOn(useValidationErrors, 'useValidationErrors').mockReturnValue({ errorMap: new Map([['error', []]]) })

    render(
      <TestWrapper>
        <Formik initialValues={{}} onSubmit={noop} formName="deployServiceSpecificationsTest">
          <PipelineContext.Provider value={getOverrideContextValue()}>
            <StageErrorContext.Provider value={errorContextProvider}>
              <DeployServiceSpecifications setDefaultServiceSchema={setDefaultServiceSchema}>
                {mockchildren}
              </DeployServiceSpecifications>
            </StageErrorContext.Provider>
          </PipelineContext.Provider>
        </Formik>
      </TestWrapper>
    )

    expect(errorContextProvider.submitFormsForTab).toBeCalled()
  })

  test('Deployment types should have Serverless Lambda as a part of it', async () => {
    getOverrideContextValue().state.selectionState.selectedStageId = 'st1'
    const { getByText } = render(
      <TestWrapper defaultFeatureFlagValues={{ SERVERLESS_SUPPORT: true }}>
        <PipelineContext.Provider value={getOverrideContextValue()}>
          <DeployServiceSpecifications setDefaultServiceSchema={setDefaultServiceSchema}>
            {mockchildren}
          </DeployServiceSpecifications>
        </PipelineContext.Provider>
      </TestWrapper>
    )
    expect(getByText('deploymentTypeText')).toBeInTheDocument()

    const serverlessLambda = getByText('pipeline.serviceDeploymentTypes.serverlessAwsLambda')
    userEvent.click(serverlessLambda)
    await waitFor(() => expect(getByText('pipelineSteps.serviceTab.manifestList.addManifest')).toBeInTheDocument())
  })

  test('Add manifest dialog should display manifest store screen directly if Serverless Lambda is deployment type', async () => {
    getOverrideContextValue().state.selectionState.selectedStageId = 'st1'
    const { getByText } = render(
      <TestWrapper defaultFeatureFlagValues={{ SERVERLESS_SUPPORT: true }}>
        <PipelineContext.Provider value={getOverrideContextValue()}>
          <DeployServiceSpecifications setDefaultServiceSchema={setDefaultServiceSchema}>
            {mockchildren}
          </DeployServiceSpecifications>
        </PipelineContext.Provider>
      </TestWrapper>
    )
    expect(getByText('deploymentTypeText')).toBeDefined()

    const serverlessLambda = getByText('pipeline.serviceDeploymentTypes.serverlessAwsLambda')
    userEvent.click(serverlessLambda)
    await waitFor(() => expect(getByText('pipelineSteps.serviceTab.manifestList.addManifest')).toBeDefined())
    const addManifestButton = getByText('pipelineSteps.serviceTab.manifestList.addManifest')
    userEvent.click(addManifestButton)

    // Find Add Manifest dialog portal div
    const portalDivElements = document.getElementsByClassName('bp3-portal')
    await waitFor(() => expect(portalDivElements.length).toBe(1))
    const portalDiv = portalDivElements[0] as HTMLElement

    // Check if second tab is opened by default
    expect(
      getElementByText(portalDiv, 'common.specify pipeline.manifestTypeLabels.ServerlessAwsLambda store')
    ).toBeDefined()

    // Check if tab names are appearing properly, first step should be completed and should have
    // chosen manifest type as subtitle
    const completedStepDivElements = portalDiv.getElementsByClassName('StepWizard--completedStep')
    expect(completedStepDivElements.length).toBe(1)
    expect(getElementByText(portalDiv, 'pipeline.manifestType.manifestRepoType')).toBeDefined()
    const subTitleDivElements = portalDiv.getElementsByClassName('subtitle')
    expect(subTitleDivElements.length).toBe(1)
    expect(getElementByText(portalDiv, 'pipeline.manifestTypeLabels.ServerlessAwsLambda')).toBeDefined()

    expect(getElementByText(portalDiv, 'pipeline.manifestType.manifestSource')).toBeDefined()
    expect(getElementByText(portalDiv, 'pipeline.manifestType.manifestDetails')).toBeDefined()

    // Check for all store types and select GitHub
    expect(getElementByText(portalDiv, 'pipeline.manifestType.gitConnectorLabel')).toBeDefined()
    expect(getElementByText(portalDiv, 'common.repo_provider.githubLabel')).toBeDefined()
    expect(getElementByText(portalDiv, 'common.repo_provider.gitlabLabel')).toBeDefined()
    expect(getElementByText(portalDiv, 'pipeline.manifestType.bitBucketLabel')).toBeDefined()
  })
})
