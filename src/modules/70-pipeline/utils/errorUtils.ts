/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { isObject, memoize, reduce } from 'lodash-es'

const getErrorsFlatten = memoize((errors: any): string[] => {
  return reduce(
    errors,
    (result: string[], value: any) => {
      if (typeof value === 'string') {
        result.push(value)
      } else if (isObject(value)) {
        return result.concat(getErrorsFlatten(value as any))
      }

      return result
    },
    []
  )
})

export const getErrorsList = memoize((errors: any): { errorStrings: string[]; errorCount: number } => {
  const errorList = getErrorsFlatten(errors)
  const errorCountMap: { [key: string]: number } = {}
  errorList.forEach(error => {
    if (errorCountMap[error]) {
      errorCountMap[error]++
    } else {
      errorCountMap[error] = 1
    }
  })
  const mapEntries = Object.entries(errorCountMap)
  const errorStrings = mapEntries.map(([key, count]) => `${key}  (${count})`)
  let errorCount = 0
  mapEntries.forEach(([_unused, count]) => {
    errorCount += count
  })
  return { errorStrings, errorCount }
})
