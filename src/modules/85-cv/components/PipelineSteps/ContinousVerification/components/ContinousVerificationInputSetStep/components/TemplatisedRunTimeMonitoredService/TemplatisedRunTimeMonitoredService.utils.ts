/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { RUNTIME_INPUT_VALUE } from '@harness/uicore'

export function getRunTimeInputsFromHealthSource(spec: any, path: string): { name: string; path: string }[] {
  return Object.entries(spec)
    .filter(item => item[1] === RUNTIME_INPUT_VALUE)
    .map(item => {
      return { name: item[0], path: `${path}.${item[0]}` }
    })
}
