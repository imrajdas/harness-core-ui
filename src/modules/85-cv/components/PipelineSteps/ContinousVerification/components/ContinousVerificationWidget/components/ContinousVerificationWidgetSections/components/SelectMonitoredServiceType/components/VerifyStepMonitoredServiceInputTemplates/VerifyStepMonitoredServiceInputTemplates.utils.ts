/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { HealthSource } from 'services/cv'
import type { ContinousVerificationData } from '@cv/components/PipelineSteps/ContinousVerification/types'

export function getHealthSources(formikValues: ContinousVerificationData): HealthSource[] {
  return formikValues?.spec?.monitoredService?.spec?.templateInputs?.sources?.healthSources || []
}
