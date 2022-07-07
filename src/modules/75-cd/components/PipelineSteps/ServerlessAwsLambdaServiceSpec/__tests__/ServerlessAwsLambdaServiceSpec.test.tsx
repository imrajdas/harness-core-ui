/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MultiTypeInputType } from '@wings-software/uicore'
import { TestWrapper } from '@common/utils/testUtils'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepWidget } from '@pipeline/components/AbstractSteps/StepWidget'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import type { CompletionItemInterface } from '@common/interfaces/YAMLBuilderProps'
import { factory, TestStepWidget } from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'

import { mockBuildList, mockManifestConnector } from './mocks'
import type { K8SDirectServiceStep } from '../../K8sServiceSpec/K8sServiceSpecInterface'
import { ServerlessAwsLambdaServiceSpec } from '../ServerlessAwsLambdaServiceSpec'
import {
  getDummyPipelineCanvasContextValue,
  getInvalidYaml,
  getTemplateWithArtifactPath,
  getTemplateWithArtifactPathFilter,
  getTemplateWithManifestFields,
  serverlessPipelineContext,
  getYaml,
  initialValues,
  getParams
} from './ServerlessAwsLambdaServiceSpecHelper'
import { mockConnectorResponse, mockCreateConnectorResponse } from '../../Common/mocks/connector'

jest.mock('@common/components/YAMLBuilder/YamlBuilder')

const fetchConnectors = (): Promise<unknown> => Promise.resolve({})
const fetchBuildDetails = jest.fn().mockResolvedValue(mockBuildList)
jest.mock('services/cd-ng', () => ({
  useGetConnectorListV2: jest.fn().mockImplementation(() => ({ mutate: fetchConnectors })),
  getConnectorListV2Promise: () => Promise.resolve(mockManifestConnector),
  getBuildDetailsForArtifactoryArtifactWithYamlPromise: () => Promise.resolve(mockBuildList),
  useGetBuildDetailsForArtifactoryArtifactWithYaml: jest.fn().mockImplementation(() => ({ mutate: fetchBuildDetails })),
  useGetConnector: jest.fn(() => mockConnectorResponse),
  useGetServiceV2: jest.fn().mockImplementation(() => ({ loading: false, data: {}, refetch: jest.fn() })),
  useCreateConnector: jest.fn(() => Promise.resolve(mockCreateConnectorResponse)),
  useUpdateConnector: jest.fn(() =>
    Promise.resolve({
      status: 'SUCCESS',
      data: {
        connector: {
          name: 'artifact',
          identifier: 'artifact',
          description: '',
          orgIdentifier: 'default',
          projectIdentifier: 'dummy',
          tags: [],
          type: 'DockerRegistry',
          spec: {
            dockerRegistryUrl: 'https;//hub.docker.com',
            auth: {
              type: 'UsernamePassword',
              spec: { username: 'testpass', passwordRef: 'account.testpass' }
            }
          }
        },
        createdAt: 1607289652713,
        lastModifiedAt: 1607289652713,
        status: null
      },
      metaData: null,
      correlationId: '0d20f7b7-6f3f-41c2-bd10-4c896bfd76fd'
    })
  ),
  validateTheIdentifierIsUniquePromise: jest.fn(() =>
    Promise.resolve({
      status: 'SUCCESS',
      data: true,
      metaData: null
    })
  )
}))

factory.registerStep(new ServerlessAwsLambdaServiceSpec())

describe('ServerlessAwsLambdaServiceSpec tests', () => {
  describe('When stepViewType is Edit', () => {
    test('render properly when stepViewType is Edit', () => {
      const contextValue = getDummyPipelineCanvasContextValue({
        isLoading: false
      })
      const { container } = render(
        <TestWrapper>
          <PipelineContext.Provider value={contextValue}>
            <StepWidget<K8SDirectServiceStep>
              factory={factory}
              allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
              initialValues={{ deploymentType: 'ServerlessAwsLambda' }}
              type={StepType.ServerlessAwsLambda}
              stepViewType={StepViewType.Edit}
            />
          </PipelineContext.Provider>
        </TestWrapper>
      )

      expect(container).toMatchSnapshot()
    })
  })

  describe('When stepViewType is InputSet', () => {
    test(`render properly when stepViewType is InputSet`, () => {
      const contextValue = getDummyPipelineCanvasContextValue({
        isLoading: false
      })
      const { container } = render(
        <TestWrapper>
          <PipelineContext.Provider value={contextValue}>
            <StepWidget<K8SDirectServiceStep>
              factory={factory}
              allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
              initialValues={{}}
              type={StepType.ServerlessAwsLambda}
              stepViewType={StepViewType.InputSet}
            />
          </PipelineContext.Provider>
        </TestWrapper>
      )

      expect(container).toMatchSnapshot()
    })

    test('when artifactPath is runtime input', async () => {
      const { container } = render(
        <TestStepWidget
          initialValues={serverlessPipelineContext.state}
          template={getTemplateWithArtifactPath()}
          type={StepType.ServerlessAwsLambda}
          stepViewType={StepViewType.InputSet}
          customStepProps={{
            stageIdentifier: 'stage1'
          }}
          path={'pipeline.stages[0].stage.spec.serviceConfig.serviceDefinition.spec'}
        />
      )

      const artifactPathInput = container.querySelector(
        "input[name='pipeline.stages[0].stage.spec.serviceConfig.serviceDefinition.spec.artifacts.primary.spec.artifactPath']"
      ) as HTMLElement
      expect(artifactPathInput).toBeInTheDocument()

      const dropdownIcon = container.querySelector('[data-icon="chevron-down"]')?.parentElement as HTMLInputElement
      act(() => {
        fireEvent.click(dropdownIcon)
      })

      await waitFor(() => {
        expect(fetchBuildDetails).toHaveBeenCalled()
      })
    })

    test('when artifactPathFilter is runtime input', async () => {
      const { container } = render(
        <TestStepWidget
          initialValues={serverlessPipelineContext.state}
          template={getTemplateWithArtifactPathFilter()}
          type={StepType.ServerlessAwsLambda}
          stepViewType={StepViewType.InputSet}
          customStepProps={{
            stageIdentifier: 'stage1'
          }}
          path={'pipeline.stages[0].stage.spec.serviceConfig.serviceDefinition.spec'}
        />
      )

      const artifactPathFilterInput = container.querySelector(
        "input[name='pipeline.stages[0].stage.spec.serviceConfig.serviceDefinition.spec.artifacts.primary.spec.artifactPathFilter']"
      ) as HTMLElement
      act(() => {
        fireEvent.change(artifactPathFilterInput, { target: { value: 'a*p.zip' } })
      })
      await waitFor(() => expect(artifactPathFilterInput.getAttribute('value')).toBe('a*p.zip'))
    })

    test('should not call onUpdate if manifest values are not entered', async () => {
      const onUpdateHandler = jest.fn()
      const { getByText } = render(
        <TestStepWidget
          initialValues={initialValues}
          template={getTemplateWithManifestFields()}
          allValues={initialValues}
          type={StepType.ServerlessAwsLambda}
          stepViewType={StepViewType.InputSet}
          onUpdate={onUpdateHandler}
        />
      )
      userEvent.click(getByText('Submit'))
      expect(onUpdateHandler).not.toBeCalled()
    })
  })

  describe('When stepViewType is InputVariable', () => {
    test(`render properly when stepViewType is InputVariable`, () => {
      const contextValue = getDummyPipelineCanvasContextValue({
        isLoading: false
      })
      const { container } = render(
        <TestWrapper>
          <PipelineContext.Provider value={contextValue}>
            <StepWidget<K8SDirectServiceStep>
              factory={factory}
              allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
              initialValues={{}}
              type={StepType.ServerlessAwsLambda}
              stepViewType={StepViewType.InputVariable}
              customStepProps={{
                variablesData: {}
              }}
            />
          </PipelineContext.Provider>
        </TestWrapper>
      )

      expect(container).toMatchSnapshot()
    })
  })

  describe('Test ServerlessAwsLambdaSpec autocomplete', () => {
    test('getManifestConnectorsListForYaml', async () => {
      const manifestConnectorRefPath =
        'pipeline.stages.0.stage.spec.serviceConfig.serviceDefinition.spec.manifests.0.manifest.spec.store.spec.connectorRef'
      const step = new ServerlessAwsLambdaServiceSpec() as any
      let list: CompletionItemInterface[]

      // When path and yaml both are valid
      list = await step.getManifestConnectorsListForYaml(manifestConnectorRefPath, getYaml(), getParams())
      expect(list).toHaveLength(1)
      expect(list[0].insertText).toBe('account.git9march')
      // When path is invalid
      list = await step.getManifestConnectorsListForYaml('invalid path', getYaml(), getParams())
      expect(list).toHaveLength(0)
      // When yaml is invalid
      list = await step.getManifestConnectorsListForYaml(manifestConnectorRefPath, getInvalidYaml(), getParams())
      expect(list).toHaveLength(0)
    })

    test('getArtifactsPrimaryConnectorsListForYaml', async () => {
      const primaryArtifactConnectorRefPath =
        'pipeline.stages.0.stage.spec.serviceConfig.serviceDefinition.spec.artifacts.primary.spec.connectorRef'
      const step = new ServerlessAwsLambdaServiceSpec() as any
      let list: CompletionItemInterface[]
      list = await step.getArtifactsPrimaryConnectorsListForYaml(
        primaryArtifactConnectorRefPath,
        getYaml(),
        getParams()
      )
      expect(list).toHaveLength(1)
      expect(list[0].insertText).toBe('account.git9march')
      // When path is invalid
      list = await step.getArtifactsPrimaryConnectorsListForYaml('invalid path', getYaml(), getParams())
      expect(list).toHaveLength(0)
      // When yaml is invalid
      list = await step.getArtifactsPrimaryConnectorsListForYaml(
        primaryArtifactConnectorRefPath,
        getInvalidYaml(),
        getParams()
      )
      expect(list).toHaveLength(0)
    })

    test('getArtifactsTagsListForYaml', async () => {
      const primaryArtifactArtifactPath =
        'pipeline.stages.0.stage.spec.serviceConfig.serviceDefinition.spec.artifacts.primary.spec.artifactPath'
      const step = new ServerlessAwsLambdaServiceSpec() as any
      let list: CompletionItemInterface[]
      list = await step.getArtifactsTagsListForYaml(primaryArtifactArtifactPath, getYaml(), getParams())
      expect(list).toHaveLength(2)
      expect(list[0].insertText).toBe('hello-world.zip')
      expect(list[1].insertText).toBe('todolist.zip')
      list = await step.getArtifactsTagsListForYaml('invalid path', getYaml(), getParams())
      expect(list).toHaveLength(0)
      // When yaml is invalid
      list = await step.getArtifactsTagsListForYaml(primaryArtifactArtifactPath, getInvalidYaml(), getParams())
      expect(list).toHaveLength(0)
    })
  })
})
