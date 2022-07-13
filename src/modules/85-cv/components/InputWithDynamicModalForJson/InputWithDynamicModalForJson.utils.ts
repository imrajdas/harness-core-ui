/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { max } from 'lodash-es'
import { isNumeric } from '@cv/utils/CommonUtils'
import type { UseStringsReturn } from 'framework/strings'
import type { NoRecordForm } from './InputWithDynamicModalForJson.types'

export const MAX_ARRAY_LENGTH = 10000

export function validate(value: NoRecordForm, getString: UseStringsReturn['getString']): { [key: string]: string } {
  const errors: { [key: string]: string } = {}

  if (!value?.name?.trim().length) {
    errors.name = getString('cv.onboarding.selectProductScreen.validationText.name')
  }
  return errors
}

export const formatJSONPath = (selectedValue: string): string => {
  let formattedJSONPath = ''
  const selectedValuePathElements = selectedValue.split('.')

  // replacing the array index in the path with [*]
  if (isNumeric(selectedValuePathElements[selectedValuePathElements.length - 1])) {
    formattedJSONPath = getJSONPathIfLastElementIsNum(selectedValuePathElements)
  } else {
    formattedJSONPath = replaceAllNum(selectedValue)
  }

  return `$.${formattedJSONPath}`
}

export const getJSONPathIfLastElementIsNum = (selectedValuePathElements: string[]): string => {
  const pathElementsExceptLastNumElement = selectedValuePathElements.slice(0, selectedValuePathElements.length - 1)
  const lastNumElement = selectedValuePathElements[selectedValuePathElements.length - 1]

  let path = pathElementsExceptLastNumElement.join('.')
  path = replaceAllNum(path)

  return `${path}.[${lastNumElement}]`
}

export const replaceAllNum = (path: string): string => {
  const maxNumericValueInPath = Number(max(path.split('.').filter(item => isNumeric(item)))) || MAX_ARRAY_LENGTH
  const matchNumber = new RegExp(`\\d{1,${maxNumericValueInPath}}`, 'g')
  return path.replace(matchNumber, '[*]')
}
