/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { LICENSE_STATE_VALUES } from 'framework/LicenseStore/licenseStoreUtil'
import { useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import { Editions } from '@common/constants/SubscriptionTypes'
import useLandingPageDefaultView, { View } from '../useLandingPageDefaultView'

jest.mock('framework/LicenseStore/LicenseStoreContext')
const useLicenseStoreMock = useLicenseStore as jest.MockedFunction<any>

describe('test landing page default view hook', () => {
  test('if cd license does not exists', () => {
    useLicenseStoreMock.mockImplementation(() => {
      return {
        CD_LICENSE_STATE: LICENSE_STATE_VALUES.EXPIRED,
        licenseInformation: {},
        versionMap: {},
        CI_LICENSE_STATE: LICENSE_STATE_VALUES.ACTIVE,
        FF_LICENSE_STATE: LICENSE_STATE_VALUES.ACTIVE,
        CCM_LICENSE_STATE: LICENSE_STATE_VALUES.ACTIVE,
        updateLicenseStore: () => void 0
      }
    })
    const view = useLandingPageDefaultView()
    expect(view).toEqual(View.Welcome)
  })

  test('if cd license exists', () => {
    useLicenseStoreMock.mockImplementation(() => {
      return {
        CD_LICENSE_STATE: LICENSE_STATE_VALUES.ACTIVE,
        licenseInformation: {},
        versionMap: {},
        CI_LICENSE_STATE: LICENSE_STATE_VALUES.ACTIVE,
        FF_LICENSE_STATE: LICENSE_STATE_VALUES.ACTIVE,
        CCM_LICENSE_STATE: LICENSE_STATE_VALUES.ACTIVE,
        updateLicenseStore: () => void 0
      }
    })
    const view = useLandingPageDefaultView()
    expect(view).toEqual(View.Dashboard)
  })

  test('if rendered in community', () => {
    useLicenseStoreMock.mockImplementation(() => {
      return {
        licenseInformation: {
          CD: {
            edition: Editions.COMMUNITY
          }
        },
        CD_LICENSE_STATE: LICENSE_STATE_VALUES.ACTIVE
      }
    })
    const view = useLandingPageDefaultView()
    expect(view).toEqual(View.Welcome)
  })

  test('if rendered in on prem', () => {
    window.deploymentType = 'ON_PREM'
    const view = useLandingPageDefaultView()
    expect(view).toEqual(View.Welcome)
  })
})
