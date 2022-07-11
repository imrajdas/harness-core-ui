/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { cloneDeep, defaultTo, isEmpty } from 'lodash-es'
import { getMultiTypeFromValue, MultiTypeInputType } from '@harness/uicore'
import type { UseStringsReturn } from 'framework/strings'
import { HealthSourceTypes } from '@cv/pages/health-source/types'
import type { ConnectorInfoDTO } from 'services/cv'
import { getValidationLabelByNameForTemplateInputs } from '../CVMonitoredService/MonitoredServiceInputSetsTemplate.utils'

export const getLabelByName = (name: string, getString: UseStringsReturn['getString']): string => {
  switch (name) {
    case 'applicationName':
      return getString('cv.healthSource.connectors.AppDynamics.applicationLabel')
    case 'tierName':
      return getString('cv.healthSource.connectors.AppDynamics.trierLabel')
    case 'completeMetricPath':
      return getString('cv.healthSource.connectors.AppDynamics.metricPathType.text')
    case 'serviceInstanceMetricPath':
      return getString('cv.healthSource.connectors.AppDynamics.serviceInstance')
    case 'serviceInstanceFieldName':
    case 'serviceInstanceIdentifier':
      return getString('cv.monitoringSources.serviceInstanceIdentifier')
    case 'connectorRef':
      return getString('connectors.selectConnector')
    case 'query':
      return getString('cv.query')
    case 'category':
      return `Category for ${getString('cv.monitoringSources.riskCategoryLabel')}`
    case 'metricType':
      return `Metric type for ${getString('cv.monitoringSources.riskCategoryLabel')}`
    case 'indexes':
      return getString('cv.monitoringSources.datadogLogs.logIndexesLabel')
    default:
      return name
  }
}

export const getNestedByCondition = (
  spec: any,
  list: any[],
  basePath: string,
  isValid: (value?: string) => boolean
): { name: string; path: string }[] => {
  let clonedList = cloneDeep(list)
  Object.entries(defaultTo(spec, {})).forEach(item => {
    if (isValid(item[1] as string)) {
      clonedList.push({ name: item[0], path: `${basePath}.${item[0]}` })
    } else if (typeof item[1] === 'object') {
      if (Array.isArray(item[1])) {
        item[1].forEach((metric, index) => {
          clonedList = getNestedRuntimeInputs(metric, clonedList, `${basePath}.${item[0]}.${index}`)
        })
      } else {
        clonedList = getNestedRuntimeInputs(spec[item[0]], clonedList, `${basePath}.${item[0]}`)
      }
    }
  })
  return clonedList
}

export const getNestedRuntimeInputs = (spec: any, list: any[], basePath: string): { name: string; path: string }[] => {
  return getNestedByCondition(
    spec,
    list,
    basePath,
    value => getMultiTypeFromValue(value as string) === MultiTypeInputType.RUNTIME
  )
}

export const getNestedEmptyFieldsWithPath = (
  spec: any,
  list: any[],
  basePath: string
): { name: string; path: string }[] => {
  return getNestedByCondition(spec, list, basePath, value => isEmpty(value as string))
}

export const healthSourceTypeMapping = (type: ConnectorInfoDTO['type']): ConnectorInfoDTO['type'] => {
  switch (type) {
    case HealthSourceTypes.DatadogLog as ConnectorInfoDTO['type']:
    case HealthSourceTypes.DatadogMetrics as ConnectorInfoDTO['type']:
      return HealthSourceTypes.Datadog
    default:
      return type
  }
}

export const validateInputSet = (value: any, getString: UseStringsReturn['getString']): { [key: string]: string } => {
  const datawithpath = getNestedEmptyFieldsWithPath(value, [], '')
  const errors: { [key: string]: string } = {}
  datawithpath.forEach(item => {
    errors[item.path.slice(1)] = getValidationLabelByNameForTemplateInputs(item.name, getString)
  })
  return errors
}
