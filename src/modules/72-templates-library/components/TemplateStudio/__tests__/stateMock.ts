/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { set } from 'lodash-es'
import produce from 'immer'
import type { TemplateContextInterface } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateContext'
import type { JsonNode, NGTemplateInfoConfig } from 'services/template-ng'
import { TemplateType } from '@templates-library/utils/templatesUtils'
import { DrawerTypes } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateActions'

export const stepTemplateMock: NGTemplateInfoConfig = {
  name: 'Test Template',
  identifier: 'Test_Template',
  versionLabel: 'v1',
  type: 'Step',
  projectIdentifier: 'Yogesh_Test',
  orgIdentifier: 'default',
  tags: {},
  spec: {
    type: 'Http',
    timeout: '1m 40s',
    spec: { url: '<+input>', method: 'GET', headers: [], outputVariables: [], requestBody: '<+input>' }
  } as JsonNode
}

export const approvalStageTemplateMock: NGTemplateInfoConfig = {
  name: 'Test Template',
  identifier: 'Test_Template',
  versionLabel: 'v1',
  type: 'Stage',
  projectIdentifier: 'Yogesh_Test',
  orgIdentifier: 'default',
  tags: {},
  spec: {
    type: 'Approval',
    spec: {
      execution: {
        steps: [
          {
            step: {
              name: 'Approval',
              identifier: 'approval',
              type: 'HarnessApproval',
              timeout: '1d',
              spec: {
                approvalMessage: 'Please review the following information\nand approve the pipeline progression',
                includePipelineExecutionHistory: true,
                approvers: {
                  minimumCount: 1,
                  disallowPipelineExecutor: false,
                  userGroups: ['group2']
                },
                approverInputs: []
              }
            }
          }
        ]
      }
    },
    failureStrategies: [{ onFailure: { errors: ['AllErrors'], action: { type: 'StageRollback' } } }],
    when: { pipelineStatus: 'Success' }
  } as JsonNode
}

export const stageTemplateMock: NGTemplateInfoConfig = {
  name: 'Test Template',
  identifier: 'Test_Template',
  versionLabel: 'v1',
  type: 'Stage',
  projectIdentifier: 'Yogesh_Test',
  orgIdentifier: 'default',
  tags: {},
  spec: {
    type: 'Deployment',
    spec: {
      serviceConfig: { serviceRef: 'Some_Service', serviceDefinition: { type: 'Kubernetes', spec: { variables: [] } } },
      infrastructure: {
        environmentRef: 'Some_Environment',
        infrastructureDefinition: {
          type: 'KubernetesDirect',
          spec: { connectorRef: 'account.arpitconn', namespace: '<+input>', releaseName: 'release-<+INFRA_KEY>' }
        },
        allowSimultaneousDeployments: false
      },
      execution: {
        steps: [
          {
            step: {
              name: 'Rollout Deployment',
              identifier: 'rolloutDeployment',
              type: 'K8sRollingDeploy',
              timeout: '10m',
              spec: { skipDryRun: false }
            }
          },
          {
            step: {
              type: 'ShellScript',
              name: 'Step 1',
              identifier: 'Step_1',
              spec: {
                shell: 'Bash',
                onDelegate: true,
                source: { type: 'Inline', spec: { script: '<+input>' } },
                environmentVariables: [],
                outputVariables: [],
                executionTarget: {}
              },
              timeout: '10m'
            }
          }
        ],
        rollbackSteps: [
          {
            step: {
              name: 'Rollback Rollout Deployment',
              identifier: 'rollbackRolloutDeployment',
              type: 'K8sRollingRollback',
              timeout: '10m',
              spec: {}
            }
          }
        ]
      }
    },
    failureStrategies: [{ onFailure: { errors: ['AllErrors'], action: { type: 'StageRollback' } } }],
    when: { pipelineStatus: 'Success' }
  } as JsonNode
}

export const pipelineTemplateMock: NGTemplateInfoConfig = {
  name: 'Test Template',
  identifier: 'Test_Template',
  versionLabel: 'v1',
  type: 'Pipeline',
  projectIdentifier: 'Yogesh_Test',
  orgIdentifier: 'default',
  tags: {},
  spec: {
    stages: [
      {
        stage: {
          name: 'Stage 1',
          identifier: 'Stage_1',
          description: '',
          type: 'Deployment',
          spec: {
            serviceConfig: {
              serviceRef: 'Template',
              serviceDefinition: { spec: { variables: [] }, type: 'Kubernetes' }
            },
            infrastructure: {
              environmentRef: 'QA',
              infrastructureDefinition: {
                type: 'KubernetesDirect',
                spec: { connectorRef: 'Yogesh_K8_Connector', namespace: 'default', releaseName: 'release-<+INFRA_KEY>' }
              },
              allowSimultaneousDeployments: false
            },
            execution: {
              steps: [
                {
                  step: {
                    type: 'ShellScript',
                    name: 'Step 1',
                    identifier: 'Step_1',
                    spec: {
                      shell: 'Bash',
                      onDelegate: true,
                      source: { type: 'Inline', spec: { script: 'echo 1' } },
                      environmentVariables: [],
                      outputVariables: [],
                      executionTarget: {}
                    },
                    timeout: '10m'
                  }
                }
              ],
              rollbackSteps: []
            }
          },
          tags: {},
          failureStrategies: [{ onFailure: { errors: ['AllErrors'], action: { type: 'StageRollback' } } }]
        }
      }
    ]
  } as JsonNode
}

export const monitoredServiceTemplateMock: NGTemplateInfoConfig = {
  name: 'Demo 2',
  identifier: 'Demo_2',
  versionLabel: '2',
  type: 'MonitoredService',
  projectIdentifier: 'SRM',
  orgIdentifier: 'CVNG',
  tags: {},
  spec: {
    serviceRef: '<+input>',
    environmentRef: '<+input>',
    type: 'Application',
    sources: {
      healthSources: [
        {
          name: 'AppD with runtime connector',
          identifier: 'AppD_with_runtime_connector',
          type: 'AppDynamics',
          spec: {
            applicationName: '<+monitoredService.variables.AppDApplication>',
            tierName: '<+monitoredService.variables.AppDTier>',
            metricData: { Errors: true, Performance: true },
            metricDefinitions: [
              {
                identifier: 'appdMetric_101',
                metricName: 'appdMetric 101',
                baseFolder: '',
                metricPath: '',
                completeMetricPath:
                  'Overall Application Performance | <+monitoredService.variables.AppDTier> | Calls per Minute',
                groupName: 'Group 1',
                sli: { enabled: true },
                analysis: {
                  riskProfile: {},
                  liveMonitoring: { enabled: false },
                  deploymentVerification: { enabled: false }
                }
              }
            ],
            feature: 'Application Monitoring',
            connectorRef: '<+input>',
            metricPacks: [{ identifier: 'Errors' }, { identifier: 'Performance' }]
          }
        }
      ]
    },
    name: '<+monitoredService.serviceRef> <+monitoredService.environmentRef>',
    identifier: '<+monitoredService.serviceRef>_<+monitoredService.environmentRef>',
    variables: [
      { name: 'AppDApplication', type: 'String', value: '<+input>' },
      { name: 'AppDTier', type: 'String', value: '<+input>' }
    ]
  } as JsonNode
}

export const monitoedServiceMetaDataMap = {
  'Wre6-CTXTVyGRF3tPt2jXg': {
    yamlProperties: {
      fqn: 'monitoredService.sources.healthSources.AppD_with_runtime_connector.spec.metricDefinitions.appdMetric_101.analysis.deploymentVerification.enabled',
      localName: '',
      variableName: 'enabled',
      aliasFQN: '',
      visible: true
    },
    yamlOutputProperties: null,
    yamlExtraProperties: null
  },
  'sb-tX-K4SY-KVkNe_OpwbQ': {
    yamlProperties: {
      fqn: 'monitoredService.sources.healthSources.AppD_with_runtime_connector.name',
      localName: '',
      variableName: 'name',
      aliasFQN: '',
      visible: true
    },
    yamlOutputProperties: null,
    yamlExtraProperties: null
  },
  zSLKud5iSFmIeQE8oRyvqQ: {
    yamlProperties: {
      fqn: 'monitoredService.sources.healthSources.AppD_with_runtime_connector.spec.metricDefinitions.appdMetric_101.sli.enabled',
      localName: '',
      variableName: 'enabled',
      aliasFQN: '',
      visible: true
    },
    yamlOutputProperties: null,
    yamlExtraProperties: null
  },
  sMZcpOpXQxuLTj7BllE4PA: {
    yamlProperties: {
      fqn: 'monitoredService.sources.healthSources.AppD_with_runtime_connector.spec.connectorRef',
      localName: '',
      variableName: 'connectorRef',
      aliasFQN: '',
      visible: true
    },
    yamlOutputProperties: null,
    yamlExtraProperties: null
  },
  cgicVWANT2mwhg70gBLOJA: {
    yamlProperties: {
      fqn: 'monitoredService.sources.healthSources.AppD_with_runtime_connector.spec.tierName',
      localName: '',
      variableName: 'tierName',
      aliasFQN: '',
      visible: true
    },
    yamlOutputProperties: null,
    yamlExtraProperties: null
  },
  '68HhmYeMTniPcCLS7KhaDg': {
    yamlProperties: {
      fqn: 'monitoredService.sources.healthSources.AppD_with_runtime_connector.spec.metricData.Errors',
      localName: '',
      variableName: 'Errors',
      aliasFQN: '',
      visible: true
    },
    yamlOutputProperties: null,
    yamlExtraProperties: null
  },
  BjFMXfk3RSutGVippkPLwQ: {
    yamlProperties: {
      fqn: 'monitoredService.sources.healthSources.AppD_with_runtime_connector.spec.metricDefinitions.appdMetric_101.groupName',
      localName: '',
      variableName: 'groupName',
      aliasFQN: '',
      visible: true
    },
    yamlOutputProperties: null,
    yamlExtraProperties: null
  },
  '1qlgP6IgSZau9K7l-PHNXw': {
    yamlProperties: {
      fqn: 'monitoredService.sources.healthSources.AppD_with_runtime_connector.spec.metricDefinitions.appdMetric_101.baseFolder',
      localName: '',
      variableName: 'baseFolder',
      aliasFQN: '',
      visible: true
    },
    yamlOutputProperties: null,
    yamlExtraProperties: null
  },
  wi9HY4FVTLaoocs9qw4n8w: {
    yamlProperties: {
      fqn: 'monitoredService.sources.healthSources.AppD_with_runtime_connector.spec.metricDefinitions.appdMetric_101.analysis.liveMonitoring.enabled',
      localName: '',
      variableName: 'enabled',
      aliasFQN: '',
      visible: true
    },
    yamlOutputProperties: null,
    yamlExtraProperties: null
  },
  'snl03iz3QOWsMHxn5jGi-A': {
    yamlProperties: {
      fqn: 'monitoredService.sources.healthSources.AppD_with_runtime_connector.spec.feature',
      localName: '',
      variableName: 'feature',
      aliasFQN: '',
      visible: true
    },
    yamlOutputProperties: null,
    yamlExtraProperties: null
  },
  'yYC6RZ-8Ri2MOeGFeFMkaw': {
    yamlProperties: {
      fqn: 'monitoredService.sources.healthSources.AppD_with_runtime_connector.spec.metricDefinitions.appdMetric_101.metricName',
      localName: '',
      variableName: 'metricName',
      aliasFQN: '',
      visible: true
    },
    yamlOutputProperties: null,
    yamlExtraProperties: null
  },
  InXp4ipNTeWkyoG6xmfjVA: {
    yamlProperties: {
      fqn: 'monitoredService.sources.healthSources.AppD_with_runtime_connector.spec.metricDefinitions.appdMetric_101.metricPath',
      localName: '',
      variableName: 'metricPath',
      aliasFQN: '',
      visible: true
    },
    yamlOutputProperties: null,
    yamlExtraProperties: null
  },
  tROXWKsGT7CJkV82YVFeBQ: {
    yamlProperties: {
      fqn: 'monitoredService.environmentRef',
      localName: '',
      variableName: 'environmentRef',
      aliasFQN: '',
      visible: true
    },
    yamlOutputProperties: null,
    yamlExtraProperties: null
  },
  'obPbz3XbSIeubw_-VmlK5Q': {
    yamlProperties: {
      fqn: 'monitoredService.variables.AppDApplication',
      localName: '',
      variableName: 'AppDApplication',
      aliasFQN: '',
      visible: true
    },
    yamlOutputProperties: null,
    yamlExtraProperties: null
  },
  '40yb25xmTcGzG1CtNDuTSA': {
    yamlProperties: {
      fqn: 'monitoredService.sources.healthSources.AppD_with_runtime_connector.spec.metricDefinitions.appdMetric_101.completeMetricPath',
      localName: '',
      variableName: 'completeMetricPath',
      aliasFQN: '',
      visible: true
    },
    yamlOutputProperties: null,
    yamlExtraProperties: null
  },
  fkv7_oVaRUiMXdBuNfXaHQ: {
    yamlProperties: { fqn: 'monitoredService.name', localName: '', variableName: 'name', aliasFQN: '', visible: true },
    yamlOutputProperties: null,
    yamlExtraProperties: null
  },
  'd7PftXvCSG-wMgScmq9QLQ': {
    yamlProperties: {
      fqn: 'monitoredService.variables.AppDTier',
      localName: '',
      variableName: 'AppDTier',
      aliasFQN: '',
      visible: true
    },
    yamlOutputProperties: null,
    yamlExtraProperties: null
  },
  'ABlg1Y5qQbS-1uh9nTv39w': {
    yamlProperties: {
      fqn: 'monitoredService.serviceRef',
      localName: '',
      variableName: 'serviceRef',
      aliasFQN: '',
      visible: true
    },
    yamlOutputProperties: null,
    yamlExtraProperties: null
  },
  a2loakuCQNqnDbk5Sj0dNQ: {
    yamlProperties: {
      fqn: 'monitoredService.sources.healthSources.AppD_with_runtime_connector.spec.applicationName',
      localName: '',
      variableName: 'applicationName',
      aliasFQN: '',
      visible: true
    },
    yamlOutputProperties: null,
    yamlExtraProperties: null
  },
  YrVUY8bpQdy06QV2lXndwA: {
    yamlProperties: {
      fqn: 'monitoredService.sources.healthSources.AppD_with_runtime_connector.spec.metricData.Performance',
      localName: '',
      variableName: 'Performance',
      aliasFQN: '',
      visible: true
    },
    yamlOutputProperties: null,
    yamlExtraProperties: null
  }
}
// {
//   name: 'Test Template',
//   identifier: 'Test_Template',
//   versionLabel: 'v1',
//   type: 'MonitoredService',
//   projectIdentifier: 'Yogesh_Test',
//   orgIdentifier: 'default',
//   tags: {},
//   spec: {} as JsonNode
// }

export const getTemplateContextMock = (type: TemplateType): TemplateContextInterface => {
  const defaultTemplateContextMock: TemplateContextInterface = {
    state: {
      template: stepTemplateMock,
      originalTemplate: stepTemplateMock,
      stableVersion: 'v1',
      lastPublishedVersion: 'v3',
      versions: ['v1', 'v2', 'v3'],
      templateIdentifier: 'Test_Template',
      templateView: {
        isDrawerOpened: false,
        isYamlEditable: false,
        drawerData: { type: DrawerTypes.AddStep, data: { paletteData: { onSelection: jest.fn() } } }
      },
      isLoading: false,
      isBETemplateUpdated: false,
      isDBInitialized: true,
      isUpdated: false,
      isInitialized: true,
      gitDetails: {},
      entityValidityDetails: {},
      templateYaml: '',
      yamlHandler: {
        getLatestYaml: () => 'testyaml',
        getYAMLValidationErrorMap: () => new Map()
      }
    },
    view: 'VISUAL',
    isReadonly: false,
    setView: () => void 0,
    fetchTemplate: jest.fn(),
    setYamlHandler: () => undefined,
    updateTemplate: jest.fn(),
    updateTemplateView: jest.fn(),
    deleteTemplateCache: jest.fn(),
    setLoading: () => void 0,
    updateGitDetails: () => new Promise<void>(() => undefined)
  }

  switch (type) {
    case TemplateType.Step:
      return produce(defaultTemplateContextMock, draft => {
        set(draft, 'state.template', stepTemplateMock)
        set(draft, 'state.originalTemplate', stepTemplateMock)
      })
    case TemplateType.Stage:
      return produce(defaultTemplateContextMock, draft => {
        set(draft, 'state.template', stageTemplateMock)
        set(draft, 'state.originalTemplate', stageTemplateMock)
      })
    case TemplateType.Pipeline:
      return produce(defaultTemplateContextMock, draft => {
        set(draft, 'state.template', pipelineTemplateMock)
        set(draft, 'state.originalTemplate', pipelineTemplateMock)
      })
    case TemplateType.MonitoredService:
      return produce(defaultTemplateContextMock, draft => {
        set(draft, 'state.template', monitoredServiceTemplateMock)
        set(draft, 'state.originalTemplate', monitoredServiceTemplateMock)
      })
    default:
      return defaultTemplateContextMock
  }
}
