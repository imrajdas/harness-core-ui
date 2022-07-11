/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { MultiTypeInputType } from '@harness/uicore'
import type { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import type { SelectOption } from '@pipeline/components/PipelineSteps/Steps/StepsTypes'
import type { StepSpecType } from 'services/cd-ng'
import type { VariableMergeServiceResponse } from 'services/pipeline-ng'

export interface AzureSlotDeploymentStepInfo {
  name: string
  identifier: string
  timeout: string
}

export interface AzureSlotDeploymentData {
  type: string
  name: string
  identifier: string
  timeout: string
  spec?: StepSpecType
}

export interface AzureSlotDeploymentVariableStepProps {
  initialValues: AzureSlotDeploymentData
  originalData?: AzureSlotDeploymentData
  stageIdentifier?: string
  metadataMap: Required<VariableMergeServiceResponse>['metadataMap']
  variablesData?: AzureSlotDeploymentData
  stepType?: string
  onUpdate?(data: AzureSlotDeploymentData): void
}

export interface AzureSlotDeploymentProps<T = AzureSlotDeploymentData> {
  initialValues: T
  onUpdate?: (data: T) => void
  onChange?: (data: T) => void
  allowableTypes: MultiTypeInputType[]
  stepViewType?: StepViewType
  configTypes?: SelectOption[]
  isNewStep?: boolean
  inputSetData?: {
    template?: T
    path?: string
  }
  readonly?: boolean
  path?: string
  stepType?: string
  allValues?: T
}
