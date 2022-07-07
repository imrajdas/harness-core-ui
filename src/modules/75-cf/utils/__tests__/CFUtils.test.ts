/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { cloneDeep, omit, set } from 'lodash-es'
import type { Feature } from 'services/cf'
import * as CFUtils from '../CFUtils'
import { rewriteCurrentLocationWithActiveEnvironment } from '../CFUtils'

describe('CFUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('CFUtils utilities', async () => {
    expect(CFUtils.formatTime(1619411395654)).toEqual('4:29 AM')
    expect(CFUtils.formatDate(1619411395654)).toEqual('Apr 26, 2021')
    expect(CFUtils.isFeatureFlagOn({ envProperties: { state: 'on' } } as Feature)).toEqual(true)
    expect(CFUtils.isFeatureFlagOn({ envProperties: { state: 'off' } } as Feature)).toEqual(false)
    expect(
      CFUtils.featureFlagHasCustomRules({ envProperties: { rules: [{ ruleId: '1', priority: 1 }] } } as Feature)
    ).toEqual(true)
    expect(
      CFUtils.featureFlagHasCustomRules({ envProperties: { variationMap: [{ variation: 'true' }] } } as Feature)
    ).toEqual(true)
    expect(CFUtils.featureFlagHasCustomRules({ envProperties: { rules: [] } } as unknown as Feature)).toEqual(false)
    expect(CFUtils.featureFlagHasCustomRules({ envProperties: {} } as Feature)).toEqual(false)
    expect(CFUtils.featureFlagHasCustomRules({ envProperties: { variationMap: [] } } as unknown as Feature)).toEqual(
      false
    )
    expect(CFUtils.formatNumber(1)).toEqual('1')
    expect(CFUtils.formatNumber(1.25, true)).toEqual('1.25')
    expect(CFUtils.formatNumber(1234)).toEqual('1.23K')
    expect(CFUtils.formatNumber(1234567)).toEqual('1.23M')
    expect(CFUtils.formatNumber(1234567890)).toEqual('1.23B')
  })

  describe('formatToCompactNumber', () => {
    test('it should format numbers correctly', async () => {
      expect(CFUtils.formatToCompactNumber(10)).toEqual('10')
      expect(CFUtils.formatToCompactNumber(100)).toEqual('100')
      expect(CFUtils.formatToCompactNumber(1000)).toEqual('1K')
      expect(CFUtils.formatToCompactNumber(10000)).toEqual('10K')
      expect(CFUtils.formatToCompactNumber(100000)).toEqual('100K')
      expect(CFUtils.formatToCompactNumber(1000000)).toEqual('1M')
      expect(CFUtils.formatToCompactNumber(10000000)).toEqual('10M')
      expect(CFUtils.formatToCompactNumber(100000000)).toEqual('100M')
    })
  })

  describe('getDefaultVariation', () => {
    const mockFlag = {
      variations: [
        { identifier: 'OFF_VARIATION', name: 'Off Variation', value: 'offVariation' },
        { identifier: 'ON_VARIATION', name: 'On Variation', value: 'onVariation' },
        { identifier: 'ENV_VARIATION', name: 'Env Variation', value: 'envVariation' }
      ],
      defaultOffVariation: 'OFF_VARIATION',
      defaultOnVariation: 'ON_VARIATION',
      envProperties: {
        state: 'on',
        defaultServe: {
          variation: 'ENV_VARIATION'
        }
      }
    } as Feature

    test('it should return the default off variation when the flag is off', async () => {
      const flag = cloneDeep(mockFlag)
      set(flag, 'envProperties.state', 'off')

      expect(CFUtils.getDefaultVariation(flag)).toEqual(flag.variations[0])
    })

    test('it should return the env default serve variation when the flag is on', async () => {
      const flag = cloneDeep(mockFlag)

      expect(CFUtils.getDefaultVariation(flag)).toEqual(flag.variations[2])
    })

    test('it should return the default on variation when the flag is on and there is no default serve variation', async () => {
      const flag = omit(mockFlag, 'envProperties.defaultServe.variation')

      expect(CFUtils.getDefaultVariation(flag)).toEqual(flag.variations[1])
    })

    test('it should return the default on variation when the flag is on and there is no default serve', async () => {
      const flag = omit(mockFlag, 'envProperties.defaultServe')

      expect(CFUtils.getDefaultVariation(flag)).toEqual(flag.variations[1])
    })
  })

  describe('rewriteCurrentLocationWithActiveEnvironment', () => {
    const realLocation = global.location
    const replaceMock = jest.fn()

    beforeAll(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete global.location
      global.location = { ...realLocation, replace: replaceMock }
    })

    afterAll(() => {
      global.location = realLocation
    })

    test('it should not change the URL when env is the same as the active env', async () => {
      const env = 'test'
      location.href = `https://test.com?activeEnvironment=${env}`

      rewriteCurrentLocationWithActiveEnvironment(env)

      expect(replaceMock).not.toHaveBeenCalled()
    })

    test('it should try to change the URL when env is different than the active env', async () => {
      const env = 'test'
      location.href = 'https://test.com?activeEnvironment=someotherenv'

      rewriteCurrentLocationWithActiveEnvironment(env)

      expect(replaceMock).toHaveBeenCalledWith(expect.stringContaining(`activeEnvironment=${env}`))
    })

    test('it should try to remove activeEnvironment from the URL if env is not passed', async () => {
      location.href = 'https://test.com?activeEnvironment=someotherenv'

      rewriteCurrentLocationWithActiveEnvironment()

      expect(replaceMock).toHaveBeenCalledWith(expect.not.stringContaining('activeEnvironment'))
    })

    test('it should try to remove activeEnvironment from the URL if env is empty', async () => {
      location.href = 'https://test.com?activeEnvironment=someotherenv'

      rewriteCurrentLocationWithActiveEnvironment('')

      expect(replaceMock).toHaveBeenCalledWith(expect.not.stringContaining('activeEnvironment'))
    })
  })
})
