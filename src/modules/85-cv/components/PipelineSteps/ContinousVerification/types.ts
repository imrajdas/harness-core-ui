/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { SelectOption } from '@wings-software/uicore'
import type { AllFailureStrategyConfig } from '@pipeline/components/PipelineSteps/AdvancedSteps/FailureStrategyPanel/utils'
import type { StepElementConfig } from 'services/cd-ng'
import type { VariableResponseMapValue } from 'services/pipeline-ng'
import type { MONITORED_SERVICE_TYPE } from './components/ContinousVerificationWidget/components/ContinousVerificationWidgetSections/components/SelectMonitoredServiceType/SelectMonitoredServiceType.constants'

export interface ContinousVerificationVariableStepProps {
  metadataMap: Record<string, VariableResponseMapValue>
  stageIdentifier: string
  variablesData: ContinousVerificationData
  originalData: ContinousVerificationData
}

export interface spec {
  sensitivity?: SelectOption | string
  duration?: SelectOption | string
  trafficsplit?: SelectOption | string | number
  baseline?: SelectOption | string
  deploymentTag?: string
  [x: string]: any
}

export interface MonitoredServiceTemplateVariable {
  name: string
  type: string
  value: string
}

export interface TemplateInputs {
  identifier: string
  type: string
  serviceRef: string
  environmentRef: string
  sources: {
    healthSources: any
  }
  variables: MonitoredServiceTemplateVariable[]
}
export interface VerifyStepMonitoredService {
  type: MONITORED_SERVICE_TYPE | string
  spec: {
    monitoredServiceRef?: string | SelectOption
    monitoredServiceTemplateRef?: string
    versionLabel?: string
    templateInputs?: TemplateInputs
  }
}

export interface ContinousVerificationData extends StepElementConfig {
  failureStrategies: AllFailureStrategyConfig[]
  spec: {
    monitoredServiceRef?: string
    monitoredServiceName?: string
    type?: string
    healthSources?: {
      identifier: string
    }[]
    spec?: spec
    monitoredService: VerifyStepMonitoredService
    initialMonitoredService?: VerifyStepMonitoredService
  }
}
