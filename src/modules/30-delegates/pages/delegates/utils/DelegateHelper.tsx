/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { SelectOption } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import type { UseStringsReturn } from 'framework/strings'
import { DelegateTypes } from '@delegates/constants'
import { statusLabels, statusTypes } from '../Delegate.constants'

export const GetDelegateTitleTextByType = (type: string): string => {
  const { getString } = useStrings()

  switch (type) {
    case DelegateTypes.KUBERNETES_CLUSTER:
      return getString('kubernetesText')
    default:
      /* istanbul ignore next */
      return ''
  }
}

export const getDelegateStatusSelectOptions = (getString: UseStringsReturn['getString']): SelectOption[] => {
  return statusTypes.map((item: string) => ({
    label: getString(statusLabels[item]),
    value: item
  }))
}
