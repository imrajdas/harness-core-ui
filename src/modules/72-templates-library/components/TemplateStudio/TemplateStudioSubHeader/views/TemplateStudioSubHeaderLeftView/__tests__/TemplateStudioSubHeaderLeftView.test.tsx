/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, getByRole, render, waitFor } from '@testing-library/react'
import produce from 'immer'
import { set } from 'lodash-es'
import { useLocation } from 'react-router-dom'
import { findDialogContainer, findPopoverContainer, TestWrapper } from '@common/utils/testUtils'
import { TemplateContext } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateContext'
import routes from '@common/RouteDefinitions'
import { accountPathProps, pipelineModuleParams, templatePathProps } from '@common/utils/routeUtils'
import { useUpdateStableTemplate } from 'services/template-ng'
import { TemplateType } from '@templates-library/utils/templatesUtils'
import { getTemplateContextMock } from '@templates-library/components/TemplateStudio/__tests__/stateMock'
import {
  TemplateStudioSubHeaderLeftView,
  TemplateStudioSubHeaderLeftViewProps
} from '../TemplateStudioSubHeaderLeftView'

jest.mock('@wings-software/monaco-yaml/lib/esm/languageservice/yamlLanguageService', () => ({
  getLanguageService: jest.fn()
}))

jest.mock('services/template-ng', () => ({
  useUpdateStableTemplate: jest.fn().mockImplementation(() => {
    return {
      mutate: () =>
        Promise.resolve({
          data: { name: 'NewConnectorCreated' }
        }),
      loading: false
    }
  })
}))

function ComponentWrapper(props: TemplateStudioSubHeaderLeftViewProps): React.ReactElement {
  const location = useLocation()
  return (
    <React.Fragment>
      <TemplateStudioSubHeaderLeftView {...props} />
      <div data-testid="location">{`${location.pathname}${
        location.search ? `?${location.search.replace(/^\?/g, '')}` : ''
      }`}</div>
    </React.Fragment>
  )
}

const PATH = routes.toTemplateStudio({ ...accountPathProps, ...templatePathProps, ...pipelineModuleParams })
const PATH_PARAMS = {
  templateIdentifier: 'Test_Template',
  accountId: 'accountId',
  orgIdentifier: 'default',
  projectIdentifier: 'Yogesh_Test',
  module: 'cd',
  templateType: 'Step',
  versionLabel: 'v1'
}

const stepTemplateContextMock = getTemplateContextMock(TemplateType.Step)

describe('<TemplateStudioSubHeaderLeftView /> tests', () => {
  test('should match snapshot', async () => {
    const { container } = render(
      <TemplateContext.Provider value={stepTemplateContextMock}>
        <TestWrapper path={PATH} pathParams={PATH_PARAMS}>
          <TemplateStudioSubHeaderLeftView />
        </TestWrapper>
      </TemplateContext.Provider>
    )
    expect(container).toMatchSnapshot()
  })

  test('should call useUpdateStableTemplate with correct version label when setAsStable is clicked', async () => {
    const templateContextMock = produce(stepTemplateContextMock, draft => {
      set(draft, 'state.stableVersion', 'v2')
    })
    const { getByText } = render(
      <TemplateContext.Provider value={templateContextMock}>
        <TestWrapper path={PATH} pathParams={PATH_PARAMS}>
          <TemplateStudioSubHeaderLeftView />
        </TestWrapper>
      </TemplateContext.Provider>
    )

    const stableBtn = getByText('common.setAsStable')
    act(() => {
      fireEvent.click(stableBtn)
    })

    const dialog = findDialogContainer() as HTMLElement
    await waitFor(() => dialog)
    expect(dialog).toMatchSnapshot()

    const confirmBtn = getByRole(dialog, 'button', { name: 'confirm' })
    act(() => {
      fireEvent.click(confirmBtn)
    })
    expect(useUpdateStableTemplate).toBeCalledWith({
      queryParams: {
        accountIdentifier: 'accountId',
        branch: undefined,
        orgIdentifier: 'default',
        projectIdentifier: 'Yogesh_Test',
        repoIdentifier: undefined
      },
      requestOptions: { headers: { 'content-type': 'application/json' } },
      templateIdentifier: 'Test_Template',
      versionLabel: 'v1'
    })
  })

  test('should change version correctly from dropdown', async () => {
    const { getByTestId } = render(
      <TemplateContext.Provider value={stepTemplateContextMock}>
        <TestWrapper path={PATH} pathParams={PATH_PARAMS}>
          <ComponentWrapper />
        </TestWrapper>
      </TemplateContext.Provider>
    )

    const selectVersionButton = getByTestId('dropdown-button')
    act(() => {
      fireEvent.click(selectVersionButton)
    })

    const popover = findPopoverContainer() as HTMLElement
    await waitFor(() => popover)

    const menuItems = popover.querySelectorAll('[class*="menuItem"]')
    expect(menuItems?.length).toBe(3)

    act(() => {
      fireEvent.click(menuItems[1])
    })
    expect(stepTemplateContextMock.deleteTemplateCache).toBeCalled()

    await waitFor(() => getByTestId('location'))
    expect(getByTestId('location')).toMatchInlineSnapshot(`
      <div
        data-testid="location"
      >
        /account/accountId/cd/orgs/default/projects/Yogesh_Test/setup/resources/template-studio/Step/template/Test_Template/?versionLabel=v2
      </div>
    `)
  })

  test('edit btn should work as expected', async () => {
    const { container, getByTestId } = render(
      <TestWrapper path={PATH} pathParams={PATH_PARAMS}>
        <TemplateContext.Provider value={stepTemplateContextMock}>
          <TemplateStudioSubHeaderLeftView />
        </TemplateContext.Provider>
      </TestWrapper>
    )

    const editBtn = container.querySelector('[data-icon="Edit"]') as Element
    expect(editBtn).toBeDefined()
    act(() => {
      fireEvent.click(editBtn)
    })

    let modal = findDialogContainer() as HTMLElement
    await waitFor(() => modal)

    const cancelBtn = getByRole(modal, 'button', { name: 'cancel' })
    act(() => {
      fireEvent.click(cancelBtn)
    })
    expect(stepTemplateContextMock.updateTemplate).not.toBeCalled()

    act(() => {
      fireEvent.click(editBtn)
    })

    modal = findDialogContainer() as HTMLElement
    act(() => {
      fireEvent.change(modal.querySelector("input[name='name']")!, {
        target: { value: 'New Test Template' }
      })
    })
    act(() => {
      fireEvent.click(getByTestId('description-edit'))
    })
    act(() => {
      fireEvent.change(modal.querySelector("textarea[name='description']")!, {
        target: { value: 'This is a new description' }
      })
    })
    act(() => {
      fireEvent.change(modal.querySelector("input[name='versionLabel']")!, {
        target: { value: 'v4' }
      })
    })

    const saveBtn = getByRole(modal, 'button', { name: 'continue' })
    act(() => {
      fireEvent.click(saveBtn)
    })
    await waitFor(() =>
      expect(stepTemplateContextMock.updateTemplate).toBeCalledWith({
        description: 'This is a new description',
        identifier: 'Test_Template',
        name: 'New Test Template',
        orgIdentifier: 'default',
        projectIdentifier: 'Yogesh_Test',
        spec: {
          spec: { headers: [], method: 'GET', outputVariables: [], requestBody: '<+input>', url: '<+input>' },
          timeout: '1m 40s',
          type: 'Http'
        },
        tags: {},
        type: 'Step',
        versionLabel: 'v4'
      })
    )
  })
})
