/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { cloneDeep, isEmpty } from 'lodash-es'
import type { FormikProps } from 'formik'
import { getMultiTypeFromValue, MultiTypeInputType, RUNTIME_INPUT_VALUE } from '@harness/uicore'
import type { StringKeys } from 'framework/strings'
import type { StringsMap } from 'framework/strings/StringsContext'
import type {
  AppDMetricDefinitions,
  AppDynamicsHealthSourceSpec,
  AppdynamicsValidationResponse,
  MetricPackDTO,
  RiskProfile
} from 'services/cv'
import type { SelectOption } from '@pipeline/components/PipelineSteps/Steps/StepsTypes'
import type { UpdatedHealthSource } from '../../HealthSourceDrawer/HealthSourceDrawerContent.types'
import { HealthSourceTypes } from '../../types'
import type {
  AppDynamicsData,
  AppDynamicsFomikFormInterface,
  MapAppDynamicsMetric,
  NonCustomFeildsInterface,
  ValidateMappingInterface
} from './AppDHealthSource.types'
import type { BasePathData } from './Components/BasePath/BasePath.types'
import type { MetricPathData } from './Components/MetricPath/MetricPath.types'
import { AppDynamicsMonitoringSourceFieldNames, initCustomForm } from './AppDHealthSource.constants'
import { PATHTYPE } from './Components/AppDCustomMetricForm/AppDCustomMetricForm.constants'
import type { CustomMappedMetric } from '../../common/CustomMetric/CustomMetric.types'

export const convertStringBasePathToObject = (baseFolder: string | BasePathData): BasePathData => {
  let basePathObj = {} as any
  if (typeof baseFolder === 'string') {
    const list = [...baseFolder.split('|'), '']
    list.forEach((item, index) => {
      basePathObj[`basePathDropdown_${index}`] = {
        path: index === 0 ? '' : list.slice(0, index).join('|'),
        value: item
      }
    })
  } else {
    basePathObj = baseFolder
  }
  return basePathObj
}

export const convertStringMetricPathToObject = (metricPath: string | MetricPathData): MetricPathData => {
  let metricPathObj = {} as any
  if (typeof metricPath === 'string') {
    const list = [...metricPath.split('|'), '']
    let secondLastIndex = 0
    if (list.length > 1) {
      secondLastIndex = list.length - 2
    }
    list.forEach((item, index) => {
      metricPathObj[`metricPathDropdown_${index}`] = {
        value: item,
        path: index === 0 ? '' : list.slice(0, index).join('|'),
        isMetric: secondLastIndex === index ? true : false
      }
    })
  } else {
    metricPathObj = metricPath
  }
  return metricPathObj
}

export const createAppDynamicsData = (sourceData: any): AppDynamicsData => {
  const payload: UpdatedHealthSource = sourceData?.healthSourceList?.find(
    (source: UpdatedHealthSource) => source.identifier === sourceData.healthSourceIdentifier
  )

  const {
    applicationName = '',
    tierName = '',
    metricPacks = undefined
  } = (payload?.spec as AppDynamicsHealthSourceSpec) || {}

  const appdData = {
    name: sourceData?.healthSourceName,
    identifier: sourceData?.healthSourceIdentifier,
    connectorRef: sourceData?.connectorRef,
    isEdit: sourceData?.isEdit,
    product: sourceData?.product,
    type: HealthSourceTypes.AppDynamics,
    applicationName,
    tierName,
    metricPacks,
    mappedServicesAndEnvs: new Map()
  }

  for (const metricDefinition of (payload?.spec as AppDynamicsHealthSourceSpec)?.metricDefinitions || []) {
    if (metricDefinition?.metricName) {
      const basePathObj = convertStringBasePathToObject(metricDefinition?.baseFolder || '')
      const metricPathObj = convertStringMetricPathToObject(metricDefinition?.metricPath || '')

      appdData.mappedServicesAndEnvs.set(metricDefinition.metricName, {
        metricPath: metricPathObj,
        basePath: basePathObj,
        completeMetricPath: metricDefinition.completeMetricPath,
        metricName: metricDefinition.metricName,
        metricIdentifier: metricDefinition.identifier,
        riskCategory:
          metricDefinition?.analysis?.riskProfile?.category && metricDefinition?.analysis?.riskProfile?.metricType
            ? `${metricDefinition?.analysis?.riskProfile?.category}/${metricDefinition?.analysis?.riskProfile?.metricType}`
            : '',
        serviceInstance: metricDefinition?.analysis?.deploymentVerification?.serviceInstanceFieldName,
        lowerBaselineDeviation:
          metricDefinition?.analysis?.riskProfile?.thresholdTypes?.includes('ACT_WHEN_LOWER') || false,
        higherBaselineDeviation:
          metricDefinition?.analysis?.riskProfile?.thresholdTypes?.includes('ACT_WHEN_HIGHER') || false,
        groupName: { label: metricDefinition.groupName || '', value: metricDefinition.groupName || '' },
        continuousVerification: metricDefinition?.analysis?.deploymentVerification?.enabled,
        healthScore: metricDefinition?.analysis?.liveMonitoring?.enabled,
        sli: metricDefinition.sli?.enabled,
        serviceInstanceMetricPath: metricDefinition.analysis?.deploymentVerification?.serviceInstanceMetricPath
      })
    }
  }

  return appdData
}

export const validateMapping = ({
  values,
  createdMetrics,
  selectedMetricIndex,
  getString,
  mappedMetrics
}: ValidateMappingInterface): ((key: string | boolean | string[]) => string) => {
  let errors = {} as any
  const metricValueList = values?.metricData ? Object.values(values?.metricData).filter(val => val) : []

  if (!values.appdApplication) {
    errors[AppDynamicsMonitoringSourceFieldNames.APPDYNAMICS_APPLICATION] = getString(
      'cv.healthSource.connectors.AppDynamics.validation.application'
    )
  }

  if (!values.appDTier) {
    errors[AppDynamicsMonitoringSourceFieldNames.APPDYNAMICS_TIER] = getString(
      'cv.healthSource.connectors.AppDynamics.validation.tier'
    )
  }

  const hasMetricNameAndCustomMetricAdded = !!values.metricName && values?.showCustomMetric

  if (!metricValueList.length && !hasMetricNameAndCustomMetricAdded) {
    errors[AppDynamicsMonitoringSourceFieldNames.METRIC_DATA] = getString(
      'cv.monitoringSources.appD.validations.selectMetricPack'
    )
  }

  if (values?.showCustomMetric) {
    errors = validateCustomMetricFields(
      values,
      createdMetrics,
      selectedMetricIndex,
      errors,
      getString,
      mappedMetrics as Map<string, MapAppDynamicsMetric>
    )
  }

  return errors
}

const validateCustomMetricFields = (
  values: any,
  createdMetrics: string[],
  selectedMetricIndex: number,
  errors: any,
  getString: (key: StringKeys) => string,
  mappedMetrics?: Map<string, MapAppDynamicsMetric>
): ((key: string | boolean | string[]) => string) => {
  let _error = cloneDeep(errors)

  if (values.pathType === PATHTYPE.DropdownPath) {
    _error = validateMetricBasePath(values, _error, getString)
  }

  if (values.pathType === PATHTYPE.FullPath) {
    const isfullPathEmpty = !values.fullPath.length
    const hasCompleteMetricPath = Boolean(values?.completeMetricPath)

    if (hasCompleteMetricPath) {
      const incorrectPairing = values.completeMetricPath.split('|').filter((item: string) => !item.length).length
      if (incorrectPairing) {
        _error[PATHTYPE.FullPath] = getString('cv.healthSource.connectors.AppDynamics.validation.fullPath')
      }
    } else {
      const fullPathContainsTierInfo = values.fullPath
        .split('|')
        .map((item: string) => item.trim())
        .includes(values?.appDTier)
      const incorrectPairing = values.fullPath.split('|').filter((item: string) => !item.length).length

      if (incorrectPairing && isfullPathEmpty) {
        _error[PATHTYPE.FullPath] = getString('cv.healthSource.connectors.AppDynamics.validation.fullPath')
      } else if (!fullPathContainsTierInfo) {
        _error[PATHTYPE.FullPath] = getString('cv.healthSource.connectors.AppDynamics.validation.missingTierInFullPath')
      }
    }
  }

  const isAssignComponentValid = [values.sli, values.continuousVerification, values.healthScore].find(i => i)
  const isRiskCategoryValid = !!values?.riskCategory

  const selectedMetricIndexNew =
    createdMetrics.indexOf(values.metricName) > -1 ? selectedMetricIndex : createdMetrics.indexOf(values.metricName)

  const duplicateNames =
    createdMetrics.length < 2
      ? []
      : createdMetrics?.filter((metricName, index) => {
          if (index === selectedMetricIndexNew) {
            return false
          }
          return metricName === values.metricName
        })

  _error = validateIdentifier(values, createdMetrics, selectedMetricIndexNew, _error, getString, mappedMetrics)

  if (!values.groupName) {
    _error[AppDynamicsMonitoringSourceFieldNames.GROUP_NAME] = getString(
      'cv.monitoringSources.prometheus.validation.groupName'
    )
  }

  if (!values.metricName) {
    _error[AppDynamicsMonitoringSourceFieldNames.METRIC_NAME] = getString('cv.monitoringSources.metricNameValidation')
  }

  if (values.metricName && duplicateNames.length) {
    _error[AppDynamicsMonitoringSourceFieldNames.METRIC_NAME] = getString(
      'cv.monitoringSources.prometheus.validation.metricNameUnique'
    )
  }

  _error = validateAssignComponent(isAssignComponentValid, _error, getString, values, isRiskCategoryValid)
  return _error
}

const validateMetricBasePath = (values: any, errors: any, getString: (key: StringKeys) => string) => {
  const _error = cloneDeep(errors)
  const isBasePathValid = values?.basePath
    ? Object.values(values?.basePath as BasePathData).some(path => path?.value)
    : false

  const isMetricPathValid = values?.metricPath
    ? Object.values(values?.metricPath as MetricPathData).some(path => path?.value)
    : false

  const metricHasLeafNodeSelected = values?.metricPath
    ? Object.values(values?.metricPath as MetricPathData).some(item => item.isMetric)
    : false

  if (!isBasePathValid) {
    _error[AppDynamicsMonitoringSourceFieldNames.BASE_PATH] = getString(
      'cv.healthSource.connectors.AppDynamics.validation.basePath'
    )
  }

  if (!isMetricPathValid) {
    _error[AppDynamicsMonitoringSourceFieldNames.METRIC_PATH] = getString(
      'cv.healthSource.connectors.AppDynamics.validation.metricPath'
    )
  } else {
    if (!metricHasLeafNodeSelected) {
      _error[AppDynamicsMonitoringSourceFieldNames.METRIC_PATH] = getString(
        'cv.healthSource.connectors.AppDynamics.validation.metricPathWithoutLeafNode'
      )
    }
  }
  return _error
}

const validateIdentifier = (
  values: any,
  createdMetrics: string[],
  selectedMetricIndex: number,
  errors: any,
  getString: (key: StringKeys) => string,
  mappedMetrics?: Map<string, MapAppDynamicsMetric>
): ((key: string | boolean | string[]) => string) => {
  const _error = cloneDeep(errors)
  const identifiers = createdMetrics.map(metricName => mappedMetrics?.get(metricName)?.metricIdentifier)

  const duplicateIdentifier =
    identifiers.length < 2
      ? []
      : identifiers?.filter((identifier, index) => {
          if (index === selectedMetricIndex) {
            return false
          }
          return identifier === values.metricIdentifier
        })

  if (values.identifier && duplicateIdentifier.length) {
    _error[AppDynamicsMonitoringSourceFieldNames.METRIC_IDENTIFIER] = getString(
      'cv.monitoringSources.prometheus.validation.metricIdentifierUnique'
    )
  }
  return _error
}

const validateAssignComponent = (
  isAssignComponentValid: boolean,
  errors: any,
  getString: (key: StringKeys) => string,
  values: any,
  isRiskCategoryValid: boolean
): ((key: string | boolean | string[]) => string) => {
  const _error = cloneDeep(errors)
  if (!isAssignComponentValid) {
    _error[AppDynamicsMonitoringSourceFieldNames.SLI] = getString(
      'cv.monitoringSources.gco.mapMetricsToServicesPage.validation.baseline'
    )
  } else if (isAssignComponentValid) {
    if (values.continuousVerification || values.healthScore) {
      if (values.lowerBaselineDeviation !== true && values.higherBaselineDeviation !== true) {
        _error[AppDynamicsMonitoringSourceFieldNames.LOWER_BASELINE_DEVIATION] = getString(
          'cv.monitoringSources.prometheus.validation.deviation'
        )
      }
      if (values.continuousVerification && !values.serviceInstanceMetricPath) {
        _error[AppDynamicsMonitoringSourceFieldNames.CONTINUOUS_VERIFICATION] = getString(
          'cv.healthSource.connectors.AppDynamics.validation.missingServiceInstanceMetricPath'
        )
      }
      if (!isRiskCategoryValid) {
        _error[AppDynamicsMonitoringSourceFieldNames.RISK_CATEGORY] = getString(
          'cv.monitoringSources.gco.mapMetricsToServicesPage.validation.riskCategory'
        )
      }
    }
  }
  return _error
}

export const getBaseAndMetricPath = (
  basePath: BasePathData,
  metricPath: MetricPathData,
  fullPath: string | null,
  appDTier: string
): { derivedBasePath: string; derivedMetricPath: string } => {
  // convert full path to metricPath and basePath
  let derivedBasePath = ''
  let derivedMetricPath = ''
  if (fullPath) {
    const data = convertFullPathToBaseAndMetric(fullPath, appDTier)
    derivedBasePath = data.derivedBasePath
    derivedMetricPath = data.derivedMetricPath
  } else if (basePath && metricPath) {
    derivedBasePath = basePath[Object.keys(basePath)[Object.keys(basePath).length - 1]]?.path
    derivedMetricPath = metricPath[Object.keys(metricPath)[Object.keys(metricPath).length - 1]]?.path
  }

  return { derivedBasePath, derivedMetricPath }
}

export const convertFullPathToBaseAndMetric = (
  fullPath: string,
  appDTier: string
): { derivedBasePath: string; derivedMetricPath: string } => {
  const fullPathArray = fullPath.split('|').map((item: string) => item.trim())
  const indexOfManager = fullPathArray.indexOf(appDTier)
  const derivedBasePath = fullPathArray.slice(0, indexOfManager).join('|')
  const derivedMetricPath = fullPathArray.slice(indexOfManager + 1, fullPathArray.length).join('|')
  return { derivedBasePath, derivedMetricPath }
}

export const createAppDynamicsPayload = (formData: any): UpdatedHealthSource | null => {
  const specPayload = {
    applicationName: (formData?.appdApplication?.label as string) || (formData.appdApplication as string),
    tierName: (formData?.appDTier?.label as string) || (formData.appDTier as string),
    metricData: formData.metricData,
    metricDefinitions: [] as AppDMetricDefinitions[]
  }

  if (formData.showCustomMetric) {
    for (const entry of formData.mappedServicesAndEnvs.entries()) {
      const {
        metricName,
        groupName,
        riskCategory,
        lowerBaselineDeviation,
        higherBaselineDeviation,
        sli,
        continuousVerification,
        healthScore,
        basePath,
        metricPath,
        metricIdentifier,
        serviceInstanceMetricPath,
        fullPath,
        completeMetricPath
      } = entry[1]

      const { derivedBasePath, derivedMetricPath } = getBaseAndMetricPath(
        basePath,
        metricPath,
        fullPath,
        formData.appDTier
      )

      const [category, metricType] = riskCategory?.split('/') || []
      const thresholdTypes: RiskProfile['thresholdTypes'] = []

      if (lowerBaselineDeviation) {
        thresholdTypes.push('ACT_WHEN_LOWER')
      }
      if (higherBaselineDeviation) {
        thresholdTypes.push('ACT_WHEN_HIGHER')
      }

      const ifOnlySliIsSelected = Boolean(sli) && !(Boolean(healthScore) || Boolean(continuousVerification))

      specPayload?.metricDefinitions?.push({
        identifier: metricIdentifier,
        metricName,
        baseFolder: derivedBasePath,
        metricPath: derivedMetricPath,
        completeMetricPath,
        groupName: groupName?.value as string,
        sli: { enabled: Boolean(sli) },
        analysis: {
          riskProfile: ifOnlySliIsSelected
            ? {}
            : {
                category,
                metricType,
                thresholdTypes
              },
          liveMonitoring: { enabled: Boolean(healthScore) },
          deploymentVerification: { enabled: Boolean(continuousVerification), serviceInstanceMetricPath }
        }
      })
    }
  }

  return {
    name: formData.name || (formData.healthSourceName as string),
    identifier: formData.identifier || (formData.healthSourceIdentifier as string),
    type: 'AppDynamics' as any,
    spec: {
      ...specPayload,
      feature: 'Application Monitoring' as string,
      connectorRef: (formData?.connectorRef?.value as string) || (formData.connectorRef as string),
      metricPacks: Object.entries(formData?.metricData)
        .map(item => {
          return item[1]
            ? {
                identifier: item[0]
              }
            : {}
        })
        .filter(item => !isEmpty(item))
    }
  }
}

export const submitData = (
  formik: FormikProps<AppDynamicsFomikFormInterface>,
  mappedMetrics: Map<string, CustomMappedMetric>,
  selectedMetric: string,
  selectedMetricIndex: number,
  createdMetrics: string[],
  getString: (key: StringKeys) => string,
  onSubmit: (healthSourcePayload: any) => void
): void => {
  formik.setTouched({
    ...formik.touched,
    [AppDynamicsMonitoringSourceFieldNames.APPDYNAMICS_TIER]: true,
    [AppDynamicsMonitoringSourceFieldNames.APPDYNAMICS_APPLICATION]: true,
    [AppDynamicsMonitoringSourceFieldNames.SLI]: true,
    [AppDynamicsMonitoringSourceFieldNames.CONTINUOUS_VERIFICATION]: true,
    [AppDynamicsMonitoringSourceFieldNames.GROUP_NAME]: true,
    [AppDynamicsMonitoringSourceFieldNames.METRIC_NAME]: true,
    [AppDynamicsMonitoringSourceFieldNames.LOWER_BASELINE_DEVIATION]: true,
    [AppDynamicsMonitoringSourceFieldNames.RISK_CATEGORY]: true,
    [AppDynamicsMonitoringSourceFieldNames.BASE_PATH]: { basePathDropdown_0: { value: true, path: true } },
    [AppDynamicsMonitoringSourceFieldNames.METRIC_PATH]: { metricPathDropdown_0: { value: true, path: true } },
    [AppDynamicsMonitoringSourceFieldNames.METRIC_DATA]: { Errors: true, Performance: true },
    [PATHTYPE.FullPath]: true
  })
  const errors = validateMapping({ values: formik.values, createdMetrics, selectedMetricIndex, getString })
  if (Object.keys(errors || {})?.length > 0) {
    formik.validateForm()
    return
  }
  const updatedMetric = formik.values
  if (updatedMetric) {
    mappedMetrics.set(selectedMetric, updatedMetric)
  }
  const updatedValues = { ...formik.values, mappedServicesAndEnvs: mappedMetrics }
  onSubmit(updatedValues)
}

export const convertMetricPackToMetricData = (value?: MetricPackDTO[]) => {
  const dataObject: { [key: string]: boolean } = {}
  const metricList: MetricPackDTO[] = value || []
  metricList.forEach((i: MetricPackDTO) => (dataObject[i.identifier as string] = true))
  return dataObject
}

export const createAppDFormData = (
  appDynamicsData: AppDynamicsData,
  mappedMetrics: Map<string, CustomMappedMetric>,
  selectedMetric: string,
  nonCustomFeilds: {
    appdApplication: string
    appDTier: string
    metricPacks?: MetricPackDTO[]
    metricData: {
      [key: string]: boolean
    }
  },
  showCustomMetric: boolean,
  isTemplate = false
): AppDynamicsFomikFormInterface => {
  const mappedMetricsData = mappedMetrics.get(selectedMetric) as MapAppDynamicsMetric
  const metricIdentifier = mappedMetricsData?.metricIdentifier || selectedMetric?.split(' ').join('_')
  const { basePath = {}, metricPath = {}, completeMetricPath = '' } = mappedMetricsData || {}
  const lastItemBasePath = Object.keys(basePath)[Object.keys(basePath).length - 1]
  const lastItemMetricPath = Object.keys(metricPath)[Object.keys(metricPath).length - 1]
  const fullPath =
    basePath[lastItemBasePath]?.path && metricPath[lastItemMetricPath]?.path && appDynamicsData.tierName
      ? `${basePath[lastItemBasePath]?.path}|${appDynamicsData.tierName}|${metricPath[lastItemMetricPath]?.path}`
      : ''

  return {
    name: appDynamicsData.name,
    identifier: appDynamicsData.identifier,
    connectorRef: appDynamicsData.connectorRef,
    isEdit: appDynamicsData.isEdit,
    product: appDynamicsData.product,
    type: appDynamicsData.type,
    pathType: isTemplate || completeMetricPath ? PATHTYPE.FullPath : PATHTYPE.DropdownPath,
    fullPath,
    completeMetricPath,
    mappedServicesAndEnvs: appDynamicsData.mappedServicesAndEnvs,
    ...(mappedMetrics.get(selectedMetric) as MapAppDynamicsMetric),
    appdApplication: nonCustomFeilds.appdApplication,
    appDTier: nonCustomFeilds.appDTier,
    metricPacks: nonCustomFeilds.metricPacks,
    metricData: nonCustomFeilds.metricData,
    metricName: selectedMetric,
    showCustomMetric,
    metricIdentifier
  }
}

export const initializeNonCustomFields = (appDynamicsData: AppDynamicsData) => {
  return {
    appdApplication: appDynamicsData.applicationName || '',
    appDTier: appDynamicsData.tierName || '',
    metricPacks: appDynamicsData.metricPacks || undefined,
    metricData: convertMetricPackToMetricData(appDynamicsData?.metricPacks)
  }
}

export const setAppDynamicsApplication = (
  appdApplication: string,
  tierOptions: SelectOption[],
  multiType?: MultiTypeInputType
): SelectOption | string | undefined => {
  const value = !appdApplication ? undefined : tierOptions.find((item: SelectOption) => item.label === appdApplication)

  if (multiType === MultiTypeInputType.RUNTIME) {
    return appdApplication
  }
  if (multiType === MultiTypeInputType.EXPRESSION) {
    return appdApplication
  }
  return value
}

export const setAppDynamicsTier = (
  tierLoading: boolean,
  appDTier: string,
  tierOptions: SelectOption[],
  multiType?: MultiTypeInputType
) => {
  const value = tierLoading || !appDTier ? undefined : tierOptions.find((item: SelectOption) => item.label === appDTier)
  if (multiType === MultiTypeInputType.RUNTIME) {
    return appDTier
  }
  if (multiType === MultiTypeInputType.EXPRESSION) {
    return appDTier
  }
  return value
}

export const initAppDCustomFormValue = () => {
  return {
    ...initCustomForm,
    groupName: { label: '', value: '' }
  }
}

export const getPlaceholder = (
  loading: boolean,
  placeholderText: keyof StringsMap,
  getString: (key: StringKeys) => string
): string => (loading ? getString('loading') : getString(placeholderText))

export const showValidation = (appdApplication?: string, appDTier?: string): boolean =>
  Boolean(appDTier) && Boolean(appdApplication) && !(appdApplication === RUNTIME_INPUT_VALUE || appDTier === '<+input>')

export const getTypeOfInput = (value: SelectOption | string) => {
  const selectedItem = typeof value === 'string' ? value : value?.label
  if (getMultiTypeFromValue(selectedItem) === MultiTypeInputType.RUNTIME) {
    return MultiTypeInputType.RUNTIME
  }
  if (/^</.test(selectedItem)) {
    return MultiTypeInputType.EXPRESSION
  }
  return MultiTypeInputType.FIXED
}

export const setCustomFieldAndValidation = (
  value: string,
  setNonCustomFeilds: React.Dispatch<
    React.SetStateAction<{
      appdApplication: string
      appDTier: string
      metricPacks: MetricPackDTO[] | undefined
      metricData: {
        [key: string]: boolean
      }
    }>
  >,
  nonCustomFeilds: NonCustomFeildsInterface,
  setAppDValidation: React.Dispatch<
    React.SetStateAction<{
      status: string
      result: AppdynamicsValidationResponse[] | []
    }>
  >,
  validate = false
): void => {
  const updatedNonCustomValue = {
    ...nonCustomFeilds,
    appdApplication: value,
    appDTier: getTypeOfInput(value) !== MultiTypeInputType.FIXED ? RUNTIME_INPUT_VALUE : ''
  }
  setNonCustomFeilds(updatedNonCustomValue)
  if (validate) {
    setAppDValidation({ status: '', result: [] })
  }
}

export const checkAppAndTierAreNotFixed = (appName: string, tierName: string) =>
  getMultiTypeFromValue(appName) === MultiTypeInputType.RUNTIME ||
  getMultiTypeFromValue(appName) === MultiTypeInputType.EXPRESSION ||
  getMultiTypeFromValue(tierName) === MultiTypeInputType.RUNTIME ||
  getMultiTypeFromValue(tierName) === MultiTypeInputType.EXPRESSION

export const shouldMakeTierCall = (applicationName: string) =>
  applicationName &&
  getMultiTypeFromValue(applicationName) !== MultiTypeInputType.RUNTIME &&
  (getMultiTypeFromValue(applicationName) !== MultiTypeInputType.EXPRESSION || /^<+>/.test(applicationName))

export const getAllowedTypes = (isConnectorRuntimeOrExpression: boolean) =>
  isConnectorRuntimeOrExpression
    ? [MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]
    : [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]

export const setAppAndTierAsInputIfConnectorIsInput = (
  isConnectorRuntimeOrExpression: boolean,
  nonCustomFeilds: NonCustomFeildsInterface,
  setNonCustomFeilds: (data: NonCustomFeildsInterface) => void
) => {
  if (isConnectorRuntimeOrExpression) {
    setNonCustomFeilds({
      ...nonCustomFeilds,
      appDTier: '<+input>',
      appdApplication: '<+input>'
    })
  }
}

export const resetShowCustomMetric = (
  selectedMetric: string,
  mappedMetrics: Map<string, CustomMappedMetric>,
  setShowCustomMetric: (value: React.SetStateAction<boolean>) => void
) => {
  if (!selectedMetric && !mappedMetrics.size) {
    setShowCustomMetric(false)
  }
}
