import type {
  EnvironmentRequestDTO,
  EnvironmentResponseDTO,
  ServiceDefinition,
  ServiceRequestDTO
} from 'services/cd-ng'

export const DefaultNewStageName = 'Stage Name'
export const DefaultNewStageId = 'stage_id'
export const DefaultNewServiceId = '-1'

export const newServiceState = {
  service: {
    name: 'new_service',
    identifier: 'new_service',
    description: '',
    tags: {},
    serviceDefinition: {
      type: '' as ServiceDefinition['type'],
      spec: {}
    },
    data: {}
  }
}

export const newEnvironmentState = {
  environment: {
    name: 'new_environment',
    identifier: 'new_environment',
    description: '',
    tags: {},
    type: 'PreProduction' as 'PreProduction' | 'Production'
  },
  infrastructure: {
    name: 'test_infra',
    identifier: 'test_infra',
    description: '',
    tags: {},
    type: '', //infraType
    environmentRef: '',
    infrastructureDefinition: {
      spec: {
        connectorRef: '',
        namespace: ''
        // releaseName: releasename-68140
      }
    },
    data: {}
  }
}

export const cleanServiceDataUtil = (values: ServiceRequestDTO): ServiceRequestDTO => {
  const newDescription = values.description?.toString().trim()
  const newId = values.identifier?.toString().trim()
  const newName = values.name?.toString().trim()
  return {
    name: newName,
    identifier: newId,
    orgIdentifier: values.orgIdentifier,
    projectIdentifier: values.projectIdentifier,
    description: newDescription,
    tags: values.tags
  }
}

export const cleanEnvironmentDataUtil = (values: EnvironmentResponseDTO): EnvironmentRequestDTO => {
  const newDescription = values.description?.toString().trim()
  const newId = values.identifier?.toString().trim()
  const newName = values.name?.toString().trim()
  const newType = values.type?.toString().trim()
  return {
    name: newName,
    identifier: newId,
    orgIdentifier: values.orgIdentifier,
    projectIdentifier: values.projectIdentifier,
    description: newDescription,
    tags: values.tags,
    type: newType as 'PreProduction' | 'Production'
  }
}
