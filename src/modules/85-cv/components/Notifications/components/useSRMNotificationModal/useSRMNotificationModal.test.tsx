/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { conditions, updatedConditions } from './useSRMNotificationModal.mock'
import { getNotificationConditions } from './useSRMNotificationModal.utils'

describe('Unit tests for useSRMNotificatonModal utils', () => {
  test('test getNotificationConditions method to see if correct non null conditions are returned', () => {
    expect(getNotificationConditions(conditions)).toEqual(updatedConditions)
  })
})
