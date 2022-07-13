/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, getByRole, queryByAttribute, render, waitFor } from '@testing-library/react'
import { set } from 'lodash-es'
import produce from 'immer'
import { TemplateContext } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateContext'
import { TestWrapper } from '@common/utils/testUtils'
import { StepTemplateDiagram } from '@templates-library/components/TemplateStudio/StepTemplateCanvas/StepTemplateDiagram/StepTemplateDiagram'
import type { NGTemplateInfoConfig } from 'services/template-ng'
import type { StepPopoverProps } from '@pipeline/components/PipelineStudio/StepPalette/StepPopover/StepPopover'
import { TemplateType } from '@templates-library/utils/templatesUtils'
import { getTemplateContextMock } from '@templates-library/components/TemplateStudio/__tests__/stateMock'
import type { StepPaletteProps } from '@pipeline/components/PipelineStudio/StepPalette/StepPalette'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
// eslint-disable-next-line no-restricted-imports
import { HttpStep } from '@cd/components/PipelineSteps/HttpStep/HttpStep'
import routes from '@common/RouteDefinitions'
import { accountPathProps, pipelineModuleParams, templatePathProps } from '@common/utils/routeUtils'

const stepTemplateMockWithoutType = {
  name: 'Test Template',
  identifier: 'Test_Template',
  versionLabel: 'v1',
  type: 'Step',
  projectIdentifier: 'Yogesh_Test',
  orgIdentifier: 'default',
  tags: {},
  spec: {}
} as NGTemplateInfoConfig

jest.mock('@pipeline/components/PipelineStudio/StepPalette/StepPopover/StepPopover', () => ({
  ...(jest.requireActual('@pipeline/components/PipelineStudio/StepPalette/StepPopover/StepPopover') as any),
  StepPopover: ({ stepData }: StepPopoverProps) => {
    return (
      <div className="step-popover-mock">
        {stepData?.name}
        {stepData?.type}
      </div>
    )
  }
}))

jest.mock('@pipeline/components/PipelineStudio/StepPalette/StepPalette', () => ({
  StepPalette: (props: StepPaletteProps) => {
    return (
      <div className="step-palette-mock">
        <button
          onClick={() => {
            props.onSelect({ name: 'HTTP Step', type: StepType.HTTP, icon: 'http-step' })
          }}
        >
          Select Step
        </button>
      </div>
    )
  }
}))

const stepTemplateContextMock = getTemplateContextMock(TemplateType.Step)

const PATH = routes.toTemplateStudio({ ...accountPathProps, ...templatePathProps, ...pipelineModuleParams })
const PATH_PARAMS = {
  templateIdentifier: '-1',
  accountId: 'accountId',
  orgIdentifier: 'default',
  projectIdentifier: 'Yogesh_Test',
  module: 'cd',
  templateType: 'Step'
}

describe('<StepTemplateDiagram /> tests', () => {
  beforeAll(() => {
    factory.registerStep(new HttpStep())
  })

  test('should open step selection on load when step type is not set', async () => {
    const stepTemplateContextMockWithoutType = produce(stepTemplateContextMock, draft => {
      set(draft, 'state.template', stepTemplateMockWithoutType)
    })
    render(
      <TestWrapper path={PATH} pathParams={PATH_PARAMS}>
        <TemplateContext.Provider value={stepTemplateContextMockWithoutType}>
          <StepTemplateDiagram />
        </TemplateContext.Provider>
      </TestWrapper>
    )
    const drawer = document.querySelector('.bp3-drawer')
    await waitFor(() => expect(drawer).toBeInTheDocument())
  })

  test('should match snapshot when step type is set', async () => {
    const { container } = render(
      <TestWrapper path={PATH} pathParams={PATH_PARAMS}>
        <TemplateContext.Provider value={stepTemplateContextMock}>
          <StepTemplateDiagram />
        </TemplateContext.Provider>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should work on step selection 1', async () => {
    const { container } = render(
      <TestWrapper path={PATH} pathParams={PATH_PARAMS}>
        <TemplateContext.Provider value={stepTemplateContextMock}>
          <StepTemplateDiagram />
        </TemplateContext.Provider>
      </TestWrapper>
    )

    const changeStepButton = queryByAttribute('data-testid', container, 'change-step') as HTMLElement
    await act(async () => {
      fireEvent.click(changeStepButton)
    })
    const drawer = document.querySelector('.bp3-drawer')
    expect(drawer).toBeInTheDocument()

    const selectStepButton = getByRole(drawer as HTMLElement, 'button', { name: 'Select Step' })
    await act(async () => {
      fireEvent.click(selectStepButton)
    })
    expect(stepTemplateContextMock.updateTemplate).toBeCalledWith({
      identifier: 'Test_Template',
      name: 'Test Template',
      orgIdentifier: 'default',
      projectIdentifier: 'Yogesh_Test',
      spec: { spec: { method: 'GET', url: '' }, timeout: '10s', type: 'Http' },
      tags: {},
      type: 'Step',
      versionLabel: 'v1'
    })
  })
})
