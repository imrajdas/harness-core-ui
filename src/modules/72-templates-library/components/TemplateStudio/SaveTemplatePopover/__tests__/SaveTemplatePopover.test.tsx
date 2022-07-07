/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, getByText, render, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import produce from 'immer'
import { set } from 'lodash-es'
import { findDialogContainer, findPopoverContainer, TestWrapper } from '@common/utils/testUtils'
import { TemplateContext } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateContext'
import { DefaultNewTemplateId } from 'framework/Templates/templates'
import routes from '@common/RouteDefinitions'
import { accountPathProps, pipelineModuleParams, templatePathProps } from '@common/utils/routeUtils'
import { TemplateType } from '@templates-library/utils/templatesUtils'
import { getTemplateContextMock } from '@templates-library/components/TemplateStudio/__tests__/stateMock'
import { useSaveTemplate } from '@pipeline/utils/useSaveTemplate'
import { SaveTemplatePopover, SaveTemplatePopoverProps } from '../SaveTemplatePopover'

jest.mock('@common/hooks/CommentModal/useCommentModal', () => ({
  __esModule: true,
  default: () => {
    return {
      getComments: jest.fn().mockImplementation(() => 'Some Comment')
    }
  }
}))

jest.mock('@pipeline/utils/useSaveTemplate', () => ({
  useSaveTemplate: jest.fn().mockReturnValue({
    saveAndPublish: jest.fn()
  })
}))

const PATH = routes.toTemplateStudio({ ...accountPathProps, ...templatePathProps, ...pipelineModuleParams })
const PATH_PARAMS = {
  templateIdentifier: 'Test_Template',
  accountId: 'accountId',
  projectIdentifier: 'Yogesh_Test',
  orgIdentifier: 'default',
  module: 'cd',
  templateType: 'Step'
}

const stepTemplateContextMock = getTemplateContextMock(TemplateType.Step)

const baseProps: SaveTemplatePopoverProps = {
  getErrors: () => Promise.resolve({ status: 'SUCCESS', errors: {} })
}

describe('<SaveTemplatePopover /> tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should match snapshot', async () => {
    const { container } = render(
      <TestWrapper path={PATH} pathParams={PATH_PARAMS}>
        <TemplateContext.Provider value={stepTemplateContextMock}>
          <SaveTemplatePopover {...baseProps} />
        </TemplateContext.Provider>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should call saveAndPublish with correct params when creating a template', async () => {
    const { container } = render(
      <TestWrapper path={PATH} pathParams={{ ...PATH_PARAMS, templateIdentifier: DefaultNewTemplateId }}>
        <TemplateContext.Provider value={stepTemplateContextMock}>
          <SaveTemplatePopover {...baseProps} />
        </TemplateContext.Provider>
      </TestWrapper>
    )

    const saveButton = getByText(container, 'save')
    await act(async () => {
      fireEvent.click(saveButton)
    })

    expect(
      useSaveTemplate({ template: { name: 'name', identifier: 'identifier', type: 'Step', versionLabel: 'v1' } })
        .saveAndPublish
    ).toBeCalledWith(stepTemplateContextMock.state.template, { comment: 'Some Comment', isEdit: false })
  })

  test('should not call saveAndPublish if yaml is empty or yaml has schema validation errors', async () => {
    const updatedTemplateContextMock = {
      ...stepTemplateContextMock,
      state: {
        ...stepTemplateContextMock.state,
        yamlHandler: {
          getLatestYaml: () => '',
          getYAMLValidationErrorMap: () => {
            const errorMap = new Map()
            errorMap.set(4, 'Expected type string')
            return errorMap
          }
        }
      }
    }
    const { container } = render(
      <TestWrapper path={PATH} pathParams={{ ...PATH_PARAMS, templateIdentifier: DefaultNewTemplateId }}>
        <TemplateContext.Provider value={updatedTemplateContextMock}>
          <SaveTemplatePopover {...baseProps} />
        </TemplateContext.Provider>
      </TestWrapper>
    )

    const saveButton = getByText(container, 'save')
    await act(async () => {
      fireEvent.click(saveButton)
    })

    expect(
      useSaveTemplate({ template: { name: 'name', identifier: 'identifier', type: 'Step', versionLabel: 'v1' } })
        .saveAndPublish
    ).not.toBeCalled()
  })

  test('should call saveAndPublish with correct params when updating a template', async () => {
    const updatedStepTemplateContextMock = produce(stepTemplateContextMock, draft => {
      set(draft, 'state.isUpdated', true)
    })

    const { container } = render(
      <TestWrapper path={PATH} pathParams={PATH_PARAMS}>
        <TemplateContext.Provider value={updatedStepTemplateContextMock}>
          <SaveTemplatePopover {...baseProps} />
        </TemplateContext.Provider>
      </TestWrapper>
    )

    const saveButton = getByText(container, 'save')
    act(() => {
      fireEvent.click(saveButton)
    })

    const popover = findPopoverContainer() as HTMLElement
    await waitFor(() => popover)

    const updateButton = getByText(popover, 'save')
    await act(async () => {
      fireEvent.click(updateButton)
    })

    expect(
      useSaveTemplate({ template: { name: 'name', identifier: 'identifier', type: 'Step', versionLabel: 'v1' } })
        .saveAndPublish
    ).toBeCalledWith(updatedStepTemplateContextMock.state.template, { comment: 'Some Comment', isEdit: true })
  })

  test('should call saveAndPublish with correct params when updating a template when git sync is enabled', async () => {
    const updatedStepTemplateContextMock = produce(stepTemplateContextMock, draft => {
      set(draft, 'state.isUpdated', true)
    })

    const { container } = render(
      <TestWrapper path={PATH} pathParams={PATH_PARAMS} defaultAppStoreValues={{ isGitSyncEnabled: true }}>
        <TemplateContext.Provider value={updatedStepTemplateContextMock}>
          <SaveTemplatePopover {...baseProps} />
        </TemplateContext.Provider>
      </TestWrapper>
    )

    const saveButton = getByText(container, 'save')
    act(() => {
      fireEvent.click(saveButton)
    })

    const popover = findPopoverContainer() as HTMLElement
    await waitFor(() => popover)

    const updateButton = getByText(popover, 'save')
    await act(async () => {
      fireEvent.click(updateButton)
    })

    expect(
      useSaveTemplate({ template: { name: 'name', identifier: 'identifier', type: 'Step', versionLabel: 'v1' } })
        .saveAndPublish
    ).toBeCalledWith(updatedStepTemplateContextMock.state.template, { comment: '', isEdit: true })
  })

  test('should show dialog when saving as new version', async () => {
    const { container } = render(
      <TestWrapper path={PATH} pathParams={PATH_PARAMS}>
        <TemplateContext.Provider value={stepTemplateContextMock}>
          <SaveTemplatePopover {...baseProps} />
        </TemplateContext.Provider>
      </TestWrapper>
    )

    const saveButton = getByText(container, 'save')
    act(() => {
      fireEvent.click(saveButton)
    })

    const popover = findPopoverContainer() as HTMLElement
    await waitFor(() => popover)

    const saveAsNewLabel = getByText(popover, 'templatesLibrary.saveAsNewLabelModal.heading')
    await act(async () => {
      fireEvent.click(saveAsNewLabel)
    })

    const dialogContainer = findDialogContainer() as HTMLElement
    expect(dialogContainer).toBeTruthy()
  })

  test('should show dialog when saving as new template', async () => {
    const { container } = render(
      <TestWrapper path={PATH} pathParams={PATH_PARAMS}>
        <TemplateContext.Provider value={stepTemplateContextMock}>
          <SaveTemplatePopover {...baseProps} />
        </TemplateContext.Provider>
      </TestWrapper>
    )

    const saveButton = getByText(container, 'save')
    act(() => {
      fireEvent.click(saveButton)
    })

    const popover = findPopoverContainer() as HTMLElement
    await waitFor(() => popover)

    const saveAsNewTemplate = getByText(popover, 'common.template.saveAsNewTemplateHeading')
    await act(async () => {
      fireEvent.click(saveAsNewTemplate)
    })

    const dialogContainer = findDialogContainer() as HTMLElement
    expect(dialogContainer).toBeTruthy()
  })
})
