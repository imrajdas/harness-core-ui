/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, getByPlaceholderText, getByRole, render, RenderResult, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Feature } from 'services/cf'
import * as cfServices from 'services/cf'
import { TestWrapper } from '@common/utils/testUtils'
import mockTarget from '@cf/utils/testData/data/mockTarget'
import * as gitSync from '@cf/hooks/useGitSync'
import { CF_DEFAULT_PAGE_SIZE } from '@cf/utils/CFUtils'
import { FFGitSyncProvider } from '@cf/contexts/ff-git-sync-context/FFGitSyncContext'
import type { TargetManagementFlagConfigurationPanelFormValues as FormValues } from '../types'
import TargetManagementFlagConfigurationPanel, {
  TargetManagementFlagConfigurationPanelProps
} from '../TargetManagementFlagConfigurationPanel'

const buildTestFlags = (numberOfFlags = 20, offset = 0): Feature[] =>
  [...new Array(numberOfFlags + offset)].slice(offset, offset + numberOfFlags).map(
    (_, index) =>
      ({
        identifier: `flag${index + 1}`,
        name: `Flag ${index + 1}`,
        description: `Flag description ${index + 1}`,
        variations: [
          { identifier: 'var1', name: 'Var 1' },
          { identifier: 'var2', name: 'Var 2' },
          { identifier: 'var3', name: 'Var 3' }
        ]
      } as Feature)
  )

const buildInitialValues = (flags: Feature[]): FormValues => ({
  flags: flags.reduce<FormValues['flags']>(
    (values, { identifier, variations: [{ identifier: variation }] }) => ({ ...values, [identifier]: { variation } }),
    {}
  )
})

jest.mock('@cf/components/TargetManagementToolbar/TargetManagementToolbar', () => ({
  __esModule: true,
  default: () => <span data-testid="target-management-toolbar">Target Management Toolbar</span>
}))

const renderComponent = (props: Partial<TargetManagementFlagConfigurationPanelProps> = {}): RenderResult => {
  const flags = props.flags ?? buildTestFlags()
  const initialValues = props.initialValues ?? buildInitialValues(flags)

  return render(
    <TestWrapper>
      <FFGitSyncProvider>
        <TargetManagementFlagConfigurationPanel
          item={mockTarget}
          flags={flags}
          initialValues={initialValues}
          onChange={jest.fn()}
          onAdd={jest.fn()}
          noFlagsMessage="NO FLAGS"
          addFlagsDialogTitle="ADD FLAGS TITLE"
          {...props}
        />
      </FFGitSyncProvider>
    </TestWrapper>
  )
}

describe('TargetManagementFlagConfigurationPanel', () => {
  const useGitSyncMock = jest.spyOn(gitSync, 'useGitSync')
  beforeEach(() => {
    jest.resetAllMocks()
    useGitSyncMock.mockReturnValue({ isGitSyncActionsEnabled: false } as any)
  })

  test('it should display the No Flags message when flags is empty', async () => {
    const noFlagsMessage = 'No Flags to display'
    renderComponent({ flags: [], noFlagsMessage })

    expect(screen.queryByTestId('listing-fieldset')).not.toBeInTheDocument()
    expect(screen.getByTestId('no-data-no-flags')).toBeInTheDocument()
    expect(screen.getByText(noFlagsMessage)).toBeInTheDocument()
  })

  test('it should show the button bar when changes are made', async () => {
    renderComponent()

    expect(screen.getByTestId('listing-fieldset')).toBeInTheDocument()
    expect(screen.queryByTestId('listing-buttonbar')).not.toBeInTheDocument()

    userEvent.click(screen.getAllByRole('button', { name: 'cf.targetManagementFlagConfiguration.removeFlag' })[0])

    await waitFor(() => expect(screen.getByTestId('listing-buttonbar')).toBeInTheDocument())
  })

  test('it should call the onChange callback when the form is submitted', async () => {
    let resolvePromise: (value: unknown) => void

    const submitPromise = new Promise(resolve => {
      resolvePromise = resolve
    })

    const onChangeMock = jest.fn().mockReturnValue(submitPromise)
    renderComponent({ onChange: onChangeMock })

    expect(onChangeMock).not.toHaveBeenCalled()
    expect(screen.queryByTestId('saving-spinner')).not.toBeInTheDocument()

    userEvent.click(screen.getAllByRole('button', { name: 'cf.targetManagementFlagConfiguration.removeFlag' })[0])

    await waitFor(() => expect(screen.getByRole('button', { name: 'saveChanges' })).toBeInTheDocument())

    userEvent.click(screen.getByRole('button', { name: 'saveChanges' }))

    await waitFor(() => {
      expect(onChangeMock).toHaveBeenCalled()
      expect(screen.getByTestId('saving-spinner')).toBeInTheDocument()
    })

    act(() => resolvePromise(undefined))

    await waitFor(() => expect(screen.queryByTestId('saving-spinner')).not.toBeInTheDocument())
  })

  test('it should not allow flag removal when the form is submitting', async () => {
    const flags = buildTestFlags(3)
    let resolvePromise: (value: unknown) => void

    const submitPromise = new Promise(resolve => {
      resolvePromise = resolve
    })

    const onChangeMock = jest.fn().mockReturnValue(submitPromise)
    renderComponent({ flags, onChange: onChangeMock })

    expect(screen.getAllByRole('row')).toHaveLength(4)

    userEvent.click(screen.getAllByRole('button', { name: 'cf.targetManagementFlagConfiguration.removeFlag' })[0])

    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(3))

    userEvent.click(screen.getByRole('button', { name: 'saveChanges' }))

    await waitFor(() => expect(screen.getByTestId('saving-spinner')).toBeInTheDocument())

    userEvent.click(screen.getAllByRole('button', { name: 'cf.targetManagementFlagConfiguration.removeFlag' })[0])
    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(3))

    act(() => resolvePromise(undefined))
  })

  // for some reason the mocked exception is escaping the try/catch in the component
  // eslint-disable-next-line jest/no-disabled-tests
  test.skip('it should display an error when the onChange callback throws an error', async () => {
    const message = 'ERROR MESSAGE'
    renderComponent({ onChange: jest.fn().mockRejectedValue({ message }) })

    userEvent.click(screen.getAllByRole('button', { name: 'cf.targetManagementFlagConfiguration.removeFlag' })[0])

    await waitFor(() => expect(screen.getByRole('button', { name: 'saveChanges' })).toBeInTheDocument())

    userEvent.click(screen.getByRole('button', { name: 'saveChanges' }))

    await waitFor(() => {
      expect(screen.queryByTestId('saving-spinner')).not.toBeInTheDocument()
      expect(screen.getByText(message)).toBeInTheDocument()
    })
  })

  test('it should return the form to initial state when the cancel button is clicked', async () => {
    const flags = buildTestFlags(5)
    renderComponent({ flags })

    expect(screen.getAllByRole('row')).toHaveLength(6)
    expect(screen.queryByRole('button', { name: 'cancel' })).not.toBeInTheDocument()

    userEvent.click(screen.getAllByRole('button', { name: 'cf.targetManagementFlagConfiguration.removeFlag' })[0])

    await waitFor(() => {
      expect(screen.getAllByRole('row')).toHaveLength(5)
      expect(screen.getByRole('button', { name: 'cancel' })).toBeInTheDocument()
    })

    userEvent.click(screen.getByRole('button', { name: 'cancel' }))

    await waitFor(() => {
      expect(screen.getAllByRole('row')).toHaveLength(6)
      expect(screen.queryByRole('button', { name: 'cancel' })).not.toBeInTheDocument()
    })
  })

  test('it should display the no search results message when no flags match the search term', async () => {
    renderComponent()

    expect(screen.getByTestId('listing-fieldset')).toBeInTheDocument()
    expect(screen.queryByTestId('no-data-no-search-results')).not.toBeInTheDocument()

    await userEvent.type(screen.getByRole('searchbox'), 'searchterm')

    await waitFor(() => {
      expect(screen.queryByTestId('listing-fieldset')).not.toBeInTheDocument()
      expect(screen.getByTestId('no-data-no-search-results')).toBeInTheDocument()
    })
  })

  test('it should display the all flags removed message when all flags have been removed', async () => {
    const flags = buildTestFlags(1)
    renderComponent({ flags })

    expect(screen.getByTestId('listing-fieldset')).toBeInTheDocument()
    expect(screen.queryByTestId('no-data-all-flags-removed')).not.toBeInTheDocument()

    userEvent.click(screen.getByRole('button', { name: 'cf.targetManagementFlagConfiguration.removeFlag' }))

    await waitFor(() => {
      expect(screen.queryByTestId('listing-fieldset')).not.toBeInTheDocument()
      expect(screen.getByTestId('no-data-all-flags-removed')).toBeInTheDocument()
    })
  })

  test('it should go back by a page when the only row on a page has been removed', async () => {
    const flags = buildTestFlags(16)
    renderComponent({ flags })

    const pagination = screen.getByTestId('listing-pagination')
    expect(pagination).toBeInTheDocument()

    const page1Button = getByRole(pagination, 'button', { name: '1' })
    expect(page1Button).toBeInTheDocument()
    expect(page1Button).toBeDisabled()

    const page2Button = getByRole(pagination, 'button', { name: '2' })
    expect(page2Button).toBeInTheDocument()
    expect(page2Button).toBeEnabled()

    expect(screen.getAllByRole('row')).toHaveLength(16)

    userEvent.click(page2Button)

    await waitFor(() => {
      expect(page1Button).toBeEnabled()
      expect(page2Button).toBeDisabled()
      expect(screen.getAllByRole('row')).toHaveLength(2)
    })

    userEvent.click(screen.getByRole('button', { name: 'cf.targetManagementFlagConfiguration.removeFlag' }))

    await waitFor(() => {
      expect(page1Button).toBeDisabled()
      expect(page2Button).not.toBeInTheDocument()
      expect(screen.getAllByRole('row')).toHaveLength(16)
    })
  })

  test('it should open the Add Flags dialog and call the onAdd callback when submitted', async () => {
    const onAddMock = jest.fn().mockResolvedValue(undefined)
    const addFlagsDialogTitle = 'TEST TITLE'
    const newFlag = buildTestFlags(1, 20)[0]

    jest.spyOn(cfServices, 'useGetAllFeatures').mockReturnValue({
      data: {
        pageSize: CF_DEFAULT_PAGE_SIZE,
        itemCount: 1,
        pageCount: 1,
        pageIndex: 0,
        features: [newFlag]
      },
      loading: false,
      error: null,
      refetch: jest.fn()
    } as any)

    renderComponent({ onAdd: onAddMock, addFlagsDialogTitle })

    expect(screen.queryByText(addFlagsDialogTitle)).not.toBeInTheDocument()

    userEvent.click(screen.getByRole('button', { name: 'cf.targetManagementFlagConfiguration.addFlag' }))

    await waitFor(() => expect(screen.getByText(addFlagsDialogTitle)).toBeInTheDocument())

    const checkbox = screen.getByRole('checkbox')
    userEvent.click(checkbox)
    userEvent.click(
      getByPlaceholderText(
        checkbox.closest('[role="row"]') as HTMLElement,
        '- cf.targetManagementFlagConfiguration.selectVariation -'
      )
    )

    await waitFor(() => expect(screen.getByText(newFlag.variations[0].name as string)).toBeInTheDocument())
    userEvent.click(screen.getByText(newFlag.variations[0].name as string))

    const submitBtn = screen.getByRole('button', { name: 'cf.targetManagementFlagConfiguration.addFlags' })
    await waitFor(() => expect(submitBtn).toBeEnabled())
    userEvent.click(submitBtn)

    await waitFor(() => expect(onAddMock).toHaveBeenCalled())
  })

  test('it should close the Add Flags dialog when the cancel button is clicked', async () => {
    const addFlagsDialogTitle = 'TEST TITLE'

    jest.spyOn(cfServices, 'useGetAllFeatures').mockReturnValue({
      data: {
        pageSize: CF_DEFAULT_PAGE_SIZE,
        itemCount: 1,
        pageCount: 1,
        pageIndex: 0,
        features: buildTestFlags(1, 20)
      },
      loading: false,
      error: null,
      refetch: jest.fn()
    } as any)

    renderComponent({ addFlagsDialogTitle })

    expect(screen.queryByText(addFlagsDialogTitle)).not.toBeInTheDocument()

    userEvent.click(screen.getByRole('button', { name: 'cf.targetManagementFlagConfiguration.addFlag' }))

    await waitFor(() => expect(screen.getByText(addFlagsDialogTitle)).toBeInTheDocument())

    userEvent.click(screen.getByRole('button', { name: 'cancel' }))

    await waitFor(() => expect(screen.queryByText(addFlagsDialogTitle)).not.toBeInTheDocument())
  })

  describe('gitSync', () => {
    test('it should not display the Target Management Toolbar when gitSync is disabled', async () => {
      renderComponent()

      expect(screen.queryByTestId('target-management-toolbar')).not.toBeInTheDocument()
    })

    test('it should display the Target Management Toolbar when gitSync is enabled', async () => {
      useGitSyncMock.mockReturnValue({ isGitSyncActionsEnabled: true } as any)

      renderComponent()

      expect(screen.getByTestId('target-management-toolbar')).toBeInTheDocument()
    })
  })
})
