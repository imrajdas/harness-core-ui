/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, RenderResult, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as uuid from 'uuid'
import * as cfServices from 'services/cf'
import type { GitRepo } from 'services/cf'
import { TestWrapper } from '@common/utils/testUtils'
import { mockFeatures, mockTargetGroup } from '@cf/pages/target-group-detail/__tests__/mocks'
import { GIT_SYNC_ERROR_CODE } from '@cf/hooks/useGitSync'
import { FFGitSyncProvider } from '@cf/contexts/ff-git-sync-context/FFGitSyncContext'
import * as useFeatureFlagMock from '@common/hooks/useFeatureFlag'
import mockTarget from '@cf/utils/testData/data/mockTarget'
import FlagSettingsPanel, { FlagSettingsPanelProps } from '../FlagSettingsPanel'
import * as useGetTargetGroupFlagsHook from '../../../hooks/useGetTargetGroupFlags'

jest.mock('uuid')

const renderComponent = (props: Partial<FlagSettingsPanelProps> = {}): RenderResult =>
  render(
    <TestWrapper
      path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/feature-flags"
      pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
    >
      <FFGitSyncProvider>
        <FlagSettingsPanel targetGroup={mockTargetGroup} {...props} />
      </FFGitSyncProvider>
    </TestWrapper>
  )

const setUseGitRepoMock = (repoDetails: Partial<GitRepo> = {}, repoSet = true): void => {
  jest.spyOn(cfServices, 'useGetGitRepo').mockReturnValue({
    loading: false,
    refetch: jest.fn(),
    data: {
      repoDetails: {
        autoCommit: repoDetails.autoCommit || false,
        branch: repoDetails.branch || 'main',
        enabled: repoDetails.enabled ?? true,
        filePath: repoDetails.filePath || '/flags.yaml',
        repoIdentifier: repoDetails.repoIdentifier || 'harnesstest',
        rootFolder: repoDetails.rootFolder || '/.harness/',
        yamlError: repoDetails.yamlError || ''
      },
      repoSet: repoSet
    }
  } as any)
}

describe('FlagSettingsPanel GitSync', () => {
  const patchTargetGroupMock = jest.fn()
  const patchGitRepoMock = jest.fn()

  afterEach(() => {
    jest.clearAllMocks()
  })

  beforeAll(() => {
    jest.spyOn(useFeatureFlagMock, 'useFeatureFlag').mockReturnValue(true)
    jest.spyOn(uuid, 'v4').mockReturnValue('UUID')
  })

  beforeEach(() => {
    jest.spyOn(useGetTargetGroupFlagsHook, 'default').mockReturnValue({
      data: mockFeatures,
      loading: false,
      error: null,
      refetch: jest.fn()
    } as any)

    jest.spyOn(cfServices, 'useGetAllTargets').mockReturnValue({
      data: { targets: mockTarget },
      loading: false,
      refetch: jest.fn()
    } as any)

    jest.spyOn(cfServices, 'useGetAllSegments').mockReturnValue({
      data: { segments: mockTargetGroup },
      loading: false,
      refetch: jest.fn()
    } as any)

    jest.spyOn(cfServices, 'usePatchSegment').mockReturnValue({
      mutate: patchTargetGroupMock,
      loading: false,
      refetch: jest.fn()
    } as any)

    jest.spyOn(cfServices, 'usePatchGitRepo').mockReturnValue({
      mutate: patchGitRepoMock,
      loading: false,
      refetch: jest.fn()
    } as any)

    setUseGitRepoMock()
  })

  const changeFlagVariationAndSave = async (): Promise<void> => {
    const flag1 = document.querySelector('[name="flags.f1.variation"]')!

    // assert dropdown value = false
    await waitFor(() => expect(flag1).toBeInTheDocument())
    expect(flag1).toHaveValue('Variation 1')

    // change the variation value = true
    userEvent.click(flag1)
    const variation2 = screen.getAllByText('Variation 2')[0]
    expect(variation2).toBeInTheDocument()
    userEvent.click(variation2)

    // click save and assert modal appears
    const saveButton = await waitFor(() => screen.getByRole('button', { name: 'saveChanges' }))
    expect(saveButton).toBeInTheDocument()
    userEvent.click(saveButton)
  }

  test('it should open Git Modal and send correct data on save', async () => {
    renderComponent()

    await changeFlagVariationAndSave()

    await waitFor(() => expect(screen.getByTestId('save-flag-to-git-modal-body')).toBeInTheDocument())

    // add commit message and
    userEvent.type(screen.getByPlaceholderText('common.git.commitMessage'), 'MY COMMIT MESSAGE')

    // select autocommit checkbox
    const autoCommitCheckbox = document.querySelector('input[name="autoCommit"]') as HTMLInputElement
    userEvent.click(autoCommitCheckbox)
    expect(autoCommitCheckbox).toBeChecked()

    // click save and assert
    userEvent.click(screen.getByTestId('save-flag-to-git-modal-save-button'))
    await waitFor(() =>
      expect(patchTargetGroupMock).toBeCalledWith({
        gitDetails: {
          branch: 'main',
          commitMsg: 'MY COMMIT MESSAGE',
          filePath: '/flags.yaml',
          repoIdentifier: 'harnesstest',
          rootFolder: '/.harness/'
        },
        instructions: [
          {
            kind: 'addRule',
            parameters: {
              features: [
                {
                  identifier: 'f1',
                  ruleID: 'ruleId1',
                  variation: 'v2'
                }
              ]
            }
          }
        ]
      })
    )

    // assert autocommit endpoint is called
    await waitFor(() => expect(patchGitRepoMock).toBeCalled())
  })

  test('it should send correct data on save with auto commit ON', async () => {
    setUseGitRepoMock({ autoCommit: true })
    renderComponent()

    await changeFlagVariationAndSave()

    await waitFor(() =>
      expect(patchTargetGroupMock).toBeCalledWith({
        gitDetails: {
          branch: 'main',
          commitMsg: 'cf.gitSync.autoCommitMsg',
          filePath: '/flags.yaml',
          repoIdentifier: 'harnesstest',
          rootFolder: '/.harness/'
        },
        instructions: [
          {
            kind: 'addRule',
            parameters: {
              features: [
                {
                  identifier: 'f1',
                  ruleID: 'ruleId1',
                  variation: 'v2'
                }
              ]
            }
          }
        ]
      })
    )
  })

  test('it should show error modal', async () => {
    setUseGitRepoMock({ autoCommit: true })

    patchTargetGroupMock.mockRejectedValue({
      status: GIT_SYNC_ERROR_CODE,
      data: { message: 'error with git sync service' }
    })

    renderComponent()

    await changeFlagVariationAndSave()

    await waitFor(() => expect(screen.getByText('cf.gitSync.gitErrorModalTitle')).toBeInTheDocument())
  })

  test('it should show invalid yaml modal', async () => {
    setUseGitRepoMock({ yamlError: 'error with the yaml' })
    renderComponent()

    await waitFor(() => expect(screen.getByText('error with the yaml')).toBeInTheDocument())
  })
})
