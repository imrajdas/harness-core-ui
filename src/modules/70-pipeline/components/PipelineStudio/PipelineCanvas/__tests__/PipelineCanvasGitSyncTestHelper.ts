/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { MultiTypeInputType } from '@wings-software/uicore'
import { Scope } from '@common/interfaces/SecretsInterface'
import type { PipelineContextInterface } from '../../PipelineContext/PipelineContext'
import type { PipelineSelectionState } from '../../PipelineQueryParamState/usePipelineQueryParam'

const stateMock = {
  pipeline: {
    name: 'Test Pipeline',
    identifier: 'test_pipeline',
    projectIdentifier: 'testProject',
    orgIdentifier: 'default',
    tags: {},
    stages: [
      {
        stage: {
          name: 's1',
          identifier: 's1',
          description: '',
          type: 'Deployment',
          spec: {
            infrastructure: {
              allowSimultaneousDeployments: false,
              environmentRef: 'env_2',
              infrastructureDefinition: {
                spec: {
                  connectorRef: 'account.builfarm',
                  namespace: 'ns',
                  releaseName: 'release-<+INFRA_KEY>'
                },
                type: 'KubernetesDirect'
              }
            },
            execution: {
              steps: [
                {
                  step: {
                    type: 'ShellScript',
                    name: 'test',
                    identifier: 'test',
                    spec: {
                      shell: 'Bash',
                      source: {
                        spec: {
                          script: '<+input>'
                        },
                        type: 'Inline'
                      }
                    }
                  }
                }
              ]
            },
            serviceConfig: {
              serviceRef: 'service_2',
              serviceDefinition: {
                type: 'Kubernetes'
              }
            }
          },
          failureStrategies: [
            {
              onFailure: {
                action: {
                  type: 'StageRollback'
                },
                errors: ['AllErrors']
              }
            }
          ]
        }
      }
    ]
  },
  originalPipeline: {
    name: 'Test Pipeline',
    identifier: 'test_pipeline',
    projectIdentifier: 'testProject',
    orgIdentifier: 'default',
    tags: {},
    stages: [
      {
        stage: {
          name: 's1',
          identifier: 's1',
          description: '',
          type: 'Deployment',
          spec: {
            infrastructure: {
              allowSimultaneousDeployments: false,
              environmentRef: 'env_2',
              infrastructureDefinition: {
                spec: {
                  connectorRef: 'account.builfarm',
                  namespace: 'ns',
                  releaseName: 'release-<+INFRA_KEY>'
                },
                type: 'KubernetesDirect'
              }
            },
            execution: {
              steps: [
                {
                  step: {
                    type: 'ShellScript',
                    name: 'test',
                    identifier: 'test',
                    spec: {
                      shell: 'Bash',
                      source: {
                        spec: {
                          script: '<+input>'
                        },
                        type: 'Inline'
                      }
                    }
                  }
                }
              ]
            },
            serviceConfig: {
              serviceRef: 'service_2',
              serviceDefinition: {
                type: 'Kubernetes'
              }
            }
          },
          failureStrategies: [
            {
              onFailure: {
                action: {
                  type: 'StageRollback'
                },
                errors: ['AllErrors']
              }
            }
          ]
        }
      }
    ]
  },
  pipelineIdentifier: 'test_pipeline',
  pipelineView: {
    isSplitViewOpen: false,
    isDrawerOpened: false,
    splitViewData: {},
    drawerData: {
      type: 'AddCommand'
    }
  },
  templateView: {
    isTemplateDrawerOpened: false
  },
  schemaErrors: false,
  gitDetails: {
    branch: 'feature',
    filePath: 'test_pipeline.yaml',
    objectId: '4471ec3aa40c26377353974c29a6670d998db06f',
    repoIdentifier: 'gitSyncRepo',
    rootFolder: '/rootFolderTest/.harness/'
  },
  entityValidityDetails: { valid: true },
  isLoading: false,
  isBEPipelineUpdated: false,
  isDBInitialized: true,
  isUpdated: true,
  isInitialized: true,
  selectionState: {
    selectedSectionId: undefined,
    selectedStageId: undefined,
    selectedStepId: undefined
  },
  error: ''
}

const pipelineContextMock: PipelineContextInterface = {
  state: stateMock as any,
  stepsFactory: {
    getStep: (type: string) => {
      switch (type) {
        case 'Run':
          return {
            icon: 'run-step',
            name: 'Configure Run Step',
            type: 'Run'
          }
      }
    },
    getStepDescription: (type: string) => {
      return 'Awesome description for step ' + type
    },
    getStepIsHarnessSpecific: (type: string) => {
      if (type) {
        return true
      }
    },
    getStepData: () => ({
      icon: 'run-step',
      name: 'Configure Run Step',
      type: 'Run'
    }),
    getStepIcon: () => 'run-step'
  } as any,
  contextType: 'Pipeline',
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
  stagesMap: {},
  setSchemaErrorView: () => undefined,
  isReadonly: false,
  view: 'VISUAL',
  scope: Scope.PROJECT,
  updateGitDetails: () => new Promise<void>(() => undefined),
  updatePipelineStoreMetadata: () => new Promise<void>(() => undefined),
  updateEntityValidityDetails: () => new Promise<void>(() => undefined),
  setView: () => void 0,
  runPipeline: () => undefined,
  // eslint-disable-next-line react/display-name
  renderPipelineStage: jest.fn(),
  fetchPipeline: () => new Promise<void>(() => undefined),
  updatePipelineView: jest.fn(),
  updateStage: jest.fn().mockResolvedValue({}),
  getStageFromPipeline: () => ({ stage: stateMock.pipeline.stages[0] as any, parent: undefined }),
  setYamlHandler: () => undefined,
  updatePipeline: () => new Promise<void>(() => undefined),
  pipelineSaved: () => undefined,
  deletePipelineCache: () => new Promise<void>(() => undefined),
  setSelectedStageId: (_selectedStageId: string | undefined) => undefined,
  setSelectedStepId: (_selectedStepId: string | undefined) => undefined,
  setSelectedSectionId: (_selectedSectionId: string | undefined) => undefined,
  setSelection: (_selectedState: PipelineSelectionState) => undefined,
  getStagePathFromPipeline: () => '',
  setTemplateTypes: () => undefined
}

export const updateStageFnArg1 = {
  description: '',
  identifier: 's1',
  name: 's1',
  spec: {
    cloneCodebase: false,
    execution: {
      steps: [
        {
          step: {
            description: 'test desc',
            identifier: 'step1',
            name: 'step1',
            spec: {
              command: "echo 'run'",
              connectorRef: 'harnessImage',
              image: 'alpine',
              privileged: false
            },
            type: 'Run'
          }
        }
      ]
    },
    infrastructure: {
      spec: {
        connectorRef: 'account.yogesh',
        namespace: 'harness-delegate'
      },
      type: 'KubernetesDirect'
    },
    serviceDependencies: [
      {
        description: '',
        identifier: 'step1',
        name: '',
        spec: {}
      }
    ]
  },
  type: 'CI'
}

export const updatePipelineViewFnArg1 = {
  drawerData: {
    data: {
      stepConfig: {
        addOrEdit: 'edit',
        isStepGroup: false,
        node: {
          description: 'test desc',
          identifier: 'step1',
          name: 'step1',
          spec: {
            command: "echo 'run'",
            connectorRef: 'harnessImage',
            image: 'alpine',
            privileged: false
          },
          type: 'Run'
        },
        stepsMap: new Map([
          [
            'step3',
            {
              type: 'Run',
              name: 'step3',
              identifier: 'step1',
              spec: {
                connectorRef: 'harnessImage',
                image: 'alpine',
                command: "echo 'run'",
                privileged: false
              }
            }
          ],
          [
            'step2',
            {
              type: 'Run',
              name: 'step2',
              identifier: 'step2',
              spec: {
                connectorRef: 'harnessImage',
                image: 'alpine',
                command: "echo 'run'",
                privileged: false
              }
            }
          ]
        ])
      }
    },
    type: 'StepConfig'
  },
  isDrawerOpened: true,
  isSplitViewOpen: true,
  splitViewData: {
    type: 'StageView'
  }
}

export const putPipelinePromiseArg = {
  body: `pipeline:
  name: Test Pipeline
  identifier: test_pipeline
  projectIdentifier: testProject
  orgIdentifier: default
  tags: {}
  stages:
    - stage:
        name: s1
        identifier: s1
        description: ""
        type: Deployment
        spec:
          infrastructure:
            allowSimultaneousDeployments: false
            environmentRef: env_2
            infrastructureDefinition:
              spec:
                connectorRef: account.builfarm
                namespace: ns
                releaseName: release-<+INFRA_KEY>
              type: KubernetesDirect
          execution:
            steps:
              - step:
                  type: ShellScript
                  name: test
                  identifier: test
                  spec:
                    shell: Bash
                    source:
                      spec:
                        script: <+input>
                      type: Inline
          serviceConfig:
            serviceRef: service_2
            serviceDefinition:
              type: Kubernetes
        failureStrategies:
          - onFailure:
              action:
                type: StageRollback
              errors:
                - AllErrors
`,
  pipelineIdentifier: 'test_pipeline',
  queryParams: {
    accountIdentifier: 'testAcc',
    branch: 'feature',
    commitMsg: 'common.gitSync.updateResource',
    createPr: false,
    filePath: 'test_pipeline.yaml',
    isNewBranch: false,
    lastObjectId: '4471ec3aa40c26377353974c29a6670d998db06f',
    orgIdentifier: 'default',
    projectIdentifier: 'testProject',
    repoIdentifier: 'gitSyncRepo',
    rootFolder: '/rootFolderTest/.harness/',
    targetBranch: ''
  },
  requestOptions: {
    headers: {
      'Content-Type': 'application/yaml'
    }
  }
}

export const createPipelinePromiseArg = {
  body: `pipeline:
  name: Test Pipeline
  identifier: test_pipeline
  projectIdentifier: testProject
  orgIdentifier: default
  tags: {}
  stages:
    - stage:
        name: s1
        identifier: s1
        description: ""
        type: Deployment
        spec:
          infrastructure:
            allowSimultaneousDeployments: false
            environmentRef: env_2
            infrastructureDefinition:
              spec:
                connectorRef: account.builfarm
                namespace: ns
                releaseName: release-<+INFRA_KEY>
              type: KubernetesDirect
          execution:
            steps:
              - step:
                  type: ShellScript
                  name: test
                  identifier: test
                  spec:
                    shell: Bash
                    source:
                      spec:
                        script: <+input>
                      type: Inline
          serviceConfig:
            serviceRef: service_2
            serviceDefinition:
              type: Kubernetes
        failureStrategies:
          - onFailure:
              action:
                type: StageRollback
              errors:
                - AllErrors
`,
  queryParams: {
    accountIdentifier: 'testAcc',
    branch: 'feature',
    commitMsg: 'common.gitSync.createResource',
    createPr: false,
    filePath: 'test_pipeline.yaml',
    isNewBranch: false,
    orgIdentifier: 'default',
    projectIdentifier: 'testProject',
    repoIdentifier: 'gitSyncRepo',
    rootFolder: '/rootFolderTest/.harness/',
    targetBranch: ''
  },
  requestOptions: {
    headers: {
      'Content-Type': 'application/yaml'
    }
  }
}

export default pipelineContextMock
