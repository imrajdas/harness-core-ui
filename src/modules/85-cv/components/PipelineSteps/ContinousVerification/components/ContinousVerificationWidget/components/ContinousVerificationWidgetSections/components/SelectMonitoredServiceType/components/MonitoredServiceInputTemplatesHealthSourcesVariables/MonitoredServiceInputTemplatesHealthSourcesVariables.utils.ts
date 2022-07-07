/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type {
  ContinousVerificationData,
  MonitoredServiceTemplateVariable
} from '@cv/components/PipelineSteps/ContinousVerification/types'

export function getHealthSourcesVariables(formikValues: ContinousVerificationData): MonitoredServiceTemplateVariable[] {
  return formikValues?.spec?.monitoredService?.spec?.templateInputs?.variables || []
}
