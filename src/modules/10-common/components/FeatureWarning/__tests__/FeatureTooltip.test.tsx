/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import routes from '@common/RouteDefinitions'
import { Editions, SubscriptionTabNames } from '@common/constants/SubscriptionTypes'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import { useFeatureModule, useFeatureRequiredPlans } from '@common/hooks/useFeatures'
import type { CheckFeatureReturn } from 'framework/featureStore/featureStoreUtil'
import { LICENSE_STATE_VALUES } from 'framework/LicenseStore/licenseStoreUtil'
import FeatureTooltip from '../FeatureTooltip'

jest.mock('@common/hooks/useFeatures')
const useFeatureModuleMock = useFeatureModule as jest.MockedFunction<any>
useFeatureModuleMock.mockImplementation(() => {
  return 'CI'
})

const useFeatureRequiredPlansMock = useFeatureRequiredPlans as jest.MockedFunction<any>
useFeatureRequiredPlansMock.mockImplementation(() => {
  return []
})

const features = new Map<FeatureIdentifier, CheckFeatureReturn>()
features.set(FeatureIdentifier.BUILDS, {
  enabled: false,
  featureDetail: {
    featureName: FeatureIdentifier.BUILDS,
    enabled: false,
    moduleType: 'CD',
    limit: 100,
    count: 200
  }
})
features.set(FeatureIdentifier.DEPLOYMENTS, {
  enabled: false,
  featureDetail: {
    featureName: FeatureIdentifier.DEPLOYMENTS,
    enabled: false,
    moduleType: 'CI',
    limit: 100,
    count: 200
  }
})

const warningMesasge = <p>this is warning message</p>

const defaultLicenseStoreValues = {
  licenseInformation: {
    CD: {
      edition: Editions.FREE
    },
    CI: {
      edition: Editions.TEAM
    }
  },
  CI_LICENSE_STATE: LICENSE_STATE_VALUES.ACTIVE,
  CD_LICENSE_STATE: LICENSE_STATE_VALUES.ACTIVE,
  FF_LICENSE_STATE: LICENSE_STATE_VALUES.NOT_STARTED,
  CCM_LICENSE_STATE: LICENSE_STATE_VALUES.NOT_STARTED
}

describe('FeatureTooltip', () => {
  test('FeatureTooltip with warning message', () => {
    const { container, getByText } = render(
      <TestWrapper>
        <FeatureTooltip features={features} warningMessage={warningMesasge} />
      </TestWrapper>
    )
    expect(getByText('this is warning message')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  test('FeatureTooltip without warning message', () => {
    const { container, queryByText, getByText } = render(
      <TestWrapper>
        <FeatureTooltip features={features} />
      </TestWrapper>
    )
    expect(queryByText('this is warning message')).not.toBeInTheDocument()
    expect(getByText('common.purpose.cd.continuous')).toBeInTheDocument()
    expect(getByText('common.purpose.ci.continuous')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  test('FeatureTooltip with free plan', () => {
    const feature = new Map<FeatureIdentifier, CheckFeatureReturn>()
    feature.set(FeatureIdentifier.BUILDS, {
      enabled: false,
      featureDetail: {
        featureName: FeatureIdentifier.BUILDS,
        enabled: false,
        moduleType: 'CD',
        limit: 100,
        count: 200
      }
    })
    const { container, getByText } = render(
      <TestWrapper defaultLicenseStoreValues={defaultLicenseStoreValues}>
        <FeatureTooltip features={feature} />
      </TestWrapper>
    )
    expect(getByText('common.explorePlans')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  test('FeatureTooltip with no plan', () => {
    const feature = new Map<FeatureIdentifier, CheckFeatureReturn>()
    feature.set(FeatureIdentifier.BUILDS, {
      enabled: false,
      featureDetail: {
        featureName: FeatureIdentifier.BUILDS,
        enabled: false,
        moduleType: 'CORE',
        limit: 100,
        count: 200
      }
    })
    const { container, getByText } = render(
      <TestWrapper defaultLicenseStoreValues={{}}>
        <FeatureTooltip features={feature} />
      </TestWrapper>
    )
    expect(getByText('common.explorePlans')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  test('Explore plans on click goes to plan page', async () => {
    const feature = new Map<FeatureIdentifier, CheckFeatureReturn>()
    feature.set(FeatureIdentifier.BUILDS, {
      enabled: false,
      featureDetail: {
        featureName: FeatureIdentifier.BUILDS,
        enabled: false,
        moduleType: 'CD',
        limit: 100,
        count: 200
      }
    })
    const { getByText, getByTestId } = render(
      <TestWrapper
        defaultLicenseStoreValues={defaultLicenseStoreValues}
        pathParams={{ accountId: 'testAcc', orgIdentifier: 'testOrg' }}
      >
        <FeatureTooltip features={feature} />
      </TestWrapper>
    )
    expect(getByText('common.explorePlans')).toBeInTheDocument()
    fireEvent.click(getByText('common.explorePlans'))
    getByTestId('location').innerHTML.endsWith(
      routes.toSubscriptions({ accountId: 'testAcc', moduleCard: 'cd', tab: SubscriptionTabNames.PLANS })
    )
  })

  test('Manage subscription on click goes to subscription page', async () => {
    const feature = new Map<FeatureIdentifier, CheckFeatureReturn>()
    feature.set(FeatureIdentifier.BUILDS, {
      enabled: false,
      featureDetail: {
        featureName: FeatureIdentifier.BUILDS,
        enabled: false,
        moduleType: 'CI',
        limit: 100,
        count: 200
      }
    })
    const { getByText, getByTestId } = render(
      <TestWrapper
        defaultLicenseStoreValues={defaultLicenseStoreValues}
        pathParams={{ accountId: 'testAcc', orgIdentifier: 'testOrg' }}
      >
        <FeatureTooltip features={feature} />
      </TestWrapper>
    )
    expect(getByText('common.manageSubscription')).toBeInTheDocument()
    fireEvent.click(getByText('common.manageSubscription'))
    getByTestId('location').innerHTML.endsWith(
      routes.toSubscriptions({ accountId: 'testAcc', moduleCard: 'ci', tab: SubscriptionTabNames.OVERVIEW })
    )
  })
})
