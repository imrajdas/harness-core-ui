/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, render } from '@testing-library/react'
import { parse } from 'yaml'
import { TestWrapper } from '@common/utils/testUtils'
import { usePipelineTemplateActions } from '@pipeline/utils/usePipelineTemplateActions'
import pipelineContextMock from '@pipeline/components/PipelineStudio/RightDrawer/__tests__/stateMock'
import { PipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import type { TemplateSummaryResponse } from 'services/template-ng'
import { useTemplateSelector } from 'framework/Templates/TemplateSelectorContext/useTemplateSelector'

export const pipelineTemplate: TemplateSummaryResponse = {
  accountId: 'px7xd_BFRCi-pfWPYXVjvw',
  description: '',
  identifier: 'Test_Pipeline_Template',
  lastUpdatedAt: 1637668359934,
  name: 'Test Pipeline Template',
  orgIdentifier: 'default',
  projectIdentifier: 'Yogesh_Test',
  stableTemplate: true,
  tags: {},
  templateEntityType: 'Pipeline',
  templateScope: 'project',
  version: 3,
  versionLabel: 'v1',
  yaml:
    'template:' +
    '\n    name: New Pipeline Template Name' +
    '\n    identifier: new_pipeline_template_name' +
    '\n    versionLabel: v2' +
    '\n    type: Pipeline' +
    '\n    projectIdentifier: Yogesh_Test' +
    '\n    orgIdentifier: default' +
    '\n    spec:' +
    '\n        stages:' +
    '\n            - stage:' +
    '\n                  name: Stage 1' +
    '\n                  identifier: Stage_1' +
    '\n                  description: ""' +
    '\n                  type: Deployment' +
    '\n                  spec:' +
    '\n                      serviceConfig:' +
    '\n                          serviceRef: <+input>' +
    '\n                          serviceDefinition:' +
    '\n                              type: Kubernetes' +
    '\n                              spec:' +
    '\n                                  variables:' +
    '\n                                      - name: var' +
    '\n                                        type: String' +
    '\n                                        value: <+input>' +
    '\n                      infrastructure:' +
    '\n                          environmentRef: Some_Environment' +
    '\n                          infrastructureDefinition:' +
    '\n                              type: KubernetesDirect' +
    '\n                              spec:' +
    '\n                                  connectorRef: account.testarpit' +
    '\n                                  namespace: default' +
    '\n                                  releaseName: release-<+INFRA_KEY>' +
    '\n                          allowSimultaneousDeployments: false' +
    '\n                      execution:' +
    '\n                          steps:' +
    '\n                              - step:' +
    '\n                                    type: ShellScript' +
    '\n                                    name: Step 1' +
    '\n                                    identifier: Step_1' +
    '\n                                    spec:' +
    '\n                                        shell: Bash' +
    '\n                                        onDelegate: true' +
    '\n                                        source:' +
    '\n                                            type: Inline' +
    '\n                                            spec:' +
    '\n                                                script: <+input>' +
    '\n                                        environmentVariables: []' +
    '\n                                        outputVariables: []' +
    '\n                                        executionTarget: {}' +
    '\n                                    timeout: 10m' +
    '\n                          rollbackSteps: []' +
    '\n                  tags: {}' +
    '\n                  failureStrategies:' +
    '\n                      - onFailure:' +
    '\n                            errors:' +
    '\n                                - AllErrors' +
    '\n                            action:' +
    '\n                                type: StageRollback' +
    '\n'
}

jest.mock('framework/Templates/TemplateSelectorContext/useTemplateSelector', () => ({
  useTemplateSelector: jest.fn().mockReturnValue({
    getTemplate: jest
      .fn()
      .mockImplementationOnce(() => ({ template: pipelineTemplate, isCopied: false }))
      .mockImplementationOnce(() => ({ template: pipelineTemplate, isCopied: true }))
  })
}))

function Wrapped(): React.ReactElement {
  const { addOrUpdateTemplate, removeTemplate } = usePipelineTemplateActions()
  return (
    <>
      <button onClick={() => addOrUpdateTemplate()}>Add Or Update Template</button>
      <button onClick={removeTemplate}>Remove Template</button>
    </>
  )
}

describe('usePipelineTemplateActions Test', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('use template should work as expected', async () => {
    const { getByText } = render(
      <TestWrapper>
        <PipelineContext.Provider value={pipelineContextMock}>
          <Wrapped />
        </PipelineContext.Provider>
      </TestWrapper>
    )

    const addOrUpdateTemplateBtn = getByText('Add Or Update Template')
    await act(async () => {
      fireEvent.click(addOrUpdateTemplateBtn)
    })
    expect(useTemplateSelector().getTemplate).toBeCalledWith({
      templateType: 'Pipeline'
    })
    expect(pipelineContextMock.updatePipeline).toBeCalledWith({
      name: 'stage1',
      identifier: 'stage1',
      orgIdentifier: 'CV',
      projectIdentifier: 'Milos2',
      tags: {},
      template: { templateRef: 'Test_Pipeline_Template', versionLabel: 'v1' }
    })
  })

  test('copy template should work as expected', async () => {
    const { getByText } = render(
      <TestWrapper>
        <PipelineContext.Provider value={pipelineContextMock}>
          <Wrapped />
        </PipelineContext.Provider>
      </TestWrapper>
    )

    const addOrUpdateTemplateBtn = getByText('Add Or Update Template')
    await act(async () => {
      fireEvent.click(addOrUpdateTemplateBtn)
    })
    expect(useTemplateSelector().getTemplate).toBeCalledWith({
      templateType: 'Pipeline'
    })
    expect(pipelineContextMock.updatePipeline).toBeCalledWith({
      name: 'stage1',
      identifier: 'stage1',
      orgIdentifier: 'CV',
      projectIdentifier: 'Milos2',
      tags: {},
      ...parse(pipelineTemplate?.yaml || '')?.template.spec
    })
  })

  test('remove template should work as expected', async () => {
    const { getByText } = render(
      <TestWrapper>
        <PipelineContext.Provider value={pipelineContextMock}>
          <Wrapped />
        </PipelineContext.Provider>
      </TestWrapper>
    )

    const removeTemplateBtn = getByText('Remove Template')
    await act(async () => {
      fireEvent.click(removeTemplateBtn)
    })
    expect(pipelineContextMock.updatePipeline).toBeCalledWith({
      name: 'stage1',
      identifier: 'stage1',
      orgIdentifier: 'CV',
      projectIdentifier: 'Milos2',
      tags: {}
    })
  })
})
