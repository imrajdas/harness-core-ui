/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { noop } from 'lodash-es'
import { Formik } from '@wings-software/uicore'

import { TestWrapper } from '@common/utils/testUtils'
import { StageErrorContext } from '@pipeline/context/StageErrorContext'
import {
  PipelineContext,
  PipelineContextInterface
} from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import ExecutionGraph from '@pipeline/components/PipelineStudio/ExecutionGraph/ExecutionGraph'
import { StageType } from '@pipeline/utils/stageHelpers'
import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
import { DeployServiceStep } from '@cd/components/PipelineSteps/DeployServiceStep/DeployServiceStep'
import { KubernetesServiceSpec } from '@cd/components/PipelineSteps/K8sServiceSpec/K8sServiceSpec'
import { DeployEnvironmentStep } from '@cd/components/PipelineSteps/DeployEnvStep/DeployEnvStep'
import { envs, services } from './mocks'
import overridePipelineContext from './overrideSetPipeline.json'
import DeployStageSetupShell from '../DeployStageSetupShell'

const context: PipelineContextInterface = {
  ...overridePipelineContext,
  getStageFromPipeline: jest.fn().mockReturnValue({
    stage: {
      stage: {
        name: 'Stage 3',
        identifier: 's3',
        type: StageType.DEPLOY,
        description: '',
        spec: {
          serviceConfig: {
            serviceDefinition: {
              type: 'Kubernetes'
            }
          },
          execution: {}
        },
        failureStrategies: {}
      }
    }
  }),
  updateStage: jest.fn().mockResolvedValue({}),
  updatePipeline: jest.fn(),
  updatePipelineView: jest.fn(),
  getStagePathFromPipeline: jest.fn(),
  setSelectedSectionId: jest.fn()
} as any

jest.mock('@pipeline/components/PipelineStudio/ExecutionGraph/ExecutionGraph')

jest.mock('@common/components/YAMLBuilder/YamlBuilder')
jest.mock('@common/utils/YamlUtils', () => ({
  validateJSONWithSchema: jest.fn(() => Promise.resolve(new Map()))
}))
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const fetchConnectors = () => Promise.resolve({})

jest.mock('services/cd-ng', () => ({
  useGetEnvironmentList: jest.fn().mockImplementation(() => ({ loading: false, data: envs, refetch: jest.fn() })),
  useGetServiceList: jest.fn().mockImplementation(() => ({ loading: false, data: services, refetch: jest.fn() })),
  useGetConnectorListV2: jest.fn().mockImplementation(() => ({ mutate: fetchConnectors })),
  useGetConnector: jest.fn().mockImplementation(() => {
    return { data: {}, refetch: jest.fn(), error: null }
  }),
  useGetServiceListForProject: jest.fn().mockImplementation(() => ({ loading: false, data: {}, refetch: jest.fn() })),
  useGetServiceV2: jest.fn().mockImplementation(() => ({ loading: false, data: {}, refetch: jest.fn() })),
  useGetFailureStrategiesYaml: jest.fn().mockReturnValue({
    data: {
      data: 'failureStrategies:\n  - onFailure:\n      errors:\n        - AllErrors\n      action:\n        type: StageRollback',
      status: 'SUCCESS'
    },
    loading: false
  }),
  useGetExecutionStrategyYaml: jest.fn().mockReturnValue({ refetch: jest.fn() }),
  useGetRuntimeInputsServiceEntity: jest.fn().mockReturnValue({})
}))

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const intersectionObserverMock = () => ({
  observe: () => null,
  unobserve: () => null
})

window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock)

window.HTMLElement.prototype.scrollTo = jest.fn()

describe('DeployStageSetupShell tests', () => {
  beforeAll(() => {
    factory.registerStep(new DeployServiceStep())
    factory.registerStep(new KubernetesServiceSpec())
    factory.registerStep(new DeployEnvironmentStep())
  })
  test('opens services tab by default', async () => {
    const { container, findByTestId } = render(
      <TestWrapper>
        <Formik initialValues={{}} onSubmit={noop} formName="test">
          <PipelineContext.Provider value={context}>
            <DeployStageSetupShell />
          </PipelineContext.Provider>
        </Formik>
      </TestWrapper>
    )

    const serviceTab = await findByTestId('service')

    expect(container).toMatchSnapshot()
    expect(serviceTab.getAttribute('aria-selected')).toBe('true')
    await waitFor(() =>
      expect(context.getStageFromPipeline).toBeCalledWith(context.state.selectionState.selectedStageId)
    )
    await waitFor(() => expect(context.getStageFromPipeline).toBeDefined())
  })

  test('Should handleChange be called when button previous is clicked', async () => {
    const errorContextProvider = {
      state: {} as any,
      checkErrorsForTab: jest.fn().mockResolvedValue(Promise.resolve()),
      subscribeForm: () => undefined,
      unSubscribeForm: () => undefined,
      submitFormsForTab: jest.fn()
    }
    const { container, findByTestId } = render(
      <TestWrapper>
        <Formik initialValues={{}} onSubmit={noop} formName="test">
          <PipelineContext.Provider value={context}>
            <StageErrorContext.Provider value={errorContextProvider}>
              <DeployStageSetupShell />
            </StageErrorContext.Provider>
          </PipelineContext.Provider>
        </Formik>
      </TestWrapper>
    )

    const button = (await waitFor(() => container.querySelector('[icon="chevron-left"]'))) as HTMLElement

    act(() => {
      fireEvent.click(button)
    })

    const overviewTab = await findByTestId('overview')

    expect(overviewTab.getAttribute('aria-selected')).toBe('true')
    expect(await waitFor(() => errorContextProvider.checkErrorsForTab)).toBeCalled()
    expect(await waitFor(() => errorContextProvider.checkErrorsForTab)).toBeCalledWith('SERVICE')
  })

  test('Should handleChange be called when button next is clicked', async () => {
    const errorContextProvider = {
      state: {} as any,
      checkErrorsForTab: jest.fn().mockResolvedValue(Promise.resolve()),
      subscribeForm: () => undefined,
      unSubscribeForm: () => undefined,
      submitFormsForTab: jest.fn()
    }
    const { container, findByTestId } = render(
      <TestWrapper>
        <Formik initialValues={{}} onSubmit={noop} formName="test">
          <PipelineContext.Provider value={context}>
            <StageErrorContext.Provider value={errorContextProvider}>
              <DeployStageSetupShell />
            </StageErrorContext.Provider>
          </PipelineContext.Provider>
        </Formik>
      </TestWrapper>
    )

    const button = (await waitFor(() => container.querySelector('[icon="chevron-right"]'))) as HTMLElement

    act(() => {
      fireEvent.click(button)
    })

    const infrastructureTab = await findByTestId('infrastructure')

    expect(infrastructureTab.getAttribute('aria-selected')).toBe('true')

    expect(await waitFor(() => errorContextProvider.checkErrorsForTab)).toBeCalled()
    expect(await waitFor(() => errorContextProvider.checkErrorsForTab)).toBeCalledWith('SERVICE')
  })

  test('Should warning icon not be shown when there are no erros', async () => {
    const errorContextProvider = {
      state: {} as any,
      checkErrorsForTab: jest.fn().mockResolvedValue(Promise.resolve()),
      subscribeForm: () => undefined,
      unSubscribeForm: () => undefined,
      submitFormsForTab: jest.fn()
    }

    const { findByTestId } = render(
      <TestWrapper>
        <Formik initialValues={{}} onSubmit={noop} formName="test">
          <PipelineContext.Provider value={context}>
            <StageErrorContext.Provider value={errorContextProvider}>
              <DeployStageSetupShell />
            </StageErrorContext.Provider>
          </PipelineContext.Provider>
        </Formik>
      </TestWrapper>
    )

    const serviceTab = await findByTestId('service')
    const servicesIcon = serviceTab.querySelector('[data-icon="services"]')
    await waitFor(() => expect(servicesIcon).toBeInTheDocument())

    const infrastructureTab = await findByTestId('infrastructure')
    const infrastructureIcon = infrastructureTab.querySelector('[data-icon="infrastructure"]')

    await waitFor(() => expect(infrastructureIcon).toBeInTheDocument())

    const executionTab = await findByTestId('execution')
    const executionIcon = await executionTab.querySelector('[data-icon="execution"]')

    await waitFor(() => expect(executionIcon).toBeInTheDocument)

    const advancedTab = await findByTestId('advanced')
    await waitFor(() => expect(advancedTab).toBeInTheDocument())
  })

  test('Should selectedTab be Execution', async () => {
    ;(ExecutionGraph as any).render.mockImplementation(({ updateStage, onEditStep }: any) => (
      <div>
        <button
          data-testid="execution-graph-mock-update"
          onClick={() =>
            updateStage({
              stage: {
                stage: {
                  name: 'Stage 3',
                  identifier: 's3',
                  type: StageType.DEPLOY,
                  description: '',
                  spec: {
                    execution: {}
                  }
                }
              }
            })
          }
        />
        <button data-testid="execution-graph-mock-edit" onClick={() => onEditStep({})} />
      </div>
    ))

    const errorContextProvider = {
      state: {} as any,
      checkErrorsForTab: jest.fn().mockResolvedValue(Promise.resolve()),
      subscribeForm: jest.fn(),
      unSubscribeForm: jest.fn(),
      submitFormsForTab: jest.fn()
    }
    const { container, findByTestId } = render(
      <TestWrapper>
        <Formik initialValues={{}} onSubmit={noop} formName="test">
          <PipelineContext.Provider value={context}>
            <StageErrorContext.Provider value={errorContextProvider}>
              <DeployStageSetupShell />
            </StageErrorContext.Provider>
          </PipelineContext.Provider>
        </Formik>
      </TestWrapper>
    )
    const buttonService = (await waitFor(() => container.querySelector('[icon="chevron-right"]'))) as HTMLElement

    act(() => {
      act(() => {
        fireEvent.click(buttonService)
      })
    })

    const infrastructureTab = await findByTestId('infrastructure')

    expect(infrastructureTab.getAttribute('aria-selected')).toBe('true')

    const buttonInfrastructure = (await waitFor(() => container.querySelector('[icon="chevron-right"]'))) as HTMLElement

    act(() => {
      act(() => {
        fireEvent.click(buttonInfrastructure)
      })
    })

    const executionTab = await findByTestId('execution')
    await waitFor(() => expect(executionTab.getAttribute('aria-selected')).toBe('true'))

    const buttonUpdate = (await waitFor(() => findByTestId('execution-graph-mock-update'))) as HTMLElement

    act(() => {
      fireEvent.click(buttonUpdate)
    })

    expect(await waitFor(() => context.updateStage)).toBeCalled()

    const buttonEdit = (await waitFor(() => findByTestId('execution-graph-mock-edit'))) as HTMLElement

    act(() => {
      fireEvent.click(buttonEdit)
    })

    expect(await waitFor(() => context.updatePipelineView)).toBeCalled()
  })
})
