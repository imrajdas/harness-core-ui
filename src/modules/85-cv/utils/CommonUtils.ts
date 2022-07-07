/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { get } from 'lodash-es'
import { Utils, Views, SelectOption, MultiSelectOption } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import type { UseStringsReturn } from 'framework/strings'
import type { ResponseListEnvironmentResponse, EnvironmentResponse } from 'services/cd-ng'
import type { StringsMap } from 'stringTypes'
import type { MonitoredServiceEnum } from '@cv/pages/monitored-service/MonitoredServicePage.constants'
import type { CVNGLogTag, SloHealthIndicatorDTO } from 'services/cv'
import { formatDatetoLocale } from '@common/utils/dateUtils'

export enum EVENT_TYPE {
  KNOWN = 'KNOWN',
  UNKNOWN = 'UNKNOWN',
  FREQUENCY = 'UNEXPECTED_FREQUENCY',
  BASELINE = 'BASELINE'
}

export enum RiskValues {
  NO_DATA = 'NO_DATA',
  NO_ANALYSIS = 'NO_ANALYSIS',
  HEALTHY = 'HEALTHY',
  OBSERVE = 'OBSERVE',
  NEED_ATTENTION = 'NEED_ATTENTION',
  UNHEALTHY = 'UNHEALTHY'
}

export enum SLOErrorBudget {
  EXHAUSTED = 'EXHAUSTED'
}

// Need to remove once removed from BE.
type OldRiskTypes = 'LOW' | 'MEDIUM' | 'HIGH'
type RiskTypes = keyof typeof RiskValues | OldRiskTypes

export const getRiskColorValue = (
  riskStatus?: RiskTypes | SloHealthIndicatorDTO['errorBudgetRisk'],
  realCSSColor = true,
  dark = true
): string => {
  const COLOR_NO_DATA = dark ? Color.GREY_400 : Color.GREY_100

  switch (riskStatus) {
    case RiskValues.HEALTHY:
      return realCSSColor ? Utils.getRealCSSColor(Color.GREEN_500) : Color.GREEN_500
    case RiskValues.OBSERVE:
      return realCSSColor ? Utils.getRealCSSColor(Color.YELLOW_800) : Color.YELLOW_800
    case RiskValues.NEED_ATTENTION:
      return realCSSColor ? Utils.getRealCSSColor(Color.ORANGE_600) : Color.ORANGE_600
    case RiskValues.UNHEALTHY:
      return realCSSColor ? Utils.getRealCSSColor(Color.RED_600) : Color.RED_600
    case SLOErrorBudget.EXHAUSTED:
      return realCSSColor ? Utils.getRealCSSColor(Color.RED_800) : Color.RED_800
    default:
      return realCSSColor ? Utils.getRealCSSColor(COLOR_NO_DATA) : COLOR_NO_DATA
  }
}

export function getSecondaryRiskColorValue(
  riskStatus?: RiskTypes | SloHealthIndicatorDTO['errorBudgetRisk'],
  realCSSColor = true
): string {
  switch (riskStatus) {
    case RiskValues.HEALTHY:
      return realCSSColor ? Utils.getRealCSSColor(Color.GREEN_50) : Color.GREEN_50
    case RiskValues.OBSERVE:
      return realCSSColor ? Utils.getRealCSSColor(Color.YELLOW_50) : Color.YELLOW_50
    case RiskValues.NEED_ATTENTION:
      return realCSSColor ? Utils.getRealCSSColor(Color.ORANGE_50) : Color.ORANGE_50
    case RiskValues.UNHEALTHY:
      return realCSSColor ? Utils.getRealCSSColor(Color.RED_50) : Color.RED_50
    case SLOErrorBudget.EXHAUSTED:
      return realCSSColor ? Utils.getRealCSSColor(Color.RED_100) : Color.RED_100
    default:
      return realCSSColor ? Utils.getRealCSSColor(Color.GREY_50) : Color.GREY_50
  }
}

export const getRiskLabelStringId = (
  riskStatus?: RiskTypes | SloHealthIndicatorDTO['errorBudgetRisk']
): keyof StringsMap => {
  switch (riskStatus) {
    case RiskValues.NO_DATA:
      return 'noData'
    case RiskValues.NO_ANALYSIS:
      return 'cv.noAnalysis'
    case RiskValues.HEALTHY:
      return 'cv.monitoredServices.serviceHealth.serviceDependencies.states.healthy'
    case RiskValues.OBSERVE:
      return 'cv.monitoredServices.serviceHealth.serviceDependencies.states.observe'
    case RiskValues.NEED_ATTENTION:
      return 'cv.monitoredServices.serviceHealth.serviceDependencies.states.needsAttention'
    case RiskValues.UNHEALTHY:
      return 'cv.monitoredServices.serviceHealth.serviceDependencies.states.unhealthy'
    case SLOErrorBudget.EXHAUSTED:
      return 'cv.monitoredServices.serviceHealth.serviceDependencies.states.exhausted'
    default:
      return 'na'
  }
}

export function roundNumber(value: number, precision = 2) {
  if (Number.isInteger(precision) && precision >= 0) {
    const factor = 10 ** precision
    return Math.round(value * factor) / factor
  }
}

export function getErrorMessage(errorObj?: any): string | undefined {
  if (get(errorObj, 'data')) {
    return (
      get(errorObj, 'data.detailedMessage') ||
      get(errorObj, 'data.message') ||
      JSON.stringify(get(errorObj, 'data'), null, '\t')
    )
  }
  return get(errorObj, 'message')
}

export const getEnvironmentOptions = (
  environmentList: ResponseListEnvironmentResponse | null,
  loading: boolean,
  getString: UseStringsReturn['getString']
): SelectOption[] => {
  if (loading) {
    return [{ label: getString('loading'), value: 'loading' }]
  }
  if (environmentList?.data?.length) {
    const allOption: SelectOption = { label: getString('all'), value: getString('all') }
    const environmentSelectOption: SelectOption[] =
      environmentList?.data?.map((environmentData: EnvironmentResponse) => {
        const { name = '', identifier = '' } = environmentData?.environment || {}
        return {
          label: name,
          value: identifier
        }
      }) || []
    return [allOption, ...environmentSelectOption]
  }
  return []
}

interface GetCVMonitoringServicesSearchParamProps {
  view?: Views
  tab?: MonitoredServiceEnum
  redirectToSLO?: boolean
  sloIdentifier?: string
  monitoredServiceIdentifier?: string
  templateRef?: string
}

export const getCVMonitoringServicesSearchParam = (props: GetCVMonitoringServicesSearchParamProps): string => {
  return (
    '?' +
    Object.entries(props)
      .filter(param => param[1] !== undefined)
      .map(param => `${param[0]}=${param[1]}`)
      .join('&')
  )
}

export function getSearchString(params: { [key: string]: unknown }): string {
  return (
    '?' +
    Object.entries(params)
      .filter(param => param[1] !== undefined)
      .map(param => `${param[0]}=${param[1]}`)
      .join('&')
  )
}

export const prepareFilterInfo = (data?: MultiSelectOption[]): Array<string | number> => {
  return data ? data.map((d: MultiSelectOption) => d.value as string) : []
}

export const isNumeric = (val: string): boolean => {
  return /^-?\d+$/.test(val)
}

export function getEventTypeColor(eventType?: string, realCSSColor = true): string {
  switch (eventType) {
    case EVENT_TYPE.UNKNOWN:
      return realCSSColor ? Utils.getRealCSSColor(Color.RED_800) : Color.RED_800
    case EVENT_TYPE.KNOWN:
      return realCSSColor ? Utils.getRealCSSColor(Color.PRIMARY_7) : Color.PRIMARY_7
    case EVENT_TYPE.FREQUENCY:
    case 'UNEXPECTED':
      return realCSSColor ? Utils.getRealCSSColor(Color.YELLOW_800) : Color.YELLOW_800
    case EVENT_TYPE.BASELINE:
    default:
      return realCSSColor ? Utils.getRealCSSColor(Color.GREY_700) : Color.GREY_700
  }
}

export function getEventTypeLightColor(eventType?: string, realCSSColor = true): string {
  switch (eventType) {
    case EVENT_TYPE.UNKNOWN:
      return realCSSColor ? Utils.getRealCSSColor(Color.RED_50) : Color.RED_50
    case EVENT_TYPE.KNOWN:
      return realCSSColor ? Utils.getRealCSSColor(Color.PRIMARY_2) : Color.PRIMARY_2
    case EVENT_TYPE.FREQUENCY:
    case 'UNEXPECTED':
      return realCSSColor ? Utils.getRealCSSColor(Color.YELLOW_200) : Color.YELLOW_200
    case EVENT_TYPE.BASELINE:
    default:
      return realCSSColor ? Utils.getRealCSSColor(Color.GREY_200) : Color.GREY_200
  }
}

export function getEventTypeChartColor(eventType?: string, realCSSColor = true): string {
  switch (eventType) {
    case EVENT_TYPE.UNKNOWN:
    case 'UNKNOWN_EVENT':
      return realCSSColor ? Utils.getRealCSSColor(Color.RED_400) : Color.RED_400
    case EVENT_TYPE.KNOWN:
    case 'KNOWN_EVENT':
      return realCSSColor ? Utils.getRealCSSColor(Color.PRIMARY_4) : Color.PRIMARY_4
    case EVENT_TYPE.FREQUENCY:
    case 'UNEXPECTED_FREQUENCY':
      return realCSSColor ? Utils.getRealCSSColor(Color.YELLOW_700) : Color.YELLOW_700
    case EVENT_TYPE.BASELINE:
    default:
      return realCSSColor ? Utils.getRealCSSColor(Color.GREY_300) : Color.GREY_300
  }
}

export const getTags = (tags?: CVNGLogTag[]) => {
  const result = {} as any
  const formatDatesFor = ['startTime', 'endTime']
  tags
    ?.filter(tag => tag.type === 'STRING' || tag.type === 'TIMESTAMP')
    .forEach(tag => {
      if (!tag.key) {
        return
      }
      if (formatDatesFor.includes(tag.key)) {
        result[tag.key] = tag.value ? formatDatetoLocale(+tag.value) : ''
      } else {
        result[tag.key] = tag.value
      }
    })

  return JSON.stringify(result)
}

export const getDetailsLabel = (key: string, getString: UseStringsReturn['getString']): string => {
  switch (key) {
    case 'artifactType':
      return getString('pipeline.artifactsSelection.artifactType')
    case 'artifactTag':
      return getString('connectors.cdng.artifactTag')
    case 'executedBy':
      return getString('cv.monitoredServices.executedBy')
    case 'eventType':
      return getString('pipeline.verification.logs.eventType')
    default:
      return key
  }
}
