/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { MultiTypeInputType } from '@harness/uicore'
import type { FormikProps } from 'formik'
import type { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import type { ServiceConfig, ServiceDefinition, ServiceRequestDTO, ServiceResponseDTO } from 'services/cd-ng'
import type { ServiceDeploymentType } from '@pipeline/utils/stageHelpers'

export interface DeployServiceCustomStepPropType {
  stageIdentifier: string
  isNewServiceEntity: boolean
  deploymentType: ServiceDefinition['type']
  gitOpsEnabled?: boolean
}
export interface DeployServiceProps {
  initialValues: DeployServiceData
  onUpdate?: (data: DeployServiceData) => void
  stepViewType?: StepViewType
  readonly: boolean
  inputSetData?: {
    template?: DeployServiceData
    path?: string
    readonly?: boolean
  }
  allowableTypes: MultiTypeInputType[]
  serviceLabel?: string
  customStepProps?: DeployServiceCustomStepPropType
}

export interface DeployServiceState {
  isEdit: boolean
  data?: ServiceResponseDTO
  isService: boolean
  formik?: FormikProps<DeployServiceData>
}

export interface DeployServiceData extends Omit<ServiceConfig, 'serviceRef'> {
  serviceRef?: string
  isNewServiceEntity?: boolean
  deploymentType?: ServiceDeploymentType
  gitOpsEnabled?: boolean
}

export interface NewEditServiceModalProps {
  isEdit: boolean
  isService: boolean
  data: ServiceResponseDTO
  serviceIdentifier?: string
  onCreateOrUpdate(data: ServiceRequestDTO): void
  closeModal?: () => void
}
