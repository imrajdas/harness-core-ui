/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, getByRole, getByText, render } from '@testing-library/react'
import { waitFor } from '@testing-library/dom'
import produce from 'immer'
import { set } from 'lodash-es'
import { findPopoverContainer, TestWrapper } from '@common/utils/testUtils'
import routes from '@common/RouteDefinitions'
import { accountPathProps, pipelineModuleParams, pipelinePathProps } from '@common/utils/routeUtils'
import { mockTemplatesSuccessResponse } from '@templates-library/TemplatesTestHelper'
import * as hooks from '@common/hooks/useMutateAsGet'
import {
  mockApiErrorResponse,
  mockApiFetchingResponse
} from '@templates-library/components/TemplateActivityLog/__tests__/TemplateActivityLogTestHelper'
import { templateSelectorContextMock } from 'framework/Templates/TemplateSelectorContext/stateMocks'
import { TemplateSelectorLeftView, TemplateSelectorLeftViewProps } from '../TemplateSelectorLeftView'

const TEST_PATH = routes.toPipelineStudio({ ...accountPathProps, ...pipelinePathProps, ...pipelineModuleParams })
const PATH_PARAMS = {
  pipelineIdentifier: 'Random',
  accountId: 'accountId',
  orgIdentifier: 'default',
  projectIdentifier: 'Yogesh_Test',
  module: 'cd'
}

const baseProps: TemplateSelectorLeftViewProps = {
  setTemplate: jest.fn()
}

const templateListCallMock = jest
  .spyOn(hooks, 'useMutateAsGet')
  .mockImplementation(() => mockTemplatesSuccessResponse as any)

jest.mock('@templates-library/pages/TemplatesPage/views/TemplatesView/TemplatesView', () => ({
  __esModule: true,
  default: () => <div className={'templates-view-mock'}></div>
}))

const contextMock = produce(templateSelectorContextMock, draft => {
  set(draft, 'state.selectorData.templateType', 'Step')
  set(draft, 'state.selectorData.allChildTypes', ['HarnessApproval', 'ShellScript'])
})

const defaultQueryParams = {
  accountIdentifier: 'accountId',
  includeAllTemplatesAvailableAtScope: true,
  orgIdentifier: 'default',
  page: 0,
  projectIdentifier: 'Yogesh_Test',
  searchTerm: '',
  size: 20,
  templateListType: 'Stable'
}

const mockEmptySuccessResponse = {
  loading: false,
  refetch: jest.fn(),
  mutate: jest.fn(),
  cancel: jest.fn(),
  data: {
    status: 'SUCCESS',
    data: {
      content: []
    }
  }
}

describe('<TemplateSelectorLeftView> tests', () => {
  beforeEach(() => jest.clearAllMocks())

  test('should match snapshot', () => {
    const { container } = render(
      <TestWrapper path={TEST_PATH} pathParams={PATH_PARAMS} defaultTemplateSelectorValues={contextMock}>
        <TemplateSelectorLeftView {...baseProps} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
    expect(templateListCallMock).toBeCalledWith(
      expect.anything(),
      expect.objectContaining({
        queryParams: defaultQueryParams
      })
    )
  })

  test('should make list call when scope filter is changed', async () => {
    const { getAllByTestId } = render(
      <TestWrapper path={TEST_PATH} pathParams={PATH_PARAMS} defaultTemplateSelectorValues={contextMock}>
        <TemplateSelectorLeftView {...baseProps} />
      </TestWrapper>
    )

    await waitFor(() => getAllByTestId('dropdown-button'))
    const scopeButton = getAllByTestId('dropdown-button')[0]
    act(() => {
      fireEvent.click(scopeButton)
    })

    const popover = findPopoverContainer() as HTMLElement
    await waitFor(() => popover)

    const menuItems = popover.querySelectorAll('[class*="menuItem"]')
    expect(menuItems?.length).toBe(4)

    act(() => {
      fireEvent.click(menuItems[2])
    })

    expect(templateListCallMock).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({
        queryParams: {
          ...defaultQueryParams,
          includeAllTemplatesAvailableAtScope: false,
          projectIdentifier: undefined
        }
      })
    )
  })

  test('should make list call when type filter is changed', async () => {
    const { getAllByTestId } = render(
      <TestWrapper path={TEST_PATH} pathParams={PATH_PARAMS} defaultTemplateSelectorValues={contextMock}>
        <TemplateSelectorLeftView {...baseProps} />
      </TestWrapper>
    )

    await waitFor(() => getAllByTestId('dropdown-button'))
    const typeButton = getAllByTestId('dropdown-button')[1]
    act(() => {
      fireEvent.click(typeButton)
    })

    const popover = findPopoverContainer() as HTMLElement
    await waitFor(() => popover)

    const menuItems = popover.querySelectorAll('[class*="menuItem"]')
    expect(menuItems?.length).toBe(2)

    act(() => {
      fireEvent.click(menuItems[1])
    })

    expect(templateListCallMock).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({
        body: {
          childTypes: ['ShellScript'],
          filterType: 'Template',
          templateEntityTypes: ['Step']
        }
      })
    )
  })

  test('should render error view correctly', async () => {
    const refetch = jest.fn()
    templateListCallMock.mockImplementation(() => ({ ...mockApiErrorResponse, refetch } as any))

    const { container } = render(
      <TestWrapper path={TEST_PATH} pathParams={PATH_PARAMS} defaultTemplateSelectorValues={contextMock}>
        <TemplateSelectorLeftView {...baseProps} />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()

    waitFor(() => getByText(container, 'Retry'))

    act(() => {
      fireEvent.click(getByText(container, 'Retry'))
    })

    expect(refetch).toBeCalledTimes(1)
  })

  test('should render no results view correctly', async () => {
    templateListCallMock.mockReturnValue(mockEmptySuccessResponse as any)

    const { container } = render(
      <TestWrapper path={TEST_PATH} pathParams={PATH_PARAMS} defaultTemplateSelectorValues={contextMock}>
        <TemplateSelectorLeftView {...baseProps} />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test('should render no results view correctly with search params', async () => {
    templateListCallMock.mockReturnValue(mockEmptySuccessResponse as any)

    const { container, getAllByTestId } = render(
      <TestWrapper path={TEST_PATH} pathParams={PATH_PARAMS} defaultTemplateSelectorValues={contextMock}>
        <TemplateSelectorLeftView {...baseProps} />
      </TestWrapper>
    )

    await waitFor(() => getAllByTestId('dropdown-button'))
    const typeButton = getAllByTestId('dropdown-button')[1]
    act(() => {
      fireEvent.click(typeButton)
    })

    const popover = findPopoverContainer() as HTMLElement
    await waitFor(() => popover)

    const menuItems = popover.querySelectorAll('[class*="menuItem"]')
    expect(menuItems?.length).toBe(2)

    act(() => {
      fireEvent.click(menuItems[1])
    })

    act(() => {
      fireEvent.click(getByRole(container, 'button', { name: /common.filters.clearFilters/ }))
    })

    expect(templateListCallMock).toHaveBeenNthCalledWith(
      3,
      expect.anything(),
      expect.objectContaining({
        body: {
          childTypes: ['HarnessApproval', 'ShellScript'],
          filterType: 'Template',
          templateEntityTypes: ['Step']
        },
        queryParams: defaultQueryParams
      })
    )
  })

  test('should render loading view correctly', async () => {
    templateListCallMock.mockImplementation(() => mockApiFetchingResponse as any)

    const { container } = render(
      <TestWrapper path={TEST_PATH} pathParams={PATH_PARAMS} defaultTemplateSelectorValues={contextMock}>
        <TemplateSelectorLeftView {...baseProps} />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })
})
