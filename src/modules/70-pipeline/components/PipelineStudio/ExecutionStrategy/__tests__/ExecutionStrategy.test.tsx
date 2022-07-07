/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, render, act, getByTestId, getByText, getAllByTestId, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import type { StageElementWrapperConfig } from 'services/pipeline-ng'
import * as cdngServices from 'services/cd-ng'
import { ExecutionStrategy } from '../ExecutionStrategy'
import {
  executionStrategies,
  rollingYaml,
  blueGreenYaml,
  canaryYaml,
  defaultYaml,
  getDummyPipelineContextValue,
  defaultUpdateStageFnArg,
  canaryUpdateStageFnArg,
  blueGreenUpdateStageFnArg,
  rollingUpdateStageFnArg
} from './mocks/mock'
import { PipelineContext, PipelineContextInterface } from '../../PipelineContext/PipelineContext'

jest
  .spyOn(cdngServices, 'useGetExecutionStrategyYaml')
  .mockImplementation((props: cdngServices.UseGetExecutionStrategyYamlProps) => {
    switch (props.queryParams?.strategyType) {
      case 'Rolling':
        return {
          data: rollingYaml,
          error: null
        } as any
      case 'BlueGreen':
        return {
          data: blueGreenYaml,
          error: null
        } as any
      case 'Canary':
        return {
          data: canaryYaml,
          error: null
        } as any
      case 'Default':
        return {
          data: defaultYaml,
          error: null
        } as any
      default:
        break
    }
  })

const getLoader = (container: HTMLElement): Element =>
  container.querySelector('[data-test="executionStrategyListLoader"]')!
const getError = (container: HTMLElement): Element =>
  container.querySelector('[data-test="executionStrategyListError"]')!

describe('ExecutionStrategy test', () => {
  let rollingCard: HTMLElement
  let blueGreenCard: HTMLElement
  let canaryCard: HTMLElement
  let blankCanvasCard: HTMLElement
  let component: HTMLElement
  let pipelineContextMockValue: PipelineContextInterface
  beforeEach(() => {
    jest
      .spyOn(cdngServices, 'useGetExecutionStrategyList')
      .mockImplementation(() => ({ data: executionStrategies, error: null } as any))

    pipelineContextMockValue = getDummyPipelineContextValue()
    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectId/pipelines/:pipelineIdentifier/pipeline-studio"
        pathParams={{
          accountId: 'dummy',
          orgIdentifier: 'testOrg',
          projectId: 'testProject',
          pipelineIdentifier: 'test'
        }}
        queryParams={{
          stageId: 'testStage',
          sectionId: 'EXECUTION'
        }}
      >
        <PipelineContext.Provider value={pipelineContextMockValue}>
          <ExecutionStrategy
            selectedStage={
              {
                stage: {
                  identifier: 'stage_1',
                  name: 'stage 1',
                  spec: {
                    serviceConfig: { serviceDefinition: { type: 'Kubernetes' }, serviceRef: 'service_3' },
                    execution: {
                      steps: [
                        {
                          step: {
                            identifier: 'rolloutDeployment',
                            name: 'Rollout Deployment',
                            spec: { skipDryRun: false },
                            type: 'K8sRollingDeploy'
                          }
                        }
                      ],
                      rollbackSteps: [
                        {
                          step: {
                            identifier: 'rollbackRolloutDeployment',
                            name: 'Rollback Rollout Deployment',
                            spec: {},
                            timeout: '10m',
                            type: 'K8sRollingRollback'
                          }
                        }
                      ]
                    }
                  },
                  type: 'Deployment'
                }
              } as StageElementWrapperConfig
            }
          />
        </PipelineContext.Provider>
      </TestWrapper>
    )

    component = container
    rollingCard = getByTestId(component, 'Rolling-Card')
    blueGreenCard = getByTestId(component, 'BlueGreen-Card')
    canaryCard = getByTestId(component, 'Canary-Card')
    blankCanvasCard = getByTestId(component, 'Default-Card')
  })

  test('by default Rolling strategy should be selected', async () => {
    // Rolling should be selected by default
    expect(rollingCard.classList).toContain('active')
    expect(blueGreenCard.classList).not.toContain('active')
    expect(canaryCard.classList).not.toContain('active')
    expect(blankCanvasCard.classList).not.toContain('active')

    // Details Panel Header Section
    const rollingHeader = getByTestId(component, 'RollingDetailsHeader')
    expect(rollingHeader.innerHTML).toEqual('Rolling')
    const learnMoreLink: HTMLAnchorElement = getByText(component, 'learnMore').closest('a') as HTMLAnchorElement
    expect(learnMoreLink?.getAttribute('href')).toEqual('pipeline.executionStrategy.strategies.rolling.learnMoreLink')

    // description
    const description = getByTestId(component, 'info')
    expect(description.innerHTML).toEqual('pipeline.executionStrategy.strategies.rolling.description')

    // video should be in view
    const video = getByTestId(component, 'videoPlayer')
    expect(video).toBeInTheDocument()

    // test steps
    const allSteps = getAllByTestId(component, 'step-card')
    const step1 = allSteps[0]
    const step1Header = step1.children[0]
    const step1Description = step1.children[1]
    expect(step1Header.innerHTML).toEqual('pipeline.executionStrategy.strategies.common.steps.step1.title')
    expect(step1Description.innerHTML).toEqual('pipeline.executionStrategy.strategies.rolling.steps.step1.description')
    const step2 = allSteps[1]
    const step2Header = step2.children[0]
    const step2Description = step2.children[1]
    expect(step2Header.innerHTML).toEqual('pipeline.executionStrategy.strategies.common.steps.step2.title')
    expect(step2Description.innerHTML).toEqual('pipeline.executionStrategy.strategies.rolling.steps.step2.description')
    const step3 = allSteps[2]
    const step3Header = step3.children[0]
    const step3Description = step3.children[1]
    expect(step3Header.innerHTML).toEqual('pipeline.executionStrategy.strategies.common.steps.step3.title')
    expect(step3Description.innerHTML).toEqual('pipeline.executionStrategy.strategies.rolling.steps.step3.description')

    // Enable Verification Options
    const enableVerificationOptionsLabel = getByText(component, 'pipeline.enableVerificationOptions')
    expect(enableVerificationOptionsLabel).toBeInTheDocument()
    const enableVerificationOptionsSwitch = getByTestId(component, 'enable-verification-options-switch')
    expect(enableVerificationOptionsSwitch).toBeInTheDocument()

    // Use Strategy button
    const useStrategyBtn = getByText(component, 'pipeline.executionStrategy.useStrategy').closest('button')
    expect(useStrategyBtn).toBeInTheDocument()
    act(() => {
      fireEvent.click(useStrategyBtn!)
    })
    await waitFor(() => expect(pipelineContextMockValue.updateStage).toHaveBeenCalled())
    expect(pipelineContextMockValue.updateStage).toHaveBeenCalledWith(rollingUpdateStageFnArg)
  })

  test('upon selecting blue-green, description, video and steps should change accordingly', async () => {
    // Select Blue Green
    act(() => {
      fireEvent.click(blueGreenCard)
    })
    expect(rollingCard.classList).not.toContain('active')
    expect(blueGreenCard.classList).toContain('active')
    expect(canaryCard.classList).not.toContain('active')
    expect(blankCanvasCard.classList).not.toContain('active')

    // Details Panel Header Section
    const rollingHeader = getByTestId(component, 'BlueGreenDetailsHeader')
    expect(rollingHeader.innerHTML).toEqual('Blue Green')
    const learnMoreLink: HTMLAnchorElement = getByText(component, 'learnMore').closest('a') as HTMLAnchorElement
    expect(learnMoreLink?.getAttribute('href')).toEqual('pipeline.executionStrategy.strategies.blueGreen.learnMoreLink')

    // description
    const description = getByTestId(component, 'info')
    expect(description.innerHTML).toEqual('pipeline.executionStrategy.strategies.blueGreen.description')

    // video should be in view
    const video = getByTestId(component, 'videoPlayer')
    expect(video).toBeInTheDocument()

    // test steps
    const allSteps = getAllByTestId(component, 'step-card')
    const step1 = allSteps[0]
    const step1Header = step1.children[0]
    const step1Description = step1.children[1]
    expect(step1Header.innerHTML).toEqual('pipeline.executionStrategy.strategies.common.steps.step1.title')
    expect(step1Description.innerHTML).toEqual(
      'pipeline.executionStrategy.strategies.blueGreen.steps.step1.description'
    )
    const step2 = allSteps[1]
    const step2Header = step2.children[0]
    const step2Description = step2.children[1]
    expect(step2Header.innerHTML).toEqual('pipeline.executionStrategy.strategies.common.steps.step2.title')
    expect(step2Description.innerHTML).toEqual(
      'pipeline.executionStrategy.strategies.blueGreen.steps.step2.description'
    )
    const step3 = allSteps[2]
    const step3Header = step3.children[0]
    const step3Description = step3.children[1]
    expect(step3Header.innerHTML).toEqual('pipeline.executionStrategy.strategies.common.steps.step3.title')
    expect(step3Description.innerHTML).toEqual(
      'pipeline.executionStrategy.strategies.blueGreen.steps.step3.description'
    )

    // Enable Verification Options
    const enableVerificationOptionsLabel = getByText(component, 'pipeline.enableVerificationOptions')
    expect(enableVerificationOptionsLabel).toBeInTheDocument()
    const enableVerificationOptionsSwitch = getByTestId(component, 'enable-verification-options-switch')
    expect(enableVerificationOptionsSwitch).toBeInTheDocument()

    // Use Strategy button
    const useStrategyBtn = getByText(component, 'pipeline.executionStrategy.useStrategy').closest('button')
    expect(useStrategyBtn).toBeInTheDocument()
    act(() => {
      fireEvent.click(useStrategyBtn!)
    })
    await waitFor(() => expect(pipelineContextMockValue.updateStage).toHaveBeenCalled())
    expect(pipelineContextMockValue.updateStage).toHaveBeenCalledWith(blueGreenUpdateStageFnArg)
  })

  test('upon selecting canary, description, video and steps should change accordingly', async () => {
    // Select Canary
    act(() => {
      fireEvent.click(canaryCard)
    })
    expect(rollingCard.classList).not.toContain('active')
    expect(blueGreenCard.classList).not.toContain('active')
    expect(canaryCard.classList).toContain('active')
    expect(blankCanvasCard.classList).not.toContain('active')

    // Details Panel Header Section
    const rollingHeader = getByTestId(component, 'CanaryDetailsHeader')
    expect(rollingHeader.innerHTML).toEqual('Canary')
    const learnMoreLink: HTMLAnchorElement = getByText(component, 'learnMore').closest('a') as HTMLAnchorElement
    expect(learnMoreLink?.getAttribute('href')).toEqual('pipeline.executionStrategy.strategies.canary.learnMoreLink')

    // description
    const description = getByTestId(component, 'info')
    expect(description.innerHTML).toEqual('pipeline.executionStrategy.strategies.canary.description')

    // video should be in view
    const video = getByTestId(component, 'videoPlayer')
    expect(video).toBeInTheDocument()

    // test steps
    const allSteps = getAllByTestId(component, 'step-card')
    const step1 = allSteps[0]
    const step1Header = step1.children[0]
    const step1Description = step1.children[1]
    expect(step1Header.innerHTML).toEqual('pipeline.executionStrategy.strategies.canary.steps.step1.title')
    expect(step1Description.innerHTML).toEqual('pipeline.executionStrategy.strategies.canary.steps.step1.description')
    const step2 = allSteps[1]
    const step2Header = step2.children[0]
    const step2Description = step2.children[1]
    expect(step2Header.innerHTML).toEqual('pipeline.executionStrategy.strategies.canary.steps.step2.title')
    expect(step2Description.innerHTML).toEqual('pipeline.executionStrategy.strategies.canary.steps.step2.description')
    const step3 = allSteps[2]
    const step3Header = step3.children[0]
    const step3Description = step3.children[1]
    expect(step3Header.innerHTML).toEqual('pipeline.executionStrategy.strategies.canary.steps.step3.title')
    expect(step3Description.innerHTML).toEqual('pipeline.executionStrategy.strategies.canary.steps.step3.description')

    // Enable Verification Options
    const enableVerificationOptionsLabel = getByText(component, 'pipeline.enableVerificationOptions')
    expect(enableVerificationOptionsLabel).toBeInTheDocument()
    const enableVerificationOptionsSwitch = getByTestId(component, 'enable-verification-options-switch')
    expect(enableVerificationOptionsSwitch).toBeInTheDocument()

    // Use Strategy button
    const useStrategyBtn = getByText(component, 'pipeline.executionStrategy.useStrategy').closest('button')
    expect(useStrategyBtn).toBeInTheDocument()
    act(() => {
      fireEvent.click(useStrategyBtn!)
    })
    await waitFor(() => expect(pipelineContextMockValue.updateStage).toHaveBeenCalled())
    expect(pipelineContextMockValue.updateStage).toHaveBeenCalledWith(canaryUpdateStageFnArg)
  })

  test('upon selecting default, description and steps should change accordingly, image should appear instead of video', async () => {
    // Select Blank Canvas
    act(() => {
      fireEvent.click(blankCanvasCard)
    })
    expect(rollingCard.classList).not.toContain('active')
    expect(blueGreenCard.classList).not.toContain('active')
    expect(canaryCard.classList).not.toContain('active')
    expect(blankCanvasCard.classList).toContain('active')

    // Details Panel Header Section
    const rollingHeader = getByTestId(component, 'DefaultDetailsHeader')
    expect(rollingHeader.innerHTML).toEqual('pipeline.executionStrategy.strategies.default.displayName')
    const learnMoreLink: HTMLAnchorElement = getByText(component, 'learnMore').closest('a') as HTMLAnchorElement
    expect(learnMoreLink?.getAttribute('href')).toEqual('pipeline.executionStrategy.strategies.default.learnMoreLink')

    // description
    const description = getByTestId(component, 'info')
    expect(description.innerHTML).toEqual('pipeline.executionStrategy.strategies.default.description')

    // Image should be in view
    const blankCanvasImage = getByTestId(component, 'blank-canvas-image')
    expect(blankCanvasImage).toBeInTheDocument()

    // Use Strategy button
    const useStrategyBtn = getByText(component, 'pipeline.executionStrategy.useStrategy').closest('button')
    expect(useStrategyBtn).toBeInTheDocument()
    act(() => {
      fireEvent.click(useStrategyBtn!)
    })
    await waitFor(() => expect(pipelineContextMockValue.updateStage).toHaveBeenCalled())
    expect(pipelineContextMockValue.updateStage).toHaveBeenCalledWith(defaultUpdateStageFnArg)
  })
  test('isPropagating true and checkBox', () => {
    pipelineContextMockValue = getDummyPipelineContextValue()
    jest.spyOn(cdngServices, 'useGetExecutionStrategyYaml').mockImplementation((): any => {
      return { data: {}, error: false }
    })
    const { container } = render(
      <TestWrapper>
        <PipelineContext.Provider value={pipelineContextMockValue}>
          <ExecutionStrategy
            selectedStage={
              {
                stage: {
                  identifier: 'stage_1',
                  name: 'stage 1',
                  spec: {
                    serviceConfig: {
                      serviceDefinition: { type: 'Kubernetes' },
                      serviceRef: 'service_3',
                      useFromStage: {
                        stage: 'deploy'
                      }
                    },
                    execution: {
                      steps: [],
                      rollbackSteps: []
                    }
                  },
                  type: 'Deployment'
                }
              } as StageElementWrapperConfig
            }
            ref={jest.fn()}
          />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    const checkBox = container.querySelector('[data-testid="enable-verification-options-switch"]')
    expect(checkBox).toBeChecked()
    fireEvent.click(checkBox!)
    setTimeout(() => {
      expect(checkBox).toBeChecked()
    }, 1500)
  })

  test('should display loading state', () => {
    jest.spyOn(cdngServices, 'useGetExecutionStrategyList').mockImplementation(() => {
      return { loading: true, error: false, data: [], refetch: jest.fn() } as any
    })
    const { container } = render(
      <TestWrapper>
        <PipelineContext.Provider value={pipelineContextMockValue}>
          <ExecutionStrategy
            selectedStage={
              {
                stage: {
                  identifier: 'stage_1',
                  name: 'stage 1',
                  spec: {
                    serviceConfig: {
                      serviceDefinition: { type: 'Kubernetes' },
                      serviceRef: 'service_3',
                      useFromStage: {
                        stage: 'deploy'
                      }
                    },
                    execution: {
                      steps: [],
                      rollbackSteps: []
                    }
                  },
                  type: 'Deployment'
                }
              } as StageElementWrapperConfig
            }
            ref={jest.fn()}
          />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    expect(getLoader(container)).toBeTruthy()
    expect(getError(container)).toBeFalsy()
  })

  test('should display error state', () => {
    jest.spyOn(cdngServices, 'useGetExecutionStrategyList').mockImplementation(() => {
      return { loading: false, error: true, data: [], refetch: jest.fn() } as any
    })
    const { container } = render(
      <TestWrapper>
        <PipelineContext.Provider value={pipelineContextMockValue}>
          <ExecutionStrategy
            selectedStage={
              {
                stage: {
                  identifier: 'stage_1',
                  name: 'stage 1',
                  spec: {
                    serviceConfig: {
                      serviceDefinition: { type: 'Kubernetes' },
                      serviceRef: 'service_3',
                      useFromStage: {
                        stage: 'deploy'
                      }
                    },
                    execution: {
                      steps: [],
                      rollbackSteps: []
                    }
                  },
                  type: 'Deployment'
                }
              } as StageElementWrapperConfig
            }
            ref={jest.fn()}
          />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    expect(getLoader(container)).toBeFalsy()
    expect(getError(container)).toBeTruthy()
  })
})
