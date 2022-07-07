/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { StringsMap } from 'stringTypes'

export const statusTypes = ['ENABLED', 'WAITING_FOR_APPROVAL', 'DISABLED', 'DELETED', 'CONNECTED', 'DISCONNECTED']

export const statusLabels: Record<string, keyof StringsMap> = {
  ENABLED: 'enabledLabel',
  WAITING_FOR_APPROVAL: 'delegates.delGroupStatus.WAITING_FOR_APPROVAL',
  DISABLED: 'delegates.delGroupStatus.DISABLED',
  DELETED: 'deleted',
  CONNECTED: 'connected',
  DISCONNECTED: 'delegate.notConnected'
}
