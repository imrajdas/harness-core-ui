/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { parse } from 'yaml'
import type { TemplateSummaryResponse } from 'services/template-ng'
import type {
  ContinousVerificationData,
  MonitoredServiceTemplateVariable,
  TemplateInputs,
  VerifyStepMonitoredService
} from '@cv/components/PipelineSteps/ContinousVerification/types'
import type { ResponseString } from 'services/cd-ng'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import { MONITORED_SERVICE_TYPE } from './SelectMonitoredServiceType.constants'

export function getTemplateData(
  spec: VerifyStepMonitoredService['spec'],
  type: string
): TemplateSummaryResponse | null {
  let templateData = null
  if (type === MONITORED_SERVICE_TYPE.TEMPLATE) {
    const monitoredServiceSpec = { ...spec }
    templateData = {
      identifier: monitoredServiceSpec?.monitoredServiceTemplateRef,
      versionLabel: monitoredServiceSpec?.versionLabel,
      yaml: yamlStringify(monitoredServiceSpec?.templateInputs)
    }
  }
  return templateData
}

export function getUpdatedSpecs(
  formValues: ContinousVerificationData,
  templateInputYaml: ResponseString,
  templateData?: TemplateSummaryResponse
): ContinousVerificationData['spec'] {
  let newSpecs = { ...formValues.spec }
  const inputSet = parse(templateInputYaml?.data as string)
  const { versionLabel = '', identifier = '' } = templateData || {}
  const updatedMonitoredService = {
    ...formValues.spec.monitoredService,
    spec: {
      ...formValues.spec.monitoredService.spec,
      monitoredServiceTemplateRef: identifier,
      versionLabel,
      templateInputs: {
        ...inputSet
      }
    }
  }
  newSpecs = {
    ...newSpecs,
    monitoredService: updatedMonitoredService,
    initialMonitoredService: updatedMonitoredService
  }
  return newSpecs
}

export function getInitialHealthSourceVariables(
  formValues: ContinousVerificationData
): MonitoredServiceTemplateVariable[] {
  return formValues?.spec?.monitoredService?.spec?.templateInputs?.variables || []
}

export function getInitialHealthSources(
  formValues: ContinousVerificationData
): TemplateInputs['sources']['healthSources'] {
  return formValues?.spec?.monitoredService?.spec?.templateInputs?.sources?.healthSources || []
}
