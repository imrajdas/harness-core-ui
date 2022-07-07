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
import { CF_DEFAULT_PAGE_SIZE } from '@cf/utils/CFUtils'
import type { Feature, Features, GitRepo } from 'services/cf'
import * as cfServices from 'services/cf'
import { GIT_SYNC_ERROR_CODE } from '@cf/hooks/useGitSync'
import { TestWrapper } from '@common/utils/testUtils'
import { FFGitSyncProvider } from '@cf/contexts/ff-git-sync-context/FFGitSyncContext'
import mockTarget from '@cf/utils/testData/data/mockTarget'
import * as useFeatureFlagMock from '@common/hooks/useFeatureFlag'
import FlagSettings, { FlagSettingsProps } from '../FlagSettings'

const mockFlags = [
  {
    identifier: 'f1',
    name: 'Flag 1',
    variations: [
      { name: 'Variation 1', identifier: 'v1' },
      { name: 'Variation 2', identifier: 'v2' },
      { identifier: 'v3' }
    ],
    envProperties: {
      variationMap: [{ variation: 'v1', targets: [{ identifier: mockTarget.identifier, name: mockTarget.name }] }]
    }
  }
] as Feature[]

jest.mock('@common/components/ContainerSpinner/ContainerSpinner', () => ({
  ContainerSpinner: () => <span data-testid="container-spinner">Container Spinner</span>
}))

jest.mock('uuid')

const mockResponse = (flags: Feature[] = mockFlags): Features =>
  ({
    features: flags,
    pageIndex: 0,
    pageSize: CF_DEFAULT_PAGE_SIZE,
    itemCount: flags.length,
    pageCount: Math.ceil(flags.length / CF_DEFAULT_PAGE_SIZE),
    version: 1
  } as Features)

const renderComponent = (props: Partial<FlagSettingsProps> = {}): RenderResult =>
  render(
    <TestWrapper>
      <FFGitSyncProvider>
        <FlagSettings target={mockTarget} {...props} />
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

describe('Targeting GitSync', () => {
  const patchTargetMock = jest.fn()
  const patchGitRepoMock = jest.fn()

  beforeAll(() => {
    jest.spyOn(useFeatureFlagMock, 'useFeatureFlag').mockReturnValue(true)
    jest.spyOn(uuid, 'v4').mockReturnValue('UUID')
  })

  afterEach(() => jest.clearAllMocks())

  beforeEach(() => {
    jest.spyOn(cfServices, 'useGetAllTargets').mockReturnValue({
      data: { targets: mockTarget },
      loading: false,
      refetch: jest.fn()
    } as any)

    jest.spyOn(cfServices, 'useGetAllFeatures').mockReturnValue({
      data: mockResponse(),
      loading: false,
      error: null,
      refetch: jest.fn()
    } as any)

    jest.spyOn(cfServices, 'usePatchTarget').mockReturnValue({
      mutate: patchTargetMock,
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
    // get the variation dropdown
    const flag1 = document.querySelector('[name="flags.f1.variation"]')!
    // assert dropdown value = false
    await waitFor(() => expect(flag1).toBeInTheDocument())
    expect(flag1).toHaveValue('Variation 1')

    // change the variation value
    userEvent.click(flag1)
    const var2 = screen.getByText('Variation 2')
    expect(var2).toBeInTheDocument()
    userEvent.click(var2)

    // click save and assert modal appears
    const saveButton = await waitFor(() => screen.getByRole('button', { name: 'saveChanges' }))
    expect(saveButton).toBeInTheDocument()
    userEvent.click(saveButton)
  }

  test('it should open Git Modal and send correct data on save', async () => {
    setUseGitRepoMock({ autoCommit: false })

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
      expect(patchTargetMock).toBeCalledWith({
        gitDetails: {
          branch: 'main',
          commitMsg: 'MY COMMIT MESSAGE',
          filePath: '/flags.yaml',
          repoIdentifier: 'harnesstest',
          rootFolder: '/.harness/'
        },
        instructions: [
          {
            kind: 'addTargetToFlagsVariationTargetMap',
            parameters: {
              features: [
                {
                  identifier: 'f1',
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
      expect(patchTargetMock).toBeCalledWith({
        gitDetails: {
          branch: 'main',
          commitMsg: 'cf.gitSync.autoCommitMsg',
          filePath: '/flags.yaml',
          repoIdentifier: 'harnesstest',
          rootFolder: '/.harness/'
        },
        instructions: [
          {
            kind: 'addTargetToFlagsVariationTargetMap',
            parameters: {
              features: [
                {
                  identifier: 'f1',
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
    const message = 'git error'

    patchTargetMock.mockRejectedValue({
      status: GIT_SYNC_ERROR_CODE,
      data: { message }
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
