/* eslint-disable jest/no-disabled-tests */
/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, getByText, render, RenderResult, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@common/utils/testUtils'
import mockEnvironments from '@cf/pages/environments/__tests__/mockEnvironments'
import mockImport from 'framework/utils/mockImport'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import { TargetsPage } from '../TargetsPage'

describe('TargetsPage', () => {
  beforeEach(() => jest.resetAllMocks())

  const renderComponent = (): RenderResult => {
    return render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/feature-flags"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <TargetsPage />
      </TestWrapper>
    )
  }

  test('TargetsPage should render loading correctly 1', async () => {
    mockImport('services/cf', {
      useGetAllTargets: () => ({ loading: true, refetch: jest.fn() })
    })

    mockImport('@cf/hooks/useEnvironmentSelectV2', {
      useEnvironmentSelectV2: () => ({
        data: undefined,
        loading: true,
        error: undefined,
        refetch: jest.fn(),
        EnvironmentSelect: function EnvironmentSelect() {
          return <div />
        }
      })
    })

    const { container } = renderComponent()
    expect(container.querySelector('[data-icon="steps-spinner"]')).toBeDefined()
  })

  test('TargetsPage should render loading correctly 2', async () => {
    mockImport('services/cf', {
      useGetAllTargets: () => ({ loading: false, data: { segments: [] }, refetch: jest.fn() })
    })

    mockImport('@cf/hooks/useEnvironmentSelectV2', {
      useEnvironmentSelectV2: () => ({
        data: undefined,
        loading: true,
        error: undefined,
        refetch: jest.fn(),
        EnvironmentSelect: function EnvironmentSelect() {
          return <div />
        }
      })
    })

    const { container } = renderComponent()

    expect(container.querySelector('[data-icon="steps-spinner"]')).toBeDefined()
  })

  test('TargetsPage should render loading correctly 3', async () => {
    mockImport('services/cf', {
      useGetAllTargets: () => ({ loading: true, refetch: jest.fn() })
    })

    mockImport('@cf/hooks/useEnvironmentSelectV2', {
      useEnvironmentSelectV2: () => ({
        environments: [],
        loading: false,
        error: undefined,
        refetch: jest.fn(),
        EnvironmentSelect: function EnvironmentSelect() {
          return <div />
        }
      })
    })

    const { container } = renderComponent()

    expect(container.querySelector('[data-icon="steps-spinner"]')).toBeDefined()
  })

  test('TargetsPage should render error correctly 1', async () => {
    const error = { message: 'SOME ERROR OCCURS' }
    mockImport('services/cf', {
      useGetAllTargets: () => ({ error, loading: false, refetch: jest.fn() })
    })

    mockImport('@cf/hooks/useEnvironmentSelectV2', {
      useEnvironmentSelectV2: () => ({
        environments: [{}],
        loading: false,
        error: undefined,
        refetch: jest.fn(),
        EnvironmentSelect: function EnvironmentSelect() {
          return <div />
        }
      })
    })

    renderComponent()

    expect(getByText(document.body, error.message)).toBeDefined()
  })

  test('TargetsPage should render error correctly 2', async () => {
    const error = { message: 'SOME ERROR OCCURS' }
    mockImport('services/cf', {
      useGetAllTargets: () => ({ data: [], loading: false, refetch: jest.fn() })
    })

    mockImport('@cf/hooks/useEnvironmentSelectV2', {
      useEnvironmentSelectV2: () => ({
        environments: undefined,
        loading: false,
        error,
        refetch: jest.fn(),
        EnvironmentSelect: function EnvironmentSelect() {
          return <div />
        }
      })
    })

    renderComponent()

    expect(getByText(document.body, error.message)).toBeDefined()
  })

  test('Targets Page should render environment empty state when there are no environments', () => {
    mockImport('@cf/hooks/useEnvironmentSelectV2', {
      useEnvironmentSelectV2: () => ({
        environments: [],
        loading: false,
        error: undefined,
        refetch: jest.fn(),
        EnvironmentSelect: function EnvironmentSelect() {
          return <div />
        }
      })
    })

    renderComponent()

    expect(screen.getByTestId('nodata-image')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'plus newEnvironment' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'cf.noEnvironment.title' })).toBeInTheDocument()
  })

  test('Targets Page should render Target empty state when there are environments but no targets', () => {
    const noTargets = {
      itemCount: 0,
      pageCount: 0,
      pageIndex: 0,
      pageSize: 15,
      targets: []
    }

    mockImport('services/cf', {
      useGetAllTargets: () => ({ data: noTargets, loading: false, refetch: jest.fn() })
    })

    mockImport('@cf/hooks/useEnvironmentSelectV2', {
      useEnvironmentSelectV2: () => ({
        environments: mockEnvironments,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
        EnvironmentSelect: function EnvironmentSelect() {
          return <div />
        }
      })
    })

    renderComponent()

    expect(screen.getByTestId('nodata-image')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'plus cf.targets.create' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'cf.targets.noTargetForEnv' })).toBeInTheDocument()
  })

  test('TargetsPage should render data correctly', async () => {
    mockImport('services/cf', {
      useGetAllTargets: () => ({
        data: [
          {
            itemCount: 1,
            pageCount: 1,
            pageIndex: 0,
            pageSize: 15,
            targets: [
              {
                account: '',
                anonymous: false,
                attributes: {},
                createdAt: 1615914009436,
                environment: 'QA',
                identifier: 'harness',
                name: 'harness test',
                org: '',
                project: 'FeatureFlagsQADemo',
                segments: []
              }
            ]
          }
        ],
        loading: false,
        refetch: jest.fn()
      })
    })

    mockImport('@cf/hooks/useEnvironmentSelectV2', {
      useEnvironmentSelectV2: () => ({
        environments: mockEnvironments,
        loading: false,
        refetch: jest.fn(),
        EnvironmentSelect: function EnvironmentSelect() {
          return <div />
        }
      })
    })

    const { container } = renderComponent()

    expect(container).toMatchSnapshot()
  })

  test('TargetsPage should render a Target table', async () => {
    renderComponent()
    expect(document.querySelector('.TableV2--body')).toBeVisible()
  })

  test('TargetsPage should render one Target per row in Targets table', async () => {
    mockImport('services/cf', {
      useGetAllTargets: () => ({
        data: {
          itemCount: 2,
          pageCount: 1,
          pageIndex: 0,
          pageSize: 15,
          targets: [
            {
              account: '',
              anonymous: false,
              attributes: {},
              createdAt: 1642758642863,
              environment: 'mytestenv',
              identifier: 'identifier-1',
              name: 'test-target-1',
              org: '',
              project: 'harness-test',
              segments: []
            },
            {
              account: '',
              anonymous: false,
              attributes: {},
              createdAt: 1642527864060,
              environment: 'mytestenv',
              identifier: 'identifer-1',
              name: 'test-target',
              org: '',
              project: 'harness-test',
              segments: []
            }
          ]
        },
        loading: false,
        refetch: jest.fn()
      })
    })

    mockImport('@cf/hooks/useEnvironmentSelectV2', {
      useEnvironmentSelectV2: () => ({
        environments: mockEnvironments,
        loading: false,
        refetch: jest.fn(),
        EnvironmentSelect: function EnvironmentSelect() {
          return <div />
        }
      })
    })

    renderComponent()

    const rowOfTargetClass = 'TableV2--row TableV2--card TableV2--clickable'
    const targetsRow = document.getElementsByClassName(rowOfTargetClass)
    expect(targetsRow).toHaveLength(2)
  })

  test.skip('TargetsPage should render Edit/Delete popup buttons when Options button is clicked', async () => {
    mockImport('@cf/hooks/useEnvironmentSelectV2', {
      useEnvironmentSelectV2: () => ({
        data: undefined,
        loading: true,
        error: undefined,
        refetch: jest.fn(),
        EnvironmentSelect: function EnvironmentSelect() {
          return <div />
        }
      })
    })

    mockImport('services/cf', {
      useGetAllTargets: () => ({
        data: {
          itemCount: 2,
          pageCount: 1,
          pageIndex: 0,
          pageSize: 15,
          targets: [
            {
              account: '',
              anonymous: false,
              attributes: {},
              createdAt: 1642758642863,
              environment: 'mytestenv',
              identifier: 'identifier-1',
              name: 'test-target-1',
              org: '',
              project: 'harness-test',
              segments: []
            },
            {
              account: '',
              anonymous: false,
              attributes: {},
              createdAt: 1642527864060,
              environment: 'mytestenv',
              identifier: 'identifer-1',
              name: 'test-target',
              org: '',
              project: 'harness-test',
              segments: []
            }
          ]
        },
        loading: false,
        refetch: jest.fn()
      })
    })

    renderComponent()

    const optionsButton = document.querySelector('[data-icon="Options"]') as Element

    userEvent.click(optionsButton)

    expect(document.querySelector('[data-icon="trash"]')).toBeInTheDocument()
    expect(document.querySelector('[data-icon="edit"]')).toBeInTheDocument()
  })

  test.skip('Target Page should disable Options button when users have reached their MAU limit and show plan enforcement tooltip', async () => {
    mockImport('@cf/hooks/useEnvironmentSelectV2', {
      useEnvironmentSelectV2: () => ({
        data: undefined,
        loading: true,
        error: undefined,
        refetch: jest.fn(),
        EnvironmentSelect: function EnvironmentSelect() {
          return <div />
        }
      })
    })

    mockImport('services/cf', {
      useGetAllTargets: () => ({
        data: {
          itemCount: 2,
          pageCount: 1,
          pageIndex: 0,
          pageSize: 15,
          targets: [
            {
              account: '',
              anonymous: false,
              attributes: {},
              createdAt: 1642758642863,
              environment: 'mytestenv',
              identifier: 'identifier-1',
              name: 'test-target-1',
              org: '',
              project: 'harness-test',
              segments: []
            },
            {
              account: '',
              anonymous: false,
              attributes: {},
              createdAt: 1642527864060,
              environment: 'mytestenv',
              identifier: 'identifer-1',
              name: 'test-target',
              org: '',
              project: 'harness-test',
              segments: []
            }
          ]
        },
        loading: false,
        refetch: jest.fn()
      })
    })

    mockImport('@cf/hooks/usePlanEnforcement', {
      usePlanEnforcement: () => ({ isPlanEnforcementEnabled: true, isFreePlan: true })
    })

    mockImport('@common/hooks/useFeatures', {
      useGetFirstDisabledFeature: () => ({ featureEnabled: false, disabledFeatureName: FeatureIdentifier.MAUS })
    })

    renderComponent()

    const optionsButton = document.querySelector('[data-icon="Options"]') as Element
    userEvent.click(optionsButton)

    fireEvent.mouseOver(document.querySelector('[data-icon="edit"]') as HTMLButtonElement)
    fireEvent.mouseOver(document.querySelector('[data-icon="trash"]') as HTMLButtonElement)

    expect(document.querySelector('[data-icon="trash"]')?.closest('a')).toHaveClass('bp3-disabled')
    expect(document.querySelector('[data-icon="edit"]')?.closest('a')).toHaveClass('bp3-disabled')

    await waitFor(() => expect(screen.getByText('cf.planEnforcement.upgradeRequiredMau')).toBeInTheDocument())
  })
})
