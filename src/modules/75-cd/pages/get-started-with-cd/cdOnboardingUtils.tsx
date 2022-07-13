import type {
  EnvironmentRequestDTO,
  EnvironmentResponseDTO,
  ServiceDefinition,
  ServiceRequestDTO
} from 'services/cd-ng'

export const DefaultNewStageName = 'Stage Name'
export const DefaultNewStageId = 'stage_id'
export const DefaultNewServiceId = '-1'

const DEFAULT_STAGE_ID = 'Stage'
const DEFAULT_STAGE_TYPE = 'Deployment'

export const newServiceState = {
  service: {
    name: 'sample_service',
    identifier: 'sample_service',
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
    name: 'sample_environment',
    identifier: 'sample_environment',
    description: '',
    tags: {},
    type: 'PreProduction' as 'PreProduction' | 'Production'
  },
  infrastructure: {
    name: 'sample_infrastructure',
    identifier: 'sample_infrastructure',
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

export const DEFAULT_PIPELINE_PAYLOAD = {
  pipeline: {
    name: '',
    identifier: '',
    projectIdentifier: '',
    orgIdentifier: '',
    tags: {},
    stages: [
      {
        stage: {
          name: DEFAULT_STAGE_ID,
          identifier: DEFAULT_STAGE_ID,
          description: '',
          type: DEFAULT_STAGE_TYPE,
          spec: {
            deploymentType: 'Kubernetes',
            service: { serviceRef: 'servicePipeline_123' },
            environment: {
              environmentRef: 'servicePipe_123',
              deployToAll: false,
              infrastructureDefinitions: [{ identifier: 'envPipeline_123' }]
            },
            execution: {
              steps: [
                {
                  step: {
                    type: 'ShellScript',
                    name: 'Echo Welcome Message',
                    identifier: 'shell_ID',
                    spec: {
                      shell: 'Bash',
                      onDelegate: true,
                      source: { type: 'Inline', spec: { script: 'echo "Welcome to Harness CD" ' } },
                      environmentVariables: [],
                      outputVariables: [],
                      executionTarget: {}
                    }
                  }
                }
              ]
            }
          },
          tags: {},
          failureStrategies: [
            {
              onFailure: {
                errors: ['AllErrors'],
                action: {
                  type: 'StageRollback'
                }
              }
            }
          ]
        }
      }
    ]
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

export const getUniqueEntityIdentifier = (entity = ''): string => {
  const UNIQUE_PIPELINE_ID = new Date().getTime().toString()
  return `${entity.replace(/-/g, '_')}_${UNIQUE_PIPELINE_ID}`
}
