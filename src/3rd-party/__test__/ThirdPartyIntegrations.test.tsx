/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, act } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import mockImport from 'framework/utils/mockImport'
import { communityLicenseStoreValues } from '@common/utils/DefaultAppStoreData'
import { ThirdPartyIntegrations } from '../ThirdPartyIntegrations'

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  delete global.window.location
  global.window = Object.create(window)
  global.window.location = {
    ...window.location,
    hostname: 'app.harness.io'
  }
})

describe('<ThirdPartyIntegrations /> tests', () => {
  test('Should integrate HotJar when CD license Edition is COMMUNITY', () => {
    const injectHotJar = jest.fn()
    const identifyHotJarUser = jest.fn()

    mockImport('framework/AppStore/AppStoreContext', {
      useAppStore: jest.fn().mockImplementation(() => ({
        currentUserInfo: {}
      }))
    })
    mockImport('3rd-party/HotJar', {
      injectHotJar,
      identifyHotJarUser
    })

    act(() => {
      render(
        <TestWrapper defaultLicenseStoreValues={communityLicenseStoreValues}>
          <ThirdPartyIntegrations />
        </TestWrapper>
      )
    })

    expect(injectHotJar).toBeCalled()
    expect(identifyHotJarUser).toBeCalled()
  })

  test('Should integrate HotJar under TRIAL account', () => {
    const injectHotJar = jest.fn()
    const identifyHotJarUser = jest.fn()

    mockImport('framework/LicenseStore/LicenseStoreContext', {
      useLicenseStore: jest.fn().mockImplementation(() => ({
        licenseInformation: {}
      }))
    })
    mockImport('framework/AppStore/AppStoreContext', {
      useAppStore: jest.fn().mockImplementation(() => ({
        currentUserInfo: {}
      }))
    })
    mockImport('3rd-party/HotJar', {
      injectHotJar,
      identifyHotJarUser
    })

    window.deploymentType = 'SAAS'

    act(() => {
      render(
        <TestWrapper>
          <ThirdPartyIntegrations />
        </TestWrapper>
      )
    })

    expect(injectHotJar).toBeCalled()
    expect(identifyHotJarUser).toBeCalled()
  })

  test('Should not integrate HotJar under PAID account', () => {
    const injectHotJar = jest.fn()
    const identifyHotJarUser = jest.fn()

    mockImport('framework/LicenseStore/LicenseStoreContext', {
      useLicenseStore: jest.fn().mockImplementation(() => ({
        licenseInformation: {
          CD: {
            licenseType: 'PAID'
          }
        }
      }))
    })
    mockImport('framework/AppStore/AppStoreContext', {
      useAppStore: jest.fn().mockImplementation(() => ({
        currentUserInfo: {}
      }))
    })
    mockImport('3rd-party/HotJar', {
      injectHotJar,
      identifyHotJarUser
    })

    window.deploymentType = 'SAAS'

    act(() => {
      render(
        <TestWrapper>
          <ThirdPartyIntegrations />
        </TestWrapper>
      )
    })

    expect(injectHotJar).not.toBeCalled()
    expect(identifyHotJarUser).not.toBeCalled()
  })
})
