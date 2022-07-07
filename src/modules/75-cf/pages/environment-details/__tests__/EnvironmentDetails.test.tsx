/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, getByText, getAllByText, RenderResult, screen, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import mockImport from 'framework/utils/mockImport'
import * as cfServices from 'services/cf'
import type { ApiKey } from 'services/cf'
import { CF_DEFAULT_PAGE_SIZE } from '@cf/utils/CFUtils'
import EnvironmentDetails from '../EnvironmentDetails'
import mockEnvironment from './mockEnvironment'
import mockApiKeys from './mockApiKeys'

const mutateMock = jest.fn()
const useGetAllAPIKeysMock = jest.spyOn(cfServices, 'useGetAllAPIKeys')
jest.spyOn(cfServices, 'useAddAPIKey').mockReturnValue({
  cancel: jest.fn(),
  error: null,
  loading: false,
  mutate: mutateMock
})

const getMockResponseData = (keys: ApiKey[] = []) => ({
  loading: false,
  error: null,
  refetch: jest.fn(),
  absolutePath: '',
  response: {} as Response,
  cancel: jest.fn(),
  data: {
    itemCount: Math.ceil(keys.length / CF_DEFAULT_PAGE_SIZE),
    pageCount: 1,
    pageIndex: 0,
    pageSize: CF_DEFAULT_PAGE_SIZE,
    apiKeys: keys
  }
})

describe('EnvironmentDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useGetAllAPIKeysMock.mockReturnValue(getMockResponseData())
  })

  const renderComponent = (): RenderResult =>
    render(
      <TestWrapper>
        <EnvironmentDetails />
      </TestWrapper>
    )

  test('EnvironmentDetails should render loading correctly', () => {
    mockImport('@cf/hooks/useSyncedEnvironment', {
      useSyncedEnvironment: () => ({ loading: true, refetch: jest.fn() })
    })

    const { container } = renderComponent()

    expect(container.querySelector('[data-icon="steps-spinner"]')).toBeInTheDocument()
  })

  test('EnvironmentDetails should render error correctly', async () => {
    const message = 'ERROR OCCURS'

    mockImport('@cf/hooks/useSyncedEnvironment', {
      useSyncedEnvironment: () => ({ data: undefined, loading: false, error: { message }, refetch: jest.fn() })
    })

    renderComponent()

    expect(getByText(document.body, message)).toBeDefined()
  })

  test('EnvironmentDetails should render data correctly', async () => {
    mockImport('services/cd-ng', {
      useGetEnvironment: () => ({ data: mockEnvironment, loading: false, error: undefined, refetch: jest.fn() })
    })

    mockImport('services/cf', {
      useGetAllAPIKeys: () => ({ data: mockApiKeys })
    })

    mockImport('@cf/hooks/useSyncedEnvironment', {
      useSyncedEnvironment: () => ({ data: mockEnvironment, loading: undefined, error: undefined, refetch: jest.fn() })
    })

    renderComponent()

    expect(getAllByText(document.body, mockEnvironment.data.name)).toBeDefined()
    expect(getAllByText(document.body, mockEnvironment.data.identifier)).toBeDefined()

    expect(getAllByText(document.body, mockApiKeys.apiKeys[0].name)).toBeDefined()
  })

  test('it should render the toolbar when there are existing SDK Keys', async () => {
    mockImport('services/cd-ng', {
      useGetEnvironment: () => ({ data: mockEnvironment, loading: false, error: undefined, refetch: jest.fn() })
    })

    mockImport('services/cf', {
      useGetAllAPIKeys: () => ({ data: mockApiKeys })
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'plus cf.environments.apiKeys.addKey' })).toBeInTheDocument()
      expect(document.querySelector('.PageSubHeader--container')).toBeInTheDocument()
    })
  })
})
