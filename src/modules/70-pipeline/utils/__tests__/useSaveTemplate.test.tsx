/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, render, waitFor, getByText as getElementByText } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { noop } from 'lodash-es'
import { findDialogContainer, TestWrapper } from '@common/utils/testUtils'
import { TemplateContextMetadata, useSaveTemplate } from '@pipeline/utils/useSaveTemplate'
import type { NGTemplateInfoConfig } from 'services/template-ng'
import * as templateNg from 'services/template-ng'
import { branchStatusMock, gitConfigs, sourceCodeManagers } from '@connectors/mocks/mock'
import gitSyncListResponse from '@common/utils/__tests__/mocks/gitSyncRepoListMock.json'
import { GitSyncTestWrapper } from '@common/utils/gitSyncTestUtils'
import { createTemplatePromiseArg, updateExistingTemplateLabelPromiseArg } from './useSaveTemplateHelper'

export const stepTemplateMock = {
  name: 'Test Http Template',
  identifier: 'Test_Http_Template',
  versionLabel: 'v1',
  type: 'Step',
  projectIdentifier: 'Yogesh_Test',
  orgIdentifier: 'default',
  tags: {},
  spec: {
    type: 'Http',
    timeout: '1m 40s',
    spec: { url: '<+input>', method: 'GET', headers: [], outputVariables: [], requestBody: '<+input>' }
  }
}

jest.mock('services/template-ng', () => ({
  createTemplatePromise: jest.fn().mockImplementation(() => Promise.resolve({ status: 'SUCCESS' })),
  updateExistingTemplateLabelPromise: jest.fn().mockImplementation(() => Promise.resolve({ status: 'SUCCESS' }))
}))

const getListOfBranchesWithStatus = jest.fn(() => Promise.resolve(branchStatusMock))
const getListGitSync = jest.fn(() => Promise.resolve(gitConfigs))

jest.mock('services/cd-ng', () => ({
  useCreatePR: jest.fn(() => noop),
  useCreatePRV2: jest.fn(() => noop),
  useGetFileContent: jest.fn(() => noop),
  useGetListOfBranchesWithStatus: jest.fn().mockImplementation(() => {
    return { data: branchStatusMock, refetch: getListOfBranchesWithStatus, loading: false }
  }),
  useListGitSync: jest.fn().mockImplementation(() => {
    return { data: gitSyncListResponse, refetch: getListGitSync, loading: false }
  }),
  useGetSourceCodeManagers: jest.fn().mockImplementation(() => {
    return { data: sourceCodeManagers, refetch: jest.fn() }
  })
}))
function Wrapped(props: TemplateContextMetadata): React.ReactElement {
  const { saveAndPublish } = useSaveTemplate(props)
  return (
    <>
      <button onClick={() => saveAndPublish(stepTemplateMock as NGTemplateInfoConfig, {})}>Save</button>
      <button onClick={() => saveAndPublish(stepTemplateMock as NGTemplateInfoConfig, { isEdit: true })}>Edit</button>
      <button
        onClick={() => saveAndPublish({ ...stepTemplateMock, versionLabel: 'v1.0.0' } as NGTemplateInfoConfig, {})}
      >
        Save with versionLabel
      </button>
      <button
        onClick={() => saveAndPublish({ ...stepTemplateMock, versionLabel: 'v1.0.0-0_0' } as NGTemplateInfoConfig, {})}
      >
        Save with complex versionLabel
      </button>
    </>
  )
}

describe('useSaveTemplate Test', () => {
  test('create should work as expected', async () => {
    const props: TemplateContextMetadata = {
      deleteTemplateCache: jest.fn()
    }
    const { getByText } = render(
      <TestWrapper>
        <Wrapped {...props} />
      </TestWrapper>
    )

    const saveBtn = getByText('Save')
    await act(async () => {
      fireEvent.click(saveBtn)
    })
    expect(templateNg.createTemplatePromise).toBeCalled()
    expect(props.deleteTemplateCache).toBeCalled()
  })
  test('edit should work as expected', async () => {
    const props: TemplateContextMetadata = {
      fetchTemplate: jest.fn()
    }
    const { getByText } = render(
      <TestWrapper>
        <Wrapped {...props} />
      </TestWrapper>
    )

    const saveBtn = getByText('Edit')
    await act(async () => {
      fireEvent.click(saveBtn)
    })
    expect(templateNg.updateExistingTemplateLabelPromise).toBeCalled()
    expect(props.fetchTemplate).toBeCalled()
  })

  test('filePath should be expected', async () => {
    const props: TemplateContextMetadata = {
      deleteTemplateCache: jest.fn(),
      gitDetails: {
        repoIdentifier: 'testRepo',
        branch: 'testBranch'
      }
    }
    const { getByText } = render(
      <TestWrapper defaultAppStoreValues={{ isGitSyncEnabled: true }}>
        <Wrapped {...props} />
      </TestWrapper>
    )

    const saveBtn = getByText('Save with versionLabel')
    await act(async () => {
      fireEvent.click(saveBtn)
    })
    const commentsDialog = findDialogContainer()
    expect(commentsDialog).toBeDefined()

    const filePath = commentsDialog!.querySelector('input[name="filePath"]')!
    expect(filePath).toBeDefined()
    expect(filePath?.getAttribute('value')).toBe('Test_Http_Template_v100.yaml')
  })
  test('filePath should be expected for underscore and hyphen', async () => {
    const props: TemplateContextMetadata = {
      deleteTemplateCache: jest.fn(),
      gitDetails: {
        repoIdentifier: 'testRepo',
        branch: 'testBranch'
      }
    }
    const { getByText } = render(
      <TestWrapper defaultAppStoreValues={{ isGitSyncEnabled: true }}>
        <Wrapped {...props} />
      </TestWrapper>
    )

    const saveBtn = getByText('Save with complex versionLabel')
    await act(async () => {
      fireEvent.click(saveBtn)
    })
    const commentsDialog = findDialogContainer()
    expect(commentsDialog).toBeDefined()

    const filePath = commentsDialog!.querySelector('input[name="filePath"]')!
    expect(filePath).toBeDefined()
    expect(filePath?.getAttribute('value')).toBe('Test_Http_Template_v100-0_0.yaml')
  })

  describe('When GitSync is enabled', () => {
    test('edit should work as expected', async () => {
      const props: TemplateContextMetadata = {
        gitDetails: {
          branch: 'feature',
          filePath: 'test_pipeline.yaml',
          objectId: '4471ec3aa40c26377353974c29a6670d998db06f',
          repoIdentifier: 'gitSyncRepo',
          rootFolder: '/rootFolderTest/.harness/'
        },
        fetchTemplate: jest.fn()
      }
      const { getByText } = render(
        <GitSyncTestWrapper defaultAppStoreValues={{ isGitSyncEnabled: true }}>
          <Wrapped {...props} />
        </GitSyncTestWrapper>
      )

      const editBtn = getByText('Edit')
      userEvent.click(editBtn)

      let saveToGitSaveBtn: HTMLElement
      await waitFor(() => {
        const portalDiv = document.getElementsByClassName('bp3-portal')[0] as HTMLElement
        const savePipelinesToGitHeader = getByText('common.git.saveResourceLabel')
        expect(savePipelinesToGitHeader).toBeInTheDocument()

        const nameInput = document.querySelector('input[name="name"]')
        expect(nameInput).toBeDisabled()
        expect(nameInput?.getAttribute('value')).toBe('Test Http Template')

        saveToGitSaveBtn = getElementByText(portalDiv, 'save').parentElement as HTMLElement
        expect(saveToGitSaveBtn).toBeInTheDocument()
      })
      fireEvent.click(saveToGitSaveBtn!)
      await waitFor(() => expect(templateNg.updateExistingTemplateLabelPromise).toHaveBeenCalled())
      expect(templateNg.updateExistingTemplateLabelPromise).toHaveBeenCalledWith(updateExistingTemplateLabelPromiseArg)

      expect(props.fetchTemplate).toBeCalled()
    })

    test('edit should work as expected', async () => {
      jest
        .spyOn(templateNg, 'updateExistingTemplateLabelPromise')
        .mockImplementation(() => Promise.reject({ status: 'ERROR', message: 'There was error' }))

      const props: TemplateContextMetadata = {
        gitDetails: {
          branch: 'feature',
          filePath: 'test_pipeline.yaml',
          objectId: '4471ec3aa40c26377353974c29a6670d998db06f',
          repoIdentifier: 'gitSyncRepo',
          rootFolder: '/rootFolderTest/.harness/'
        },
        fetchTemplate: jest.fn()
      }
      const { getByText } = render(
        <GitSyncTestWrapper defaultAppStoreValues={{ isGitSyncEnabled: true }}>
          <Wrapped {...props} />
        </GitSyncTestWrapper>
      )

      const editBtn = getByText('Edit')
      userEvent.click(editBtn)

      let saveToGitSaveBtn: HTMLElement
      await waitFor(() => {
        const portalDiv = document.getElementsByClassName('bp3-portal')[0] as HTMLElement
        const savePipelinesToGitHeader = getByText('common.git.saveResourceLabel')
        expect(savePipelinesToGitHeader).toBeInTheDocument()

        const nameInput = document.querySelector('input[name="name"]')
        expect(nameInput).toBeDisabled()
        expect(nameInput?.getAttribute('value')).toBe('Test Http Template')

        saveToGitSaveBtn = getElementByText(portalDiv, 'save').parentElement as HTMLElement
        expect(saveToGitSaveBtn).toBeInTheDocument()
      })
      fireEvent.click(saveToGitSaveBtn!)
      await waitFor(() => expect(templateNg.updateExistingTemplateLabelPromise).toHaveBeenCalled())
      expect(templateNg.updateExistingTemplateLabelPromise).toHaveBeenCalledWith(updateExistingTemplateLabelPromiseArg)

      expect(props.fetchTemplate).toBeCalledTimes(0)
      await waitFor(() => expect(getByText('There was error')).toBeInTheDocument())
    })

    test('create should work as expected', async () => {
      const props: TemplateContextMetadata = {
        deleteTemplateCache: jest.fn(),
        gitDetails: {
          branch: 'feature',
          filePath: 'test_pipeline.yaml',
          repoIdentifier: 'gitSyncRepo',
          rootFolder: '/rootFolderTest/.harness/'
        }
      }
      const { getByText } = render(
        <GitSyncTestWrapper defaultAppStoreValues={{ isGitSyncEnabled: true }}>
          <Wrapped {...props} />
        </GitSyncTestWrapper>
      )

      const saveBtn = getByText('Save')
      userEvent.click(saveBtn)

      let saveToGitSaveBtn: HTMLElement
      await waitFor(() => {
        const portalDiv = document.getElementsByClassName('bp3-portal')[0] as HTMLElement
        const savePipelinesToGitHeader = getByText('common.git.saveResourceLabel')
        expect(savePipelinesToGitHeader).toBeInTheDocument()

        const nameInput = document.querySelector('input[name="name"]')
        expect(nameInput).toBeDisabled()
        expect(nameInput?.getAttribute('value')).toBe('Test Http Template')

        saveToGitSaveBtn = getElementByText(portalDiv, 'save').parentElement as HTMLElement
        expect(saveToGitSaveBtn).toBeInTheDocument()
      })
      fireEvent.click(saveToGitSaveBtn!)
      await waitFor(() => expect(templateNg.createTemplatePromise).toHaveBeenCalled())
      expect(templateNg.createTemplatePromise).toHaveBeenCalledWith(createTemplatePromiseArg)

      expect(props.deleteTemplateCache).toBeCalled()
    })

    test('error should be displayed in the progress modal when create API fails', async () => {
      jest
        .spyOn(templateNg, 'createTemplatePromise')
        .mockImplementation(() => Promise.reject({ status: 'ERROR', message: 'There was error' }))

      const props: TemplateContextMetadata = {
        deleteTemplateCache: jest.fn(),
        gitDetails: {
          branch: 'feature',
          filePath: 'test_pipeline.yaml',
          repoIdentifier: 'gitSyncRepo',
          rootFolder: '/rootFolderTest/.harness/'
        }
      }
      const { getByText } = render(
        <GitSyncTestWrapper defaultAppStoreValues={{ isGitSyncEnabled: true }}>
          <Wrapped {...props} />
        </GitSyncTestWrapper>
      )

      const saveBtn = getByText('Save')
      userEvent.click(saveBtn)

      let saveToGitSaveBtn: HTMLElement
      await waitFor(() => {
        const portalDiv = document.getElementsByClassName('bp3-portal')[0] as HTMLElement
        const savePipelinesToGitHeader = getByText('common.git.saveResourceLabel')
        expect(savePipelinesToGitHeader).toBeInTheDocument()

        const nameInput = document.querySelector('input[name="name"]')
        expect(nameInput).toBeDisabled()
        expect(nameInput?.getAttribute('value')).toBe('Test Http Template')

        saveToGitSaveBtn = getElementByText(portalDiv, 'save').parentElement as HTMLElement
        expect(saveToGitSaveBtn).toBeInTheDocument()
      })
      fireEvent.click(saveToGitSaveBtn!)
      await waitFor(() => expect(templateNg.createTemplatePromise).toHaveBeenCalled())
      expect(templateNg.createTemplatePromise).toHaveBeenCalledWith(createTemplatePromiseArg)

      expect(props.deleteTemplateCache).toBeCalledTimes(0)
      await waitFor(() => expect(getByText('There was error')).toBeInTheDocument())
    })
  })
})
