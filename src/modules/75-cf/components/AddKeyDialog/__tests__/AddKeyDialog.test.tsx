/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, RenderResult, waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as cfServices from 'services/cf'
import { TestWrapper } from '@common/utils/testUtils'
import { CF_DEFAULT_PAGE_SIZE, EnvironmentSDKKeyType } from '@cf/utils/CFUtils'
import AddKeyDialog, { AddKeyDialogProps } from '../AddKeyDialog'

const apiKeysMock = [
  {
    apiKey: 'mock',
    identifier: 'mock identifier',
    key: 'dummy ',
    name: 'dummy api key name',
    type: EnvironmentSDKKeyType.SERVER
  }
]

describe('Test AddKeyDialog', () => {
  const useAddAPIKeyMock = jest.spyOn(cfServices, 'useAddAPIKey')
  const useGetAllAPIKeysMock = jest.spyOn(cfServices, 'useGetAllAPIKeys')

  beforeEach(() => {
    jest.clearAllMocks()

    useAddAPIKeyMock.mockReturnValue({
      cancel: jest.fn(),
      error: null,
      loading: false,
      mutate: jest.fn().mockResolvedValue(null)
    })

    useGetAllAPIKeysMock.mockReturnValue({
      loading: false,
      error: null,
      refetch: jest.fn(),
      absolutePath: '',
      response: {} as Response,
      cancel: jest.fn(),
      data: {
        itemCount: apiKeysMock.length,
        pageCount: 1,
        pageIndex: 0,
        pageSize: CF_DEFAULT_PAGE_SIZE,
        apiKeys: apiKeysMock
      }
    })
  })

  const onCreate = jest.fn()
  const renderComponent = (props: Partial<AddKeyDialogProps> = {}): RenderResult => {
    return render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/feature-flags"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <AddKeyDialog
          environment={{
            accountId: 'dummy',
            identifier: 'dummy',
            orgIdentifier: 'dummy',
            projectIdentifier: 'dummy'
          }}
          onCreate={onCreate}
          {...props}
        />
      </TestWrapper>
    )
  }

  const openDialog = async (): Promise<void> => {
    const addKeyBtn = screen.getByRole('button', { name: 'cf.environments.apiKeys.addKey' })
    expect(addKeyBtn).toBeInTheDocument()
    userEvent.click(addKeyBtn)
    await waitFor(() => expect(screen.getByText('cf.environments.apiKeys.addKeyTitle')).toBeInTheDocument())
  }

  test('it should render duplicate SDK key name error message when user enters an existing SDK key name', async () => {
    renderComponent({ apiKeys: apiKeysMock })

    await openDialog()

    userEvent.type(document.querySelector('input[name=name]') as HTMLInputElement, 'dummy api key name', {
      allAtOnce: true
    })
    userEvent.click(screen.getByRole('button', { name: 'createSecretYAML.create' }))

    await waitFor(() => {
      expect(screen.getByText('cf.environments.apiKeys.duplicateKey')).toBeInTheDocument()
    })
  })

  test('it should render missing SDK key name error message when user attempts to submit form without entering a name', async () => {
    renderComponent()

    await openDialog()

    userEvent.click(screen.getByText('createSecretYAML.create'))

    await waitFor(() => {
      expect(screen.getByText('cf.environments.apiKeys.emptyName')).toBeInTheDocument()
    })
  })

  test('it should send correct values to useAddAPIKey and display success message', async () => {
    const mutateMock = jest.fn().mockResolvedValue({})
    useAddAPIKeyMock.mockReturnValue({ mutate: mutateMock } as any)

    renderComponent()

    await openDialog()

    userEvent.type(document.querySelector('input[name=name]') as HTMLInputElement, 'new api key name', {
      allAtOnce: true
    })
    userEvent.click(screen.getByRole('button', { name: 'createSecretYAML.create' }))

    await waitFor(() => {
      expect(mutateMock).toBeCalledWith({
        identifier: 'new_api_key_name',
        name: 'new api key name',
        type: 'Server'
      })

      expect(screen.getByText('cf.environments.apiKeys.create')).toBeInTheDocument()
    })
  })

  test('it should display error message when useAddApiKey fails', async () => {
    const message = 'FAILED TO CREATE NEW SDK KEY'
    useAddAPIKeyMock.mockReturnValue({ mutate: jest.fn().mockRejectedValue({ message }) } as any)

    renderComponent()

    await openDialog()

    userEvent.type(document.querySelector('input[name=name]') as HTMLInputElement, 'dummy api key name', {
      allAtOnce: true
    })
    userEvent.click(screen.getByRole('button', { name: 'createSecretYAML.create' }))

    await waitFor(() => {
      expect(screen.getByText(message)).toBeInTheDocument()
    })
  })
})
