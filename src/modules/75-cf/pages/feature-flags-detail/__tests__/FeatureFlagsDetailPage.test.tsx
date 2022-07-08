/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { getAllByText, getByText, render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import mockImport from 'framework/utils/mockImport'
import { FFGitSyncProvider } from '@cf/contexts/ff-git-sync-context/FFGitSyncContext'
import FeatureFlagsDetailPage from '../FeatureFlagsDetailPage'
import mockEnvironments from '../../environments/__tests__/mockEnvironments'
import mockFeatureFlag from './mockFeatureFlag'

jest.mock('@cf/hooks/useGitSync', () => ({
  useGitSync: jest.fn(() => ({
    getGitSyncFormMeta: jest.fn().mockReturnValue({
      gitSyncInitialValues: {},
      gitSyncValidationSchema: {}
    }),
    isAutoCommitEnabled: false,
    isGitSyncEnabled: true,
    isGitSyncActionsEnabled: true,
    handleAutoCommit: jest.fn()
  }))
}))

describe('FeatureFlagsDetailPage', () => {
  test('FeatureFlagsDetailPage should render loading correctly', async () => {
    mockImport('services/cd-ng', {
      useGetEnvironmentListForProject: () => ({ loading: true, refetch: jest.fn() })
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

    mockImport('services/cf', {
      useGetFeatureFlag: () => ({
        data: undefined,
        loading: true,
        error: undefined,
        refetch: jest.fn()
      })
    })

    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/onboarding/detail"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <FeatureFlagsDetailPage />
      </TestWrapper>
    )

    expect(container.querySelector('[data-icon="steps-spinner"]')).toBeDefined()
    expect(getAllByText(container, /Loading, please wait\.\.\./)).toBeDefined()
  })

  test('FeatureFlagsDetailPage should render error correctly 1', async () => {
    const error = { message: 'SOME ERROR OCCURS' }
    mockImport('services/cd-ng', {
      useGetEnvironmentListForProject: () => ({ loading: true, refetch: jest.fn() })
    })

    mockImport('@cf/hooks/useEnvironmentSelectV2', {
      useEnvironmentSelectV2: () => ({
        data: undefined,
        loading: undefined,
        error,
        refetch: jest.fn(),
        EnvironmentSelect: function EnvironmentSelect() {
          return <div />
        }
      })
    })

    mockImport('services/cf', {
      useGetFeatureFlag: () => ({
        data: mockFeatureFlag,
        loading: undefined,
        error: undefined,
        refetch: jest.fn()
      })
    })

    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/onboarding/detail"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <FeatureFlagsDetailPage />
      </TestWrapper>
    )

    expect(getAllByText(container, error.message)).toBeDefined()
  })

  test('FeatureFlagsDetailPage should render error correctly 2', async () => {
    const error = { message: 'SOME ERROR OCCURS' }
    mockImport('services/cd-ng', {
      useGetEnvironmentListForProject: () => ({ loading: true, refetch: jest.fn() })
    })

    mockImport('@cf/hooks/useEnvironmentSelectV2', {
      useEnvironmentSelectV2: () => ({
        data: mockEnvironments.data.content,
        loading: undefined,
        error: undefined,
        refetch: jest.fn(),
        EnvironmentSelect: function EnvironmentSelect() {
          return <div />
        }
      })
    })

    mockImport('services/cf', {
      useGetFeatureFlag: () => ({
        data: undefined,
        loading: undefined,
        error,
        refetch: jest.fn()
      })
    })

    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/onboarding/detail"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <FeatureFlagsDetailPage />
      </TestWrapper>
    )

    expect(getAllByText(container, error.message)).toBeDefined()
  })

  test('FeatureFlagsDetailPage should render no environment', async () => {
    mockImport('services/cd-ng', {
      useGetEnvironmentListForProject: () => ({ loading: true, refetch: jest.fn() })
    })

    mockImport('@cf/hooks/useEnvironmentSelectV2', {
      useEnvironmentSelectV2: () => ({
        environments: [],
        loading: undefined,
        error: undefined,
        refetch: jest.fn(),
        EnvironmentSelect: function EnvironmentSelect() {
          return <div />
        }
      })
    })

    mockImport('services/cf', {
      useGetFeatureFlag: () => ({
        data: mockFeatureFlag,
        loading: undefined,
        error: undefined,
        refetch: jest.fn()
      })
    })

    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/onboarding/detail"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <FeatureFlagsDetailPage />
      </TestWrapper>
    )

    expect(getByText(container, 'cf.noEnvironment.title')).toBeDefined()
    expect(getByText(container, 'cf.noEnvironment.message')).toBeDefined()
    expect(getByText(container, 'newEnvironment')).toBeDefined()
  })

  test('FeatureFlagsDetailPage should render data correctly', async () => {
    mockImport('services/cd-ng', {
      useGetEnvironmentListForProject: () => ({ loading: true, refetch: jest.fn() })
    })

    mockImport('@cf/hooks/useEnvironmentSelectV2', {
      useEnvironmentSelectV2: () => ({
        data: mockEnvironments.data.content,
        loading: undefined,
        error: undefined,
        refetch: jest.fn(),
        EnvironmentSelect: function EnvironmentSelect() {
          return <div />
        }
      })
    })

    mockImport('services/cf', {
      useGetFeatureFlag: () => ({
        data: mockFeatureFlag,
        loading: undefined,
        error: undefined,
        refetch: jest.fn()
      })
    })

    mockImport('@cf/components/FlagActivation/FlagActivation', {
      // FlagActivation is exported as `default`
      default: function FlagActivation() {
        return <div>FlagActivation</div>
      }
    })

    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/onboarding/detail"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <FFGitSyncProvider>
          <FeatureFlagsDetailPage />
        </FFGitSyncProvider>
      </TestWrapper>
    )

    expect(getAllByText(container, 'FlagActivation')).toBeDefined()
    expect(container).toMatchSnapshot()
  })
})
