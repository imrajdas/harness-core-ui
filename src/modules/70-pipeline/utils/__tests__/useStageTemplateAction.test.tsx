/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { useStageTemplateActions } from '@pipeline/utils/useStageTemplateActions'
import pipelineContextMock from '@pipeline/components/PipelineStudio/RightDrawer/__tests__/stateMock'
import { PipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import type { TemplateSummaryResponse } from 'services/template-ng'
import { useTemplateSelector } from 'framework/Templates/TemplateSelectorContext/useTemplateSelector'

const stageTemplate: TemplateSummaryResponse = {
  accountId: 'px7xd_BFRCi-pfWPYXVjvw',
  childType: 'Deployment',
  description: '',
  identifier: 'Test_Stage_Template',
  lastUpdatedAt: 1643962532126,
  name: 'Test Stage Template',
  orgIdentifier: 'default',
  projectIdentifier: 'Yogesh_Test',
  stableTemplate: true,
  tags: {},
  templateEntityType: 'Stage',
  templateScope: 'project',
  version: 0,
  versionLabel: 'Version1',
  yaml:
    'template:' +
    '\n    name: Test Stage Template' +
    '\n    identifier: Test_Stage_Template' +
    '\n    versionLabel: Version1' +
    '\n    type: Stage' +
    '\n    projectIdentifier: Yogesh_Test' +
    '\n    orgIdentifier: default' +
    '\n    tags: {}' +
    '\n    spec:' +
    '\n        type: Deployment' +
    '\n        spec:' +
    '\n            serviceConfig:' +
    '\n                serviceRef: <+input>' +
    '\n                serviceDefinition:' +
    '\n                    type: Kubernetes' +
    '\n                    spec:' +
    '\n                        variables: []' +
    '\n            infrastructure:' +
    '\n                environmentRef: Some_Environment' +
    '\n                infrastructureDefinition:' +
    '\n                    type: KubernetesDirect' +
    '\n                    spec:' +
    '\n                        connectorRef: account.test_k8' +
    '\n                        namespace: <+input>' +
    '\n                        releaseName: release-<+INFRA_KEY>' +
    '\n                allowSimultaneousDeployments: false' +
    '\n            execution:' +
    '\n                steps:' +
    '\n                    - step:' +
    '\n                          type: ShellScript' +
    '\n                          name: Step 1' +
    '\n                          identifier: Step_1' +
    '\n                          spec:' +
    '\n                              shell: Bash' +
    '\n                              onDelegate: true' +
    '\n                              source:' +
    '\n                                  type: Inline' +
    '\n                                  spec:' +
    '\n                                      script: <+input>' +
    '\n                              environmentVariables: []' +
    '\n                              outputVariables: []' +
    '\n                              executionTarget: {}' +
    '\n                          timeout: 10m' +
    '\n                rollbackSteps: []' +
    '\n        failureStrategies:' +
    '\n            - onFailure:' +
    '\n                  errors:' +
    '\n                      - AllErrors' +
    '\n                  action:' +
    '\n                      type: StageRollback' +
    '\n'
}

jest.mock('framework/Templates/TemplateSelectorContext/useTemplateSelector', () => ({
  useTemplateSelector: jest.fn().mockReturnValue({
    getTemplate: jest.fn().mockImplementation(() => ({ template: stageTemplate, isCopied: false }))
  })
}))

function Wrapped(): React.ReactElement {
  const { addOrUpdateTemplate, removeTemplate } = useStageTemplateActions()
  return (
    <>
      <button onClick={() => addOrUpdateTemplate()}>Add Or Update Template</button>
      <button onClick={removeTemplate}>Remove Template</button>
    </>
  )
}

describe('useStageTemplateAction Test', () => {
  test('should work as expected', async () => {
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
      templateType: 'Stage',
      allChildTypes: ['CI']
    })
    expect(pipelineContextMock.updateStage).toBeCalledWith({
      identifier: 's1',
      name: 's1',
      template: { templateRef: 'Test_Stage_Template', versionLabel: 'Version1' }
    })

    const removeTemplateBtn = getByText('Remove Template')
    await act(async () => {
      fireEvent.click(removeTemplateBtn)
    })
    expect(pipelineContextMock.updateStage).toBeCalledWith({ identifier: 's1', name: 's1', type: 'CI' })
  })
})
