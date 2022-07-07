/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  render,
  waitFor,
  fireEvent,
  RenderResult,
  getByText,
  getAllByText as getAllByTextLib,
  act
} from '@testing-library/react'
import { GitSyncTestWrapper } from '@common/utils/gitSyncTestUtils'
import gitSyncListResponse from '@common/utils/__tests__/mocks/gitSyncRepoListMock.json'
import { TestWrapper, findDialogContainer, findPopoverContainer } from '@common/utils/testUtils'
import { defaultAppStoreValues } from '@common/utils/DefaultAppStoreData'
import routes from '@common/RouteDefinitions'
import { projectPathProps, accountPathProps, pipelineModuleParams } from '@common/utils/routeUtils'
import { branchStatusMock, sourceCodeManagers } from '@connectors/mocks/mock'
import CDPipelinesPage from '../PipelinesPage'
import filters from './mocks/filters.json'
import deploymentTypes from './mocks/deploymentTypes.json'
import services from './mocks/services.json'
import environments from './mocks/environments.json'
import pipelines from './mocks/pipelines.json'

const getListOfBranchesWithStatus = jest.fn(() => Promise.resolve(branchStatusMock))
const getListGitSync = jest.fn(() => Promise.resolve(gitSyncListResponse))

jest.mock('@common/components/YAMLBuilder/YamlBuilder')
jest.mock('@common/utils/YamlUtils', () => ({}))

jest.mock('services/cd-ng', () => ({
  useGetOrganizationList: jest.fn().mockReturnValue({ data: null, loading: false }),
  useGetProjectAggregateDTOList: jest.fn().mockReturnValue({ data: null, loading: false }),
  useGetServiceDefinitionTypes: jest
    .fn()
    .mockImplementation(() => ({ loading: false, data: deploymentTypes, refetch: jest.fn() })),
  useGetServiceListForProject: jest
    .fn()
    .mockImplementation(() => ({ loading: false, data: services, refetch: jest.fn() })),
  useGetEnvironmentListForProject: jest
    .fn()
    .mockImplementation(() => ({ loading: false, data: environments, refetch: jest.fn() })),
  getListOfBranchesByGitConfigPromise: jest
    .fn()
    .mockImplementation(() => ({ loading: false, data: [], refetch: jest.fn() })),
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

jest.mock('@common/utils/dateUtils', () => ({
  formatDatetoLocale: (x: number) => x
}))

const params = {
  accountId: 'testAcc',
  orgIdentifier: 'testOrg',
  projectIdentifier: 'test',
  pipelineIdentifier: 'pipeline1',
  module: 'cd'
}
const openRunPipelineModal = jest.fn()
const mockGetCallFunction = jest.fn()
jest.useFakeTimers()

const mockDeleteFunction = jest.fn()
const deletePipeline = (): Promise<{ status: string }> => {
  mockDeleteFunction()
  return Promise.resolve({ status: 'SUCCESS' })
}

jest.mock('services/pipeline-ng', () => ({
  useGetPipelineList: jest.fn().mockImplementation(args => {
    mockGetCallFunction(args)
    return { mutate: jest.fn(() => Promise.resolve(pipelines)), cancel: jest.fn(), loading: false }
  }),
  useSoftDeletePipeline: jest.fn().mockImplementation(() => ({ mutate: deletePipeline, loading: false })),
  useGetFilterList: jest.fn().mockImplementation(() => {
    return { mutate: jest.fn(() => Promise.resolve(filters)), loading: false }
  }),
  usePostFilter: jest.fn(() => ({
    mutate: jest.fn(),
    loading: false,
    cancel: jest.fn()
  })),
  useUpdateFilter: jest.fn(() => ({
    mutate: jest.fn(),
    loading: false,
    cancel: jest.fn()
  })),
  useDeleteFilter: jest.fn(() => ({
    mutate: jest.fn(),
    loading: false,
    cancel: jest.fn()
  })),
  useDeleteInputSetForPipeline: jest.fn(() => ({ mutate: jest.fn() })),
  useGetInputsetYaml: jest.fn(() => ({ data: null, loading: false })),
  useClonePipeline: jest.fn().mockReturnValue({ mutate: jest.fn(), loading: false })
}))

jest.mock('@pipeline/components/RunPipelineModal/useRunPipelineModal', () => ({
  useRunPipelineModal: () => ({
    openRunPipelineModal,
    closeRunPipelineModal: jest.fn()
  })
}))

const TEST_PATH = routes.toPipelines({ ...accountPathProps, ...projectPathProps, ...pipelineModuleParams })

describe('CD Pipeline Page List', () => {
  test('render card view', async () => {
    const { container, getByTestId } = render(
      <TestWrapper path={TEST_PATH} pathParams={params} defaultAppStoreValues={defaultAppStoreValues}>
        <CDPipelinesPage />
      </TestWrapper>
    )
    await waitFor(() => getByTestId(params.pipelineIdentifier))
    expect(container).toMatchSnapshot()
  })

  test('render list view', async () => {
    const { container, getByTestId, getAllByText } = render(
      <TestWrapper path={TEST_PATH} pathParams={params} defaultAppStoreValues={defaultAppStoreValues}>
        <CDPipelinesPage />
      </TestWrapper>
    )
    await waitFor(() => getByTestId(params.pipelineIdentifier))
    fireEvent.click(container.querySelector('[icon="list"')!)
    await waitFor(() => getAllByText('pipeline1'))
    expect(container).toMatchSnapshot()
    fireEvent.click(container.querySelector('[icon="grid-view"')!)
    await waitFor(() => getByTestId(params.pipelineIdentifier))
  })

  test('test run pipeline on card view', async () => {
    openRunPipelineModal.mockReset()
    const { getByTestId, getAllByTestId } = render(
      <TestWrapper path={TEST_PATH} pathParams={params} defaultAppStoreValues={defaultAppStoreValues}>
        <CDPipelinesPage />
      </TestWrapper>
    )
    await waitFor(() => getByTestId(params.pipelineIdentifier))
    await act(async () => {
      fireEvent.click(getAllByTestId('card-run-pipeline')[0]!)
    })
    expect(openRunPipelineModal).toHaveBeenCalled()
  })

  test('test Pipeline click on card view', async () => {
    const { getByTestId } = render(
      <TestWrapper path={TEST_PATH} pathParams={params} defaultAppStoreValues={defaultAppStoreValues}>
        <CDPipelinesPage />
      </TestWrapper>
    )
    await waitFor(() => getByTestId(params.pipelineIdentifier))
    fireEvent.click(getByTestId('pipeline1')!)
    await waitFor(() => getByTestId('location'))
    expect(getByTestId('location').innerHTML.endsWith(routes.toPipelineStudio(params as any))).toBeTruthy()
  })

  test('test Add Pipeline on card view', async () => {
    const { getByTestId, getAllByTestId } = render(
      <TestWrapper path={TEST_PATH} pathParams={params} defaultAppStoreValues={defaultAppStoreValues}>
        <CDPipelinesPage />
      </TestWrapper>
    )
    await waitFor(() => getByTestId(params.pipelineIdentifier))
    fireEvent.click(getAllByTestId('add-pipeline')[0]!)
    await waitFor(() => getByTestId('location'))
    expect(
      getByTestId('location').innerHTML.endsWith(
        routes.toPipelineStudio({ ...params, pipelineIdentifier: '-1' } as any)
      )
    ).toBeTruthy()
  })
  test('Search Pipeline', async () => {
    const { getByTestId, container } = render(
      <TestWrapper path={TEST_PATH} pathParams={params} defaultAppStoreValues={defaultAppStoreValues}>
        <CDPipelinesPage />
      </TestWrapper>
    )
    await waitFor(() => getByTestId(params.pipelineIdentifier))
    mockGetCallFunction.mockReset()
    const searchInput = container?.querySelector('[placeholder="search"]') as HTMLInputElement
    act(() => {
      fireEvent.change(searchInput, { target: { value: 'asd' } })
      jest.runOnlyPendingTimers()
    })

    expect(mockGetCallFunction).toBeCalledWith({
      mock: undefined,
      queryParamStringifyOptions: {
        arrayFormat: 'comma'
      },
      queryParams: {
        accountIdentifier: 'testAcc',
        page: '0',
        orgIdentifier: 'testOrg',
        projectIdentifier: 'test',
        searchTerm: 'asd',
        size: 20,
        sort: ['lastUpdatedAt', 'DESC']
      }
    })
  })
})

describe('Pipeline List View Test cases', () => {
  let listView: HTMLElement
  let getByTestIdTop: RenderResult['getByTestId'] | undefined

  beforeEach(async () => {
    const { getByTestId, container } = render(
      <TestWrapper path={TEST_PATH} pathParams={params} defaultAppStoreValues={defaultAppStoreValues}>
        <CDPipelinesPage />
      </TestWrapper>
    )
    listView = container
    getByTestIdTop = getByTestId
    await waitFor(() => getByTestId(params.pipelineIdentifier))
    fireEvent.click(container.querySelector('[icon="list"')!)
    await waitFor(() => listView.querySelectorAll("[role='row']")[1])
  })

  test('should be able to click on Row', async () => {
    // click on first row
    const row = listView.querySelectorAll("[role='row']")[1]
    fireEvent.click(row)
    await waitFor(() => getByTestIdTop?.('location'))
    expect(getByTestIdTop?.('location').innerHTML.endsWith(routes.toPipelineStudio(params as any))).toBeTruthy()
  })

  test('should be able to open menu and run pipeline', async () => {
    // click on first row
    const menu = listView.querySelector("[data-icon='more']")
    fireEvent.click(menu!)
    const menuContent = findPopoverContainer()
    await waitFor(() => getByText(menuContent as HTMLElement, 'runPipelineText'))
    const runPipelineBtn = getByText(menuContent as HTMLElement, 'runPipelineText')
    openRunPipelineModal.mockReset()
    await act(async () => {
      fireEvent.click(runPipelineBtn)
    })
    expect(openRunPipelineModal).toHaveBeenCalled()
  })

  test('should be able to open menu and open pipeline studio ', async () => {
    // click on first row
    const menu = listView.querySelector("[data-icon='more']")
    fireEvent.click(menu!)
    const menuContent = findPopoverContainer()
    await waitFor(() => getByText(menuContent as HTMLElement, 'launchStudio'))
    const gotoStudioBtn = getByText(menuContent as HTMLElement, 'launchStudio')
    fireEvent.click(gotoStudioBtn)
    await waitFor(() => getByTestIdTop?.('location'))
    expect(
      getByTestIdTop?.('location').innerHTML.endsWith(routes.toPipelineStudio({ ...(params as any) }))
    ).toBeTruthy()
  })

  test('should be able to open menu and delete pipeline ', async () => {
    // click on first row
    const menu = listView.querySelector("[data-icon='more']")
    fireEvent.click(menu!)
    const menuContent = findPopoverContainer()
    await waitFor(() => getByText(menuContent as HTMLElement, 'delete'))
    const deleteBtn = getByText(menuContent as HTMLElement, 'delete')
    fireEvent.click(deleteBtn)
    await waitFor(() => getByText(document.body, 'delete common.pipeline'))
    const form = findDialogContainer()
    const confirmDelete = getByText(form as HTMLElement, 'delete')
    mockDeleteFunction.mockReset()
    fireEvent.click(confirmDelete)
    await waitFor(() => getByText(document.body, 'pipeline-list.pipelineDeleted'))
    expect(mockDeleteFunction).toBeCalled()
  })
})

describe('Pipeline Card View Test Cases', () => {
  let cardView: HTMLElement
  let getByTestIdTop: RenderResult['getByTestId'] | undefined

  beforeEach(async () => {
    const { getByTestId, container } = render(
      <TestWrapper path={TEST_PATH} pathParams={params} defaultAppStoreValues={defaultAppStoreValues}>
        <CDPipelinesPage />
      </TestWrapper>
    )
    cardView = container
    getByTestIdTop = getByTestId
    await waitFor(() => getByTestId(params.pipelineIdentifier))
  })

  test('should be able to click on card', async () => {
    // click on first row
    const cardName = getAllByTextLib(cardView, 'pipeline1')[0]
    fireEvent.click(cardName)
    await waitFor(() => getByTestIdTop?.('location'))
    expect(
      getByTestIdTop?.('location').innerHTML.endsWith(routes.toPipelineStudio({ ...(params as any) }))
    ).toBeTruthy()
  })

  test('should be able to open menu and run pipeline', async () => {
    // click on first row
    const menu = cardView.querySelector("[data-icon='more']")
    fireEvent.click(menu!)
    const menuContent = findPopoverContainer()
    await waitFor(() => getByText(menuContent as HTMLElement, 'runPipelineText'))
    const runPipelineBtn = getByText(menuContent as HTMLElement, 'runPipelineText')
    openRunPipelineModal.mockReset()
    await act(async () => {
      fireEvent.click(runPipelineBtn)
    })
    expect(openRunPipelineModal).toHaveBeenCalled()
  })

  test('should be able to open menu and open pipeline studio ', async () => {
    // click on first row
    const menu = cardView.querySelector("[data-icon='more']")
    fireEvent.click(menu!)
    const menuContent = findPopoverContainer()
    await waitFor(() => getByText(menuContent as HTMLElement, 'launchStudio'))
    const gotoStudioBtn = getByText(menuContent as HTMLElement, 'launchStudio')
    fireEvent.click(gotoStudioBtn)
    await waitFor(() => getByTestIdTop?.('location'))
    expect(
      getByTestIdTop?.('location').innerHTML.endsWith(routes.toPipelineStudio({ ...(params as any) }))
    ).toBeTruthy()
  })

  test('should be able to open menu and delete pipeline ', async () => {
    // click on first row
    const menu = cardView.querySelector("[data-icon='more']")
    fireEvent.click(menu!)
    const menuContent = findPopoverContainer()
    await waitFor(() => getByText(menuContent as HTMLElement, 'delete'))
    const deleteBtn = getByText(menuContent as HTMLElement, 'delete')
    fireEvent.click(deleteBtn)
    await waitFor(() => getByText(document.body, 'delete common.pipeline'))
    const form = findDialogContainer()
    const confirmDelete = getByText(form as HTMLElement, 'delete')
    mockDeleteFunction.mockReset()
    await act(async () => {
      fireEvent.click(confirmDelete)
    })
    expect(mockDeleteFunction).toBeCalled()
  })
})

describe('When Git Sync is enabled', () => {
  test('should render fine', async () => {
    const { getByTestId, container } = render(
      <GitSyncTestWrapper path={TEST_PATH} pathParams={params} defaultAppStoreValues={{ isGitSyncEnabled: true }}>
        <CDPipelinesPage />
      </GitSyncTestWrapper>
    )
    await waitFor(() => getByTestId(params.pipelineIdentifier))
    const repoSelector = container.querySelector('input[name="repo"]') as HTMLInputElement
    expect(repoSelector).toBeInTheDocument()
    expect(repoSelector.value).toEqual('common.gitSync.allRepositories')
    const branchSelector = container.querySelector('input[name="branch"]') as HTMLInputElement
    expect(branchSelector).toBeInTheDocument()
    expect(branchSelector.value).toEqual('master')
  })
})
