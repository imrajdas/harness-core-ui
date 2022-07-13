/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { getMultiTypeFromValue, MultiTypeInputType, SelectOption } from '@harness/uicore'
import type { FormikValues } from 'formik'
import { get, isEmpty, unset } from 'lodash-es'
import type { GetDataError } from 'restful-react'
import {
  PRIMARY_ARTIFACT,
  TriggerDefaultFieldList,
  TriggerTypes
} from '@triggers/pages/triggers/utils/TriggersWizardPageUtils'
import type { K8SDirectServiceStep } from '@pipeline/factories/ArtifactTriggerInputFactory/types'
import type {
  ArtifactConfig,
  ArtifactoryBuildDetailsDTO,
  DockerBuildDetailsDTO,
  EcrBuildDetailsDTO,
  GcrBuildDetailsDTO,
  NexusBuildDetailsDTO
} from 'services/cd-ng'
import { checkIfQueryParamsisNotEmpty, RegistryHostNames } from '@pipeline/components/ArtifactsSelection/ArtifactUtils'
import type { ArtifactType } from '@pipeline/components/ArtifactsSelection/ArtifactInterface'

export const DefaultParam = 'defaultParam'

export type BuildDetailsDTO =
  | DockerBuildDetailsDTO[]
  | GcrBuildDetailsDTO[]
  | EcrBuildDetailsDTO[]
  | NexusBuildDetailsDTO[]
  | ArtifactoryBuildDetailsDTO[]

export function isNewServiceEnvEntity(path: string): boolean {
  return path?.includes('service.serviceInputs.serviceDefinition')
}

export const resetTags = (formik: FormikValues, tagPath: string): void => {
  const tagValue = get(formik.values, tagPath, '')
  if (getMultiTypeFromValue(tagValue) === MultiTypeInputType.FIXED && tagValue?.length) {
    formik.setFieldValue(tagPath, '')
  }
}

export const shouldFetchTagsSource = (queryParamList: Array<string>): boolean => {
  return checkIfQueryParamsisNotEmpty(queryParamList)
}

export const fromPipelineInputTriggerTab = (formik: FormikValues, fromTrigger = false): boolean => {
  return (
    formik?.values?.triggerType === TriggerTypes.ARTIFACT && !isEmpty(formik?.values?.selectedArtifact) && !fromTrigger
  )
}

export const isSelectedStage = (stageIdentifier: string, formikStageId: string): boolean =>
  stageIdentifier === formikStageId
export const isSelectedArtifact = (selectedArtifact: any, identifier?: string): boolean => {
  if (!isEmpty(identifier)) {
    return !isEmpty(selectedArtifact) && selectedArtifact.identifier === identifier
  }
  return (
    !isEmpty(selectedArtifact) && (!selectedArtifact.identifier || selectedArtifact.identifier === PRIMARY_ARTIFACT)
  )
}
export const isFieldfromTriggerTabDisabled = (
  fieldName: string,
  formik: FormikValues,
  stageIdentifier: string,
  fromTrigger = false,
  identifier?: string
): boolean => {
  if (fromTrigger) {
    // Trigger Configuration Tab
    return get(TriggerDefaultFieldList, fieldName) ? true : false
  } else if (
    fromPipelineInputTriggerTab(formik, fromTrigger) &&
    isSelectedArtifact(formik?.values?.selectedArtifact, identifier) &&
    isSelectedStage(stageIdentifier, formik?.values?.stageId)
  ) {
    return true
  }
  return false
}

export const getTagError = (fetchTagsError: GetDataError<any> | null): string =>
  get(fetchTagsError, 'data.message', null)

export const getPrimaryInitialValues = (
  initialValues: K8SDirectServiceStep,
  formik: FormikValues,
  stageIdentifier: string,
  artifactPath: string
): { type: ArtifactType; spec: ArtifactConfig } | undefined => {
  if (stageIdentifier === formik?.values?.stageId) {
    const initialArtifactValue = get(initialValues, `artifacts.${artifactPath}`)
    const { selectedArtifact } = formik?.values || {}

    if (initialArtifactValue && isEmpty(selectedArtifact.identifier)) {
      /*
         backend requires eventConditions inside selectedArtifact but should not be added to inputYaml
        */
      if (selectedArtifact?.spec.eventConditions) {
        unset(selectedArtifact?.spec, 'eventConditions')
      }

      return {
        type: selectedArtifact?.type,
        spec: {
          ...selectedArtifact?.spec
        }
      }
    }
  }
}
export const getSidecarInitialValues = (
  initialValues: K8SDirectServiceStep,
  formik: FormikValues,
  stageIdentifier: string,
  artifactPath: string
): { identifier: string; type: ArtifactType; spec: ArtifactConfig } | undefined => {
  if (stageIdentifier === formik?.values?.stageId) {
    const initialArtifactValue = get(initialValues, `artifacts.${artifactPath}`)
    const { selectedArtifact } = formik?.values || {}

    if (initialArtifactValue && selectedArtifact.identifier === initialArtifactValue.identifier) {
      /*
         backend requires eventConditions inside selectedArtifact but should not be added to inputYaml
        */
      if (selectedArtifact?.spec.eventConditions) {
        unset(selectedArtifact?.spec, 'eventConditions')
      }

      return {
        identifier: selectedArtifact?.identifier,
        type: selectedArtifact?.type,
        spec: {
          ...selectedArtifact?.spec
        }
      }
    }
  }
}

export const gcrUrlList: SelectOption[] = Object.values(RegistryHostNames).map(item => ({ label: item, value: item }))

export const isArtifactSourceRuntime = (
  isPrimaryArtifactsRuntime: boolean,
  isSidecarRuntime: boolean,
  isSidecar: boolean
): boolean => (!isSidecar && isPrimaryArtifactsRuntime) || (isSidecar && isSidecarRuntime)

export const getImagePath = (initialImagePath: string, formikImagePathValue: string): string => {
  //initialImagePath is empty in case of new service entity, so we return defaultParam string to make tag as enabled
  if (isEmpty(initialImagePath)) {
    return DefaultParam
  }
  return getMultiTypeFromValue(initialImagePath) !== MultiTypeInputType.RUNTIME
    ? initialImagePath
    : formikImagePathValue
}

export const getDefaultQueryParam = (initialImagePath: string, formikImagePathValue: string): string => {
  //initialImagePath is empty in case of new service entity, so we return defaultParam string to make tag as enabled
  if (isEmpty(initialImagePath)) {
    return DefaultParam
  }
  return getMultiTypeFromValue(initialImagePath) !== MultiTypeInputType.RUNTIME
    ? initialImagePath
    : formikImagePathValue
}

export function getFinalQueryParamValue(initialParam: string): string | undefined {
  return initialParam !== DefaultParam ? initialParam : undefined
}

export function getFqnPath(
  path: string,
  isPropagatedStage: boolean,
  stageIdentifier: string,
  artifactPath: string
): string {
  if (isNewServiceEnvEntity(path)) {
    return `pipeline.stages.${stageIdentifier}.spec.service.serviceInputs.serviceDefinition.spec.artifacts.${artifactPath}.spec.tag`
  } else {
    if (isPropagatedStage) {
      return `pipeline.stages.${stageIdentifier}.spec.serviceConfig.stageOverrides.artifacts.${artifactPath}.spec.tag`
    }
    return `pipeline.stages.${stageIdentifier}.spec.serviceConfig.serviceDefinition.spec.artifacts.${artifactPath}.spec.tag`
  }
}
