/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, render, RenderResult, waitFor, screen } from '@testing-library/react'
import { cloneDeep } from 'lodash-es'

import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@common/utils/testUtils'

import mockGitSync from '@cf/utils/testData/data/mockGitSync'
import mockTarget from '@cf/utils/testData/data/mockTarget'
import mockFeature from '@cf/utils/testData/data/mockFeature'
import * as cfServices from 'services/cf'
import * as useFeaturesMock from '@common/hooks/useFeatures'
import * as usePlanEnforcementMock from '@cf/hooks/usePlanEnforcement'
import * as flagUtilsMock from '@cf/utils/FlagUtils'
import * as gitSync from '@cf/hooks/useGitSync'
import { FlagSettings, FlagSettingsProps } from '../FlagSettings'

jest.mock('@cf/hooks/useEnvironmentSelectV2', () => ({
  useEnvironmentSelectV2: jest.fn().mockReturnValue({ data: [], loading: false })
}))

const renderComponent = (props: Partial<FlagSettingsProps> = {}): RenderResult => {
  return render(
    <TestWrapper
      path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/feature-flags"
      pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
    >
      <FlagSettings gitSync={mockGitSync} target={mockTarget} {...props} />
    </TestWrapper>
  )
}

describe('FlagSettings', () => {
  const useGetAllFeaturesMock = jest.spyOn(cfServices, 'useGetAllFeatures')
  jest.spyOn(cfServices, 'usePatchFeature').mockReturnValue({ mutate: jest.fn(), loading: false, data: [] } as any)

  beforeEach(() => {
    useGetAllFeaturesMock.mockReturnValue({
      data: { features: [mockFeature] },
      loading: false,
      refetch: jest.fn()
    } as any)
  })

  test('it should render correctly', async () => {
    const { container } = renderComponent()

    expect(container).toMatchSnapshot()
  })

  test('it should render variation options correctly', async () => {
    renderComponent()

    const variationDropdown = screen.getByPlaceholderText('- Select -')

    userEvent.click(variationDropdown)

    await waitFor(() => {
      expect(document.querySelectorAll('li > p')[0]).toHaveTextContent('True')
      expect(document.querySelectorAll('li > p')[1]).toHaveTextContent('False')
    })
  })

  test('it should change variation on select option change', async () => {
    const onSave = jest.spyOn(flagUtilsMock, 'useServeFeatureFlagVariationToTargets').mockReturnValue({} as any)
    jest.spyOn(gitSync, 'useGitSync').mockReturnValue({ ...mockGitSync, isGitSyncEnabled: false })

    renderComponent()

    await waitFor(() => expect(screen.getByPlaceholderText('- Select -')).toHaveValue('False'))

    userEvent.click(screen.getByPlaceholderText('- Select -'))
    await waitFor(() => expect(document.querySelectorAll('li > p')[0]).toHaveTextContent('True'))

    userEvent.click(document.querySelectorAll('li > p')[0])

    expect(screen.getByPlaceholderText('- Select -')).toHaveValue('True')
    expect(onSave).toHaveBeenCalled()
  })

  test('it should show Git Sync modal when variation changed', async () => {
    jest.spyOn(gitSync, 'useGitSync').mockReturnValue({ ...mockGitSync, isAutoCommitEnabled: false })

    renderComponent()

    await waitFor(() => expect(screen.getByPlaceholderText('- Select -')).toHaveValue('False'))

    userEvent.click(screen.getByPlaceholderText('- Select -'))

    await waitFor(() => expect(document.querySelectorAll('li > p')[0]).toHaveTextContent('True'))
    userEvent.click(document.querySelectorAll('li > p')[0])

    await waitFor(() => expect(screen.getByTestId('save-flag-to-git-modal')).toBeInTheDocument())
  })

  test('it should callback correctly when Git Sync Modal Save button is clicked', async () => {
    jest.spyOn(gitSync, 'useGitSync').mockReturnValue(mockGitSync)
    const onSave = jest.spyOn(flagUtilsMock, 'useServeFeatureFlagVariationToTargets').mockReturnValue({} as any)

    renderComponent()

    await waitFor(() => expect(screen.getByPlaceholderText('- Select -')).toHaveValue('False'))
    userEvent.click(screen.getByPlaceholderText('- Select -'))
    await waitFor(() => expect(document.querySelectorAll('li > p')[0]).toHaveTextContent('True'))
    userEvent.click(document.querySelectorAll('li > p')[0])

    await waitFor(() => expect(screen.getByTestId('save-flag-to-git-modal')).toBeInTheDocument())
    userEvent.type(
      document.querySelector("textarea[name='gitDetails.commitMsg']") as HTMLInputElement,
      'TEST COMMIT MESSAGE',
      { allAtOnce: true }
    )
    userEvent.click(screen.getByTestId('save-flag-to-git-modal-save-button'))

    await waitFor(() => expect(onSave).toBeCalled())
    await waitFor(() => expect(screen.getByPlaceholderText('- Select -')).toHaveValue('False'))
  })

  test('it should callback correctly when variation changed and Git Sync Autocommit enabled', async () => {
    const gitSyncMock = { ...mockGitSync, isAutoCommitEnabled: true }
    jest.spyOn(gitSync, 'useGitSync').mockReturnValue(gitSyncMock)
    const onSave = jest.spyOn(flagUtilsMock, 'useServeFeatureFlagVariationToTargets').mockReturnValue({} as any)

    renderComponent({ gitSync: gitSyncMock })

    await waitFor(() => expect(screen.getByPlaceholderText('- Select -')).toHaveValue('False'))
    userEvent.click(screen.getByPlaceholderText('- Select -'))
    await waitFor(() => expect(document.querySelectorAll('li > p')[0]).toHaveTextContent('True'))
    userEvent.click(document.querySelectorAll('li > p')[0])

    await waitFor(() => expect(screen.queryByTestId('save-flag-to-git-modal')).not.toBeInTheDocument())
    await waitFor(() => expect(onSave).toBeCalled())
  })

  test('it should close Git Sync modal and reset variation change when cancel button clicked', async () => {
    jest.spyOn(gitSync, 'useGitSync').mockReturnValue(mockGitSync)

    renderComponent()

    await waitFor(() => expect(screen.getByPlaceholderText('- Select -')).toHaveValue('False'))

    userEvent.click(screen.getByPlaceholderText('- Select -'))

    await waitFor(() => expect(document.querySelectorAll('li > p')[0]).toHaveTextContent('True'))
    userEvent.click(document.querySelectorAll('li > p')[0])

    await waitFor(() => expect(screen.getByTestId('save-flag-to-git-modal')).toBeInTheDocument())
    userEvent.click(screen.getByTestId('save-flag-to-git-modal-cancel-button'))

    expect(screen.queryByTestId('save-flag-to-git-modal')).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByPlaceholderText('- Select -')).toHaveValue('False'))
  })

  test('it should call auto commit endpoint when user toggles input', async () => {
    const handleAutoCommitMock = jest.fn()
    const gitSyncMock = { ...mockGitSync, handleAutoCommit: handleAutoCommitMock }
    jest.spyOn(gitSync, 'useGitSync').mockReturnValue(gitSyncMock)
    jest.spyOn(flagUtilsMock, 'useServeFeatureFlagVariationToTargets').mockReturnValue({} as any)

    renderComponent({ gitSync: gitSyncMock })

    await waitFor(() => expect(screen.getByPlaceholderText('- Select -')).toHaveValue('False'))

    userEvent.click(screen.getByPlaceholderText('- Select -'))

    await waitFor(() => expect(document.querySelectorAll('li > p')[0]).toHaveTextContent('True'))
    userEvent.click(document.querySelectorAll('li > p')[0])

    await waitFor(() => expect(screen.getByTestId('save-flag-to-git-modal')).toBeInTheDocument())
    userEvent.type(
      document.querySelector("textarea[name='gitDetails.commitMsg']") as HTMLInputElement,
      'TEST COMMIT MESSAGE',
      { allAtOnce: true }
    )

    const autoCommitCheckbox = document.querySelector("input[name='autoCommit']") as HTMLInputElement
    userEvent.click(autoCommitCheckbox)
    expect(autoCommitCheckbox).toBeChecked()

    userEvent.click(screen.getByText('save'))

    await waitFor(() => expect(handleAutoCommitMock).toBeCalledWith(true))
  })

  test('it should render plan enforcement popover when limits reached for free plans', async () => {
    jest.spyOn(useFeaturesMock, 'useFeature').mockReturnValue({ enabled: false })
    jest.spyOn(usePlanEnforcementMock, 'default').mockReturnValue({ isPlanEnforcementEnabled: true, isFreePlan: true })

    renderComponent()

    fireEvent.mouseOver(screen.getByPlaceholderText('- Select -'))

    await waitFor(() => expect(screen.getByText('cf.planEnforcement.upgradeRequiredMau')).toBeInTheDocument())
  })

  test('it should not render plan enforcement popover when limits reached for non-free plans', async () => {
    jest.spyOn(useFeaturesMock, 'useFeature').mockReturnValue({ enabled: false })
    jest.spyOn(usePlanEnforcementMock, 'default').mockReturnValue({ isPlanEnforcementEnabled: true, isFreePlan: false })

    renderComponent()

    fireEvent.mouseOver(screen.getByPlaceholderText('- Select -'))

    await waitFor(() => expect(screen.queryByText('cf.planEnforcement.upgradeRequiredMau')).not.toBeInTheDocument())
  })

  test('it should disable variation drop downs when the flag is disabled', async () => {
    const disabledFeature1 = cloneDeep(mockFeature)
    disabledFeature1.identifier = 'disabled_feature_1'
    ;(disabledFeature1.envProperties as any).state = 'off'

    const disabledFeature2 = cloneDeep(disabledFeature1)
    disabledFeature2.identifier = 'disabled_feature_2'

    useGetAllFeaturesMock.mockReturnValue({
      data: { features: [mockFeature, disabledFeature1, disabledFeature2] },
      loading: false,
      refetch: jest.fn()
    } as any)

    renderComponent()

    const inputs = [...document.querySelectorAll('[data-testid^="variation_select"] input')] as HTMLInputElement[]

    expect(inputs).toHaveLength(3)
    expect(inputs.filter(({ disabled }) => !disabled)).toHaveLength(1)
    expect(inputs.filter(({ disabled }) => disabled)).toHaveLength(2)
  })
})
