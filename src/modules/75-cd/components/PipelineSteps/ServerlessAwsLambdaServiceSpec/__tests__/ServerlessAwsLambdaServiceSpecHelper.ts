/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { IconName, RUNTIME_INPUT_VALUE } from '@wings-software/uicore'
import type { PipelineContextInterface } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { AbstractStepFactory } from '@pipeline/components/AbstractSteps/AbstractStepFactory'
import { ServiceDeploymentType } from '@pipeline/utils/stageHelpers'
import type { Module, PipelinePathProps } from '@common/interfaces/RouteInterfaces'
import type { ServiceSpec } from 'services/cd-ng'

class StepFactory extends AbstractStepFactory {
  protected type = 'test-factory'
  protected stepName = 'stepOne'
  protected stepIcon: IconName = 'cross'
}
const stepFactory = new StepFactory()

const stagesMap = {
  Deployment: {
    name: 'Deploy',
    type: 'Deployment',
    icon: 'pipeline-deploy',
    iconColor: 'var(--pipeline-deploy-stage-color)',
    isApproval: false,
    openExecutionStrategy: true
  },
  ci: {
    name: 'Deploy',
    type: 'ci',
    icon: 'pipeline-build',
    iconColor: 'var(--pipeline-build-stage-color)',
    isApproval: false,
    openExecutionStrategy: false
  },
  Pipeline: {
    name: 'Deploy',
    type: 'Pipeline',
    icon: 'pipeline',
    iconColor: 'var(--pipeline-blue-color)',
    isApproval: false,
    openExecutionStrategy: false
  },
  Custom: {
    name: 'Deploy',
    type: 'Custom',
    icon: 'pipeline-custom',
    iconColor: 'var(--pipeline-custom-stage-color)',
    isApproval: false,
    openExecutionStrategy: false
  },
  Approval: {
    name: 'Deploy',
    type: 'Approval',
    icon: 'approval-stage-icon',
    iconColor: 'var(--pipeline-approval-stage-color)',
    isApproval: true,
    openExecutionStrategy: false
  }
}

export const getPipelineContextMockData = (
  isLoading = false,
  gitDetails?: any,
  isReadonly = false,
  isUpdated = false
) => ({
  state: {
    pipeline: {
      name: 'Pipeline 1',
      identifier: 'pipeline_1',
      description: null,
      tags: null,
      stages: [
        {
          stage: {
            name: 'Stage 1',
            identifier: 'stage_1',
            description: '',
            type: 'Deploy',
            spec: {
              serviceConfig: {
                serviceDefinition: {
                  type: ServiceDeploymentType.ServerlessAwsLambda,
                  spec: {}
                }
              }
            }
          }
        }
      ]
    },
    originalPipeline: {
      name: 'Pipeline 1',
      identifier: 'pipeline_1',
      description: null,
      tags: null,
      stages: [
        {
          stage: {
            name: 'Stage 1',
            identifier: 'stage_1',
            description: '',
            type: 'Deploy',
            spec: {}
          }
        }
      ]
    },
    pipelineIdentifier: 'pipeline_1',
    pipelineView: {
      isSplitViewOpen: true,
      isDrawerOpened: false,
      splitViewData: { type: 'StageView' },
      drawerData: { type: 'AddCommand' }
    },
    selectionState: { selectedStageId: 'stage_1' },
    isLoading,
    isBEPipelineUpdated: false,
    isDBInitialized: true,
    isUpdated,
    isInitialized: true,
    error: '',
    gitDetails,
    entityValidityDetails: { valid: true }
  },
  isReadonly,
  stepsFactory: stepFactory,
  stagesMap
})

export const getDummyPipelineCanvasContextValue = (params: any): PipelineContextInterface => {
  const { isLoading, gitDetails, isReadonly, isUpdated } = params
  const data = getPipelineContextMockData(isLoading, gitDetails, isReadonly, isUpdated)
  return {
    ...data,
    updatePipeline: jest.fn(),
    updatePipelineView: jest.fn(),
    updateStage: jest.fn().mockResolvedValue({}),
    setSelectedTabId: jest.fn(),
    getStagePathFromPipeline: jest.fn(),
    renderPipelineStage: jest.fn(),
    setSelectedStageId: jest.fn(),
    fetchPipeline: jest.fn(),
    setView: jest.fn(),
    setSchemaErrorView: jest.fn(),
    deletePipelineCache: jest.fn(),
    setSelectedSectionId: jest.fn(),
    getStageFromPipeline: jest.fn(() => {
      return { stage: data.state.pipeline.stages[0], parent: undefined }
    })
  } as any
}

export const getInvalidYaml = (): string => `pipeline:
    stages:
      - stage:
          spec:
              serviceConfig:
              serviceRef: Service_1
                  serviceDefinition:
                      type: ServerlessAwsLambda
                      spec:
                        `

export const getYaml = (): string => `pipeline:
    stages:
        - stage:
              spec:
                  serviceConfig:
                      serviceRef: Service_1
                      serviceDefinition:
                          type: ServerlessAwsLambda
                          spec:
                              artifacts:
                                  primary:
                                      spec:
                                          connectorRef: <+input>
                                          artifactDirectory: /
                                          artifactPath: todolist
                                          repository: lambda
                                          repositoryFormat: generic
                                      type: ArtifactoryRegistry
                              manifests:
                                  - manifest:
                                        identifier: test_manifest
                                        type: ServerlessAwsLambda
                                        spec:
                                            store:
                                                type: Git
                                                spec:
                                                    connectorRef: Git_Sync_Chetan_Git_Conn
                                                    gitFetchType: Branch
                                                    paths:
                                                        - test1
                                                    branch: main`

export const getParams = (): PipelinePathProps & { module: Module } => ({
  accountId: 'accountId',
  module: 'cd',
  orgIdentifier: 'default',
  pipelineIdentifier: '-1',
  projectIdentifier: 'projectIdentifier'
})

export const getTemplateWithArtifactPath = (): ServiceSpec => ({
  artifacts: {
    primary: {
      type: 'ArtifactoryRegistry',
      spec: {
        connectorRef: 'testConnectorRef',
        artifactDirectory: 'testDirectory',
        artifactPath: RUNTIME_INPUT_VALUE,
        repository: 'repo1'
      }
    }
  }
})

export const getTemplateWithArtifactPathFilter = (): ServiceSpec => ({
  artifacts: {
    primary: {
      type: 'ArtifactoryRegistry',
      spec: {
        connectorRef: 'testConnectorRef',
        artifactDirectory: 'testDirectory',
        artifactPathFilter: RUNTIME_INPUT_VALUE,
        repository: 'repo1'
      }
    }
  }
})

export const getTemplateWithManifestFields = (): ServiceSpec => ({
  manifests: [
    {
      manifest: {
        identifier: 'test_manifest',
        type: 'ServerlessAwsLambda',
        spec: {
          store: {
            spec: {
              connectorRef: RUNTIME_INPUT_VALUE,
              folderPath: RUNTIME_INPUT_VALUE,
              branch: RUNTIME_INPUT_VALUE,
              paths: RUNTIME_INPUT_VALUE
            }
          }
        }
      }
    }
  ]
})

export const initialValues = {
  artifacts: {
    primary: {
      type: 'ArtifactoryRegistry',
      spec: {
        connectorRef: 'connector',
        artifactDirectory: '/',
        artifactPath: 'hello-world.zip',
        repository: 'lambda'
      }
    }
  },
  manifests: [
    {
      manifest: {
        identifier: 'test_manifest',
        type: 'ServerlessAwsLambda',
        spec: {
          store: {
            spec: {
              connectorRef: '',
              folderPath: '',
              branch: '',
              paths: ''
            }
          }
        }
      }
    }
  ]
}

export const serverlessPipelineContext = {
  state: {
    pipeline: {
      name: 'Pipeline 1',
      identifier: 'pipeline1',
      description: '',
      stages: [
        {
          stage: {
            name: 'Stage 1',
            identifier: 'stage1',
            description: '',
            type: 'Deployment',
            spec: {
              serviceConfig: {
                service: { identifier: 'svc', name: 'svc', description: '' },
                serviceDefinition: {
                  type: 'ServerlessAwsLambda',
                  spec: {
                    artifacts: getTemplateWithArtifactPath(),
                    manifests: [
                      {
                        manifest: {
                          identifier: 'gitId',
                          type: 'K8sManifest',
                          spec: {
                            store: {
                              type: 'Git',
                              spec: {
                                connectorRef: 'account.dronegit',
                                gitFetchType: 'Branch',
                                branch: 'testBranch',
                                commitId: '',
                                paths: ['specs']
                              }
                            }
                          }
                        }
                      }
                    ],
                    artifactOverrideSets: [],
                    manifestOverrideSets: []
                  }
                }
              },
              infrastructure: {
                environment: { name: 'infra', identifier: 'infra', description: '', type: 'PreProduction' },
                infrastructureDefinition: {
                  type: 'KubernetesDirect',
                  spec: { connectorRef: 'account.adsds', namespace: '<+input>', releaseName: '<+input>' }
                }
              },
              execution: {
                steps: [
                  {
                    step: {
                      name: 'Rollout Deployment',
                      identifier: 'rolloutDeployment',
                      type: 'K8sRollingDeploy',
                      spec: { timeout: '<+input>', skipDryRun: false }
                    }
                  }
                ]
              }
            }
          }
        }
      ]
    },
    originalPipeline: {
      name: 'P1',
      identifier: 'P1',
      description: '',
      stages: [
        {
          stage: {
            name: 'Servic1',
            identifier: 'Servic1',
            description: '',
            type: 'Deployment',
            spec: {
              serviceConfig: {
                service: {
                  identifier: '',
                  name: '',
                  description: ''
                },
                serviceDefinition: {
                  type: 'Kubernetes',
                  spec: {
                    artifacts: {
                      sidecars: [
                        {
                          sidecar: {
                            type: 'Dockerhub',
                            identifier: 'sidecar1',
                            spec: { connectorRef: 'account.harnessimage', imagePath: '<+input>' }
                          }
                        }
                      ],
                      primary: {
                        type: 'Dockerhub',
                        spec: { connectorRef: 'account.dockerAleks', imagePath: '<+input>' }
                      }
                    },
                    manifests: [
                      {
                        manifest: {
                          identifier: 'gitId',
                          type: 'K8sManifest',
                          spec: {
                            store: {
                              type: 'Git',
                              spec: {
                                connectorRef: 'account.dronegit',
                                gitFetchType: 'Branch',
                                branch: '<+input>',
                                commitId: '',
                                paths: ['specs']
                              }
                            }
                          }
                        }
                      }
                    ],
                    artifactOverrideSets: [],
                    manifestOverrideSets: []
                  }
                }
              },
              infrastructure: {
                environment: { name: 'infra', identifier: 'infra', description: '', type: 'PreProduction' },
                infrastructureDefinition: {
                  type: 'KubernetesDirect',
                  spec: { connectorRef: 'account.adsds', namespace: '<+input>', releaseName: '<+input>' }
                }
              },
              execution: {
                steps: [
                  {
                    step: {
                      name: 'Rollout Deployment',
                      identifier: 'rolloutDeployment',
                      type: 'K8sRollingDeploy',
                      spec: { timeout: '<+input>', skipDryRun: false }
                    }
                  }
                ]
              }
            }
          }
        }
      ]
    },
    pipelineIdentifier: 'P1',
    pipelineView: {
      isSplitViewOpen: true,
      isDrawerOpened: false,
      splitViewData: { type: 'StageView' },
      drawerData: { type: 'AddCommand' }
    },
    selectionState: { selectedStageId: 'Servic1' },
    isLoading: false,
    isBEPipelineUpdated: false,
    isDBInitialized: true,
    isUpdated: true,
    isInitialized: true,
    error: ''
  },
  stepsFactory: { invocationMap: {}, stepBank: {}, stepIconMap: {}, type: 'pipeline-factory' },
  stagesMap: {
    Deployment: {
      name: 'Deploy',
      type: 'Deployment',
      icon: 'pipeline-deploy',
      iconColor: 'var(--pipeline-deploy-stage-color)',
      isApproval: false,
      openExecutionStrategy: true
    },
    ci: {
      name: 'Deploy',
      type: 'ci',
      icon: 'pipeline-build',
      iconColor: 'var(--pipeline-build-stage-color)',
      isApproval: false,
      openExecutionStrategy: false
    },
    Pipeline: {
      name: 'Deploy',
      type: 'Pipeline',
      icon: 'pipeline',
      iconColor: 'var(--pipeline-blue-color)',
      isApproval: false,
      openExecutionStrategy: false
    },
    Custom: {
      name: 'Deploy',
      type: 'Custom',
      icon: 'pipeline-custom',
      iconColor: 'var(--pipeline-custom-stage-color)',
      isApproval: false,
      openExecutionStrategy: false
    },
    Approval: {
      name: 'Deploy',
      type: 'Approval',
      icon: 'pipeline-approval',
      iconColor: 'var(--pipeline-approval-stage-color)',
      isApproval: false,
      openExecutionStrategy: false
    }
  }
}
