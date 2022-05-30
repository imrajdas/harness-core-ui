/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { SelectOption } from '@wings-software/uicore'
import type { UseStringsReturn } from 'framework/strings'

export function getSelectPlaceholder({
  loading,
  error,
  options,
  getString,
  isNamespace
}: {
  loading: boolean
  error: boolean
  options: SelectOption[]
  getString: UseStringsReturn['getString']
  isNamespace?: boolean
}): string {
  if (loading) {
    return getString('loading')
  }
  if (error || !options?.length) {
    return ''
  }

  return isNamespace ? getString('cv.selectNamespace') : getString('common.getStarted.selectWorkload')
}

export function getWorkloadNamespaceOptions({
  error,
  loading,
  list
}: {
  error: boolean
  loading: boolean
  list?: string[]
}): SelectOption[] {
  if (error || loading || !list?.length) return []
  return list.map(k8Entity => ({ label: k8Entity, value: k8Entity }))
}
