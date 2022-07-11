/*
 * Copyright 2020 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { PREFERENCES_TOP_LEVEL_KEY } from 'framework/PreferenceStore/PreferenceStoreContext'
import SecureStorage from '../SecureStorage'

describe('SecureStorage tests', () => {
  beforeAll(() => {
    SecureStorage.registerCleanupException(PREFERENCES_TOP_LEVEL_KEY)
  })

  test('init', () => {
    localStorage.setItem(PREFERENCES_TOP_LEVEL_KEY, 'test')
    SecureStorage.set('sample', 'value')
    expect(SecureStorage.get('sample')).toBe('value')
    SecureStorage.clear()
    expect(SecureStorage.get('sample')).toBeFalsy()
    expect(localStorage.getItem(PREFERENCES_TOP_LEVEL_KEY)).toBe('test')
  })

  test('corner cases', () => {
    SecureStorage.set('sample', undefined)
    expect(SecureStorage.get('sample')).toBeUndefined()

    expect(() => {
      SecureStorage.get('doesntexist')
    }).not.toThrow()
    expect(SecureStorage.get('doesntexist')).toBeUndefined()
  })
})
