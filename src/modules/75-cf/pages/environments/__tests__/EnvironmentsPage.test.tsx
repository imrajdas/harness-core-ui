/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, getByText, getAllByText, waitFor, RenderResult, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@common/utils/testUtils'
import mockImport from 'framework/utils/mockImport'
import EnvironmentsPage from '../EnvironmentsPage'
import mockEnvironments from './mockEnvironments'

describe('EnvironmentsPage', () => {
  beforeEach(() => jest.resetAllMocks())

  const renderComponent = (): RenderResult => {
    return render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/environments"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <EnvironmentsPage />
      </TestWrapper>
    )
  }

  test('EnvironmentsPage should render loading correctly', async () => {
    mockImport('services/cd-ng', {
      useGetEnvironmentListForProject: () => ({ loading: true, refetch: jest.fn() })
    })

    const { container } = renderComponent()

    expect(container.querySelector('[data-icon="steps-spinner"]')).toBeDefined()
  })

  test('EnvironmentDetails should render error correctly', async () => {
    const message = 'ERROR OCCURS'

    mockImport('services/cd-ng', {
      useGetEnvironmentListForProject: () => ({ error: { message }, refetch: jest.fn() })
    })

    renderComponent()

    expect(getByText(document.body, message)).toBeDefined()
  })

  test('EnvironmentDetails should render data correctly', async () => {
    mockImport('services/cd-ng', {
      useGetEnvironmentListForProject: () => ({
        data: mockEnvironments,
        loading: false,
        error: undefined,
        refetch: jest.fn()
      })
    })
    renderComponent()

    expect(getAllByText(document.body, mockEnvironments.data.content[0].name)).toBeDefined()
    expect(getAllByText(document.body, mockEnvironments.data.content[1].name)).toBeDefined()
  })

  test('Should go to edit page by clicking a row', async () => {
    mockImport('services/cd-ng', {
      useGetEnvironmentListForProject: () => ({
        data: mockEnvironments,
        loading: false,
        error: undefined,
        refetch: jest.fn()
      })
    })

    const { container } = renderComponent()

    userEvent.click(container.querySelector('[role="row"]:not(:first-of-type)') as HTMLElement)

    expect(getByText(container, '/account/dummy/cf/orgs/dummy/projects/dummy/environments/QB')).toBeDefined()
  })

  test('Should go to edit page by clicking edit', async () => {
    mockImport('services/cd-ng', {
      useGetEnvironmentListForProject: () => ({
        data: mockEnvironments,
        loading: false,
        error: undefined,
        refetch: jest.fn()
      })
    })

    const { container } = renderComponent()

    userEvent.click(container.querySelector('[data-icon="Options"]') as HTMLElement)
    userEvent.click(document.querySelector('[icon="edit"]') as HTMLElement)

    expect(getByText(container, '/account/dummy/cf/orgs/dummy/projects/dummy/environments/foobar')).toBeDefined()
  })

  test('Should allow deleting', async () => {
    const mutate = jest.fn(() => {
      return Promise.resolve({ data: {} })
    })

    mockImport('services/cd-ng', {
      useDeleteEnvironmentV2: () => ({
        mutate
      })
    })

    mockImport('services/cd-ng', {
      useGetEnvironmentListForProject: () => ({
        data: mockEnvironments,
        loading: false,
        error: undefined,
        refetch: jest.fn()
      })
    })

    renderComponent()

    userEvent.click(document.querySelector('[data-icon="Options"]') as HTMLButtonElement)
    userEvent.click(document.querySelector('[icon="trash"]') as HTMLElement)

    // Delete environment modal to appear
    await waitFor(() => {
      expect(screen.queryByText('cf.environments.delete.title')).toBeInTheDocument()
    })

    userEvent.click(screen.getByRole('button', { name: 'delete' }))

    await waitFor(() => {
      // expect successfully deleted toaster to appear
      expect(screen.getByText('Successfully deleted environment foobar')).toBeInTheDocument()
    })
  })

  test('Should close Delete env modal if user cancels deletion', async () => {
    mockImport('services/cd-ng', {
      useGetEnvironmentListForProject: () => ({
        data: mockEnvironments,
        loading: false,
        error: undefined,
        refetch: jest.fn()
      })
    })

    renderComponent()

    userEvent.click(document.querySelector('[data-icon="Options"]') as HTMLButtonElement)
    userEvent.click(document.querySelector('[icon="trash"]') as HTMLElement)

    // Delete environment modal to appear
    await waitFor(() => {
      expect(screen.queryByText('cf.environments.delete.title')).toBeInTheDocument()
    })

    userEvent.click(screen.getByRole('button', { name: 'cancel' }))

    await waitFor(() => {
      // expect modal to disappear
      expect(screen.queryByText('cf.environments.delete.title')).not.toBeInTheDocument()
    })
  })

  test('Should render correct empty state when there are no environments', () => {
    const noData = {
      status: 'SUCCESS',
      data: {
        totalPages: 1,
        totalItems: 0,
        pageItemCount: 15,
        pageSize: 15,
        content: [],
        pageIndex: 0,
        empty: false
      }
    }

    mockImport('services/cd-ng', {
      useGetEnvironmentListForProject: () => ({
        error: undefined,
        loading: false,
        refetch: jest.fn(),
        data: noData
      })
    })

    renderComponent()

    expect(screen.getByTestId('nodata-image')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'plus newEnvironment' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'cf.noEnvironment.title' })).toBeInTheDocument()
  })
})
