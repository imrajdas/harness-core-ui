/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { RenderResult, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import mockImport from 'framework/utils/mockImport'
import { TestWrapper } from '@common/utils/testUtils'
import EnvironmentDetailsBody, {
  EnvironmentDetailsBodyProps
} from '@cf/pages/environment-details/EnvironmentDetailsBody'
import * as cfServices from 'services/cf'
import type { ApiKey, ApiKeys } from 'services/cf'
import mockApiKeys from './mockApiKeys'

const renderComponent = (props: Partial<EnvironmentDetailsBodyProps> = {}): RenderResult =>
  render(
    <TestWrapper>
      <EnvironmentDetailsBody
        environment={{
          accountId: 'ZIi1smI9R2SGLNcXKZcoTw',
          orgIdentifier: 'org1',
          projectIdentifier: 'FFrbac',
          identifier: 'dev',
          name: 'dev',
          description: '',
          color: '#0063F7',
          type: 'PreProduction',
          deleted: false,
          tags: {}
        }}
        data={null}
        onNewKeyCreated={jest.fn()}
        refetch={jest.fn()}
        error={undefined}
        loading={false}
        updatePageNumber={jest.fn()}
        updateApiKeyList={jest.fn()}
        recents={[]}
        {...props}
      />
    </TestWrapper>
  )

const mutateMock = jest.fn()
jest.spyOn(cfServices, 'useAddAPIKey').mockReturnValue({
  cancel: jest.fn(),
  error: null,
  loading: false,
  mutate: mutateMock
})

const deleteMutate = jest.fn()
jest.spyOn(cfServices, 'useDeleteAPIKey').mockReturnValue({
  cancel: jest.fn(),
  error: null,
  loading: false,
  mutate: deleteMutate
})

const existingKey: ApiKey = {
  name: 'EXISTING KEY NAME',
  identifier: 'EXISTING KEY IDENTIFIER',
  apiKey: 'existing-api-key',
  type: 'server'
}

describe('EnvironmentDetailsBody', () => {
  beforeAll(() => {
    const { getComputedStyle } = window
    window.getComputedStyle = elt => getComputedStyle(elt)
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('it should render loading', async () => {
    mockImport('services/cf', {
      useGetAllAPIKeys: () => ({ data: mockApiKeys })
    })

    renderComponent({ loading: true })
    expect(document.body.querySelector('[class*=ContainerSpinner]')).toBeDefined()
  })

  test('it should render error', async () => {
    renderComponent({ error: true })
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  test('it should render correct empty state', async () => {
    const hasNoKeys = {
      itemCount: 0,
      pageCount: 0,
      pageIndex: 0,
      pageSize: 0,
      apiKeys: []
    }
    renderComponent({ data: hasNoKeys })

    expect(screen.getByRole('button', { name: 'plus cf.environments.apiKeys.addKey' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'cf.environments.apiKeys.noKeysFoundTitle' })).toBeInTheDocument()
  })

  test('it should not show the copy button and redaction warning when displaying existing keys', async () => {
    renderComponent({ data: mockApiKeys as ApiKeys })

    expect(screen.getByText(mockApiKeys.apiKeys[0].name)).toBeInTheDocument()

    const apiKeyEl = screen.getByText(mockApiKeys.apiKeys[0].apiKey)
    expect(apiKeyEl).toBeInTheDocument()
    expect(apiKeyEl.querySelector('svg')).not.toBeInTheDocument()

    expect(screen.queryByText('cf.environments.apiKeys.redactionWarning')).not.toBeInTheDocument()
  })

  test('it should show Delete SDK key confirmation modal when trash icon is clicked', async () => {
    deleteMutate.mockResolvedValue({ data: {} })
    renderComponent({ data: mockApiKeys as ApiKeys })
    userEvent.click(screen.getByRole('button', { name: 'trash' }))

    await waitFor(() => {
      expect(screen.queryByText('cf.environments.apiKeys.deleteTitle')).toBeInTheDocument()
    })

    userEvent.click(screen.getByRole('button', { name: 'delete' }))
    await waitFor(() => {
      expect(deleteMutate).toBeCalledWith(existingKey.identifier)
      expect(screen.queryByText('cf.environments.apiKeys.deleteTitle')).not.toBeInTheDocument()
      expect(screen.queryByText('cf.environments.apiKeys.deleteSuccess')).toBeInTheDocument()
    })
  })

  test('it should close confirmation modal when cancel button is clicked', async () => {
    renderComponent({ data: mockApiKeys as ApiKeys })

    userEvent.click(screen.getByRole('button', { name: 'trash' }))

    await waitFor(() => {
      expect(screen.queryByText('cf.environments.apiKeys.deleteTitle')).toBeInTheDocument()
    })

    userEvent.click(screen.getByRole('button', { name: 'cancel' }))

    await waitFor(() => {
      expect(screen.queryByText('cf.environments.apiKeys.deleteTitle')).not.toBeInTheDocument()
    })
  })

  test('it should show error message when API Key failed to delete', async () => {
    deleteMutate.mockRejectedValueOnce({ data: { message: 'FAILED TO FETCH' } })

    renderComponent({ data: mockApiKeys as ApiKeys })

    userEvent.click(screen.getByRole('button', { name: 'trash' }))

    await waitFor(() => {
      expect(screen.queryByText('cf.environments.apiKeys.deleteTitle')).toBeInTheDocument()
    })

    userEvent.click(screen.getByRole('button', { name: 'delete' }))
    await waitFor(() => {
      expect(screen.queryByText('FAILED TO FETCH')).toBeInTheDocument()
    })
  })
})
