import type { ServiceDefinition, ServiceRequestDTO } from 'services/cd-ng'

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
    }
  }
}

export const cleanData = (values: ServiceRequestDTO): ServiceRequestDTO => {
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
