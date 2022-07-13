/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

export const mockedFormikWithTemplatesData = {
  values: {
    type: 'Verify',
    name: 'Test-1',
    identifier: 'Test1',
    spec: {
      type: 'Rolling',
      monitoredService: {
        type: 'Template',
        spec: {
          monitoredServiceTemplateRef: 'Verify_step_mon_template',
          versionLabel: '1.0',
          templateInputs: {
            identifier: '<+monitoredService.serviceRef>_<+monitoredService.environmentRef>',
            type: 'Application',
            serviceRef: '<+input>',
            environmentRef: '<+input>',
            sources: {
              healthSources: [
                {
                  identifier: 'Appd',
                  type: 'AppDynamics',
                  spec: {
                    applicationName: '<+input>',
                    tierName: '<+input>',
                    metricDefinitions: [
                      {
                        identifier: 'appdMetric',
                        completeMetricPath: '<+input>',
                        analysis: {
                          deploymentVerification: {
                            serviceInstanceMetricPath: '<+input>'
                          }
                        }
                      }
                    ],
                    connectorRef: '<+input>'
                  }
                }
              ]
            },
            variables: [
              {
                name: 'connectorVariable',
                type: 'String',
                value: '<+input>'
              }
            ]
          }
        }
      },
      spec: {
        sensitivity: {
          label: 'High',
          value: 'HIGH'
        },
        duration: {
          label: '5 min',
          value: '5m'
        },
        deploymentTag: '<+serviceConfig.artifacts.primary.tag>',
        baseline: '',
        trafficsplit: ''
      },
      monitoredServiceRef: '',
      healthSources: [],
      initialMonitoredService: {
        type: 'Template',
        spec: {
          monitoredServiceTemplateRef: 'Verify_step_mon_template',
          versionLabel: '1.0',
          templateInputs: {
            identifier: '<+monitoredService.serviceRef>_<+monitoredService.environmentRef>',
            type: 'Application',
            serviceRef: '<+input>',
            environmentRef: '<+input>',
            sources: {
              healthSources: [
                {
                  identifier: 'Appd',
                  type: 'AppDynamics',
                  spec: {
                    applicationName: '<+input>',
                    tierName: '<+input>',
                    metricDefinitions: [
                      {
                        identifier: 'appdMetric',
                        completeMetricPath: '<+input>',
                        analysis: {
                          deploymentVerification: {
                            serviceInstanceMetricPath: '<+input>'
                          }
                        }
                      }
                    ],
                    connectorRef: '<+input>'
                  }
                }
              ]
            },
            variables: [
              {
                name: 'connectorVariable',
                type: 'String',
                value: '<+input>'
              }
            ]
          }
        }
      }
    },
    timeout: '2h',
    failureStrategies: [
      {
        onFailure: {
          errors: ['Verification'],
          action: {
            type: 'ManualIntervention',
            spec: {
              timeout: '2h',
              onTimeout: {
                action: {
                  type: 'StageRollback'
                }
              }
            }
          }
        }
      },
      {
        onFailure: {
          errors: ['Unknown'],
          action: {
            type: 'ManualIntervention',
            spec: {
              timeout: '2h',
              onTimeout: {
                action: {
                  type: 'Ignore'
                }
              }
            }
          }
        }
      }
    ]
  },
  errors: {},
  touched: {},
  isSubmitting: false,
  isValidating: true,
  submitCount: 0,
  initialValues: {
    type: 'Verify',
    name: 'Test-1',
    identifier: 'Test1',
    spec: {
      type: 'Rolling',
      monitoredService: {
        type: 'Template',
        spec: {
          monitoredServiceTemplateRef: 'Verify_step_mon_template',
          versionLabel: '1.0',
          templateInputs: {
            identifier: '<+monitoredService.serviceRef>_<+monitoredService.environmentRef>',
            type: 'Application',
            serviceRef: '<+input>',
            environmentRef: '<+input>',
            sources: {
              healthSources: [
                {
                  identifier: 'Appd',
                  type: 'AppDynamics',
                  spec: {
                    applicationName: '<+input>',
                    tierName: '<+input>',
                    metricDefinitions: [
                      {
                        identifier: 'appdMetric',
                        completeMetricPath: '<+input>',
                        analysis: {
                          deploymentVerification: {
                            serviceInstanceMetricPath: '<+input>'
                          }
                        }
                      }
                    ],
                    connectorRef: '<+input>'
                  }
                }
              ]
            },
            variables: [
              {
                name: 'connectorVariable',
                type: 'String',
                value: '<+input>'
              }
            ]
          }
        }
      },
      spec: {
        sensitivity: {
          label: 'High',
          value: 'HIGH'
        },
        duration: {
          label: '5 min',
          value: '5m'
        },
        deploymentTag: '<+serviceConfig.artifacts.primary.tag>',
        baseline: '',
        trafficsplit: ''
      },
      monitoredServiceRef: '',
      healthSources: [],
      initialMonitoredService: {
        type: 'Template',
        spec: {
          monitoredServiceTemplateRef: 'Verify_step_mon_template',
          versionLabel: '1.0',
          templateInputs: {
            identifier: '<+monitoredService.serviceRef>_<+monitoredService.environmentRef>',
            type: 'Application',
            serviceRef: '<+input>',
            environmentRef: '<+input>',
            sources: {
              healthSources: [
                {
                  identifier: 'Appd',
                  type: 'AppDynamics',
                  spec: {
                    applicationName: '<+input>',
                    tierName: '<+input>',
                    metricDefinitions: [
                      {
                        identifier: 'appdMetric',
                        completeMetricPath: '<+input>',
                        analysis: {
                          deploymentVerification: {
                            serviceInstanceMetricPath: '<+input>'
                          }
                        }
                      }
                    ],
                    connectorRef: '<+input>'
                  }
                }
              ]
            },
            variables: [
              {
                name: 'connectorVariable',
                type: 'String',
                value: '<+input>'
              }
            ]
          }
        }
      }
    },
    timeout: '2h',
    failureStrategies: [
      {
        onFailure: {
          errors: ['Verification'],
          action: {
            type: 'ManualIntervention',
            spec: {
              timeout: '2h',
              onTimeout: {
                action: {
                  type: 'StageRollback'
                }
              }
            }
          }
        }
      },
      {
        onFailure: {
          errors: ['Unknown'],
          action: {
            type: 'ManualIntervention',
            spec: {
              timeout: '2h',
              onTimeout: {
                action: {
                  type: 'Ignore'
                }
              }
            }
          }
        }
      }
    ]
  },
  initialErrors: {},
  initialTouched: {},
  isValid: true,
  dirty: false,
  validateOnBlur: true,
  validateOnChange: true,
  validateOnMount: false
} as any

export const mockedTemplateInputYaml = {
  status: 'SUCCESS',
  data: 'type: "Application"\nserviceRef: "<+input>"\nenvironmentRef: "<+input>"\nsources:\n  healthSources:\n  - identifier: "AddD_Health_source"\n    type: "AppDynamics"\n    spec:\n      applicationName: "<+input>"\n      tierName: "<+input>"\n      metricDefinitions:\n      - identifier: "appdMetric"\n        completeMetricPath: "<+input>"\n        analysis:\n          deploymentVerification:\n            serviceInstanceMetricPath: "<+input>"\nvariables:\n- name: "connectorRef"\n  type: "String"\n  value: "<+input>"\n',
  metaData: null,
  correlationId: '423a4b39-90cd-4d49-9dc5-0a55a29cdb4b'
} as any

export const mockedTemplateData = {
  accountId: 'zEaak-FLS425IEO7OLzMUg',
  orgIdentifier: 'SRM',
  projectIdentifier: 'SRM',
  identifier: 'Complete_Monitored_service_templates',
  name: 'Complete Monitored service templates',
  description: '',
  tags: {},
  yaml: 'template:\n    name: Complete Monitored service templates\n    identifier: Complete_Monitored_service_templates\n    versionLabel: "1.0"\n    type: MonitoredService\n    projectIdentifier: SRM\n    orgIdentifier: SRM\n    tags: {}\n    spec:\n        serviceRef: <+input>\n        environmentRef: <+input>\n        type: Application\n        sources:\n            changeSources:\n                - name: Harness CD Next Gen\n                  identifier: harness_cd_next_gen\n                  type: HarnessCDNextGen\n                  enabled: true\n                  category: Deployment\n                  spec: {}\n            healthSources:\n                - name: AddD Health source\n                  identifier: AddD_Health_source\n                  type: AppDynamics\n                  spec:\n                      applicationName: <+input>\n                      tierName: <+input>\n                      metricData:\n                          Errors: true\n                          Performance: true\n                      metricDefinitions:\n                          - identifier: appdMetric\n                            metricName: appdMetric\n                            baseFolder: ""\n                            metricPath: ""\n                            completeMetricPath: <+input>\n                            groupName: group-1\n                            sli:\n                                enabled: true\n                            analysis:\n                                riskProfile:\n                                    category: Errors\n                                    metricType: ERROR\n                                    thresholdTypes:\n                                        - ACT_WHEN_HIGHER\n                                liveMonitoring:\n                                    enabled: true\n                                deploymentVerification:\n                                    enabled: true\n                                    serviceInstanceMetricPath: <+input>\n                      feature: Application Monitoring\n                      connectorRef: <+monitoredService.variables.connectorRef>\n                      metricPacks:\n                          - identifier: Errors\n                          - identifier: Performance\n        variables:\n            - name: connectorRef\n              type: String\n              value: <+input>\n',
  versionLabel: '1.0',
  templateEntityType: 'MonitoredService',
  childType: 'Application',
  templateScope: 'project',
  version: 2,
  gitDetails: {
    objectId: '',
    branch: '',
    repoIdentifier: '',
    rootFolder: '',
    filePath: '',
    repoName: '',
    commitId: '',
    fileUrl: ''
  },
  entityValidityDetails: {
    valid: true,
    invalidYaml: ''
  },
  lastUpdatedAt: 1657260572124,
  createdAt: 1657259935668,
  stableTemplate: true
} as any

export const updatedSpecs = {
  healthSources: [],
  initialMonitoredService: {
    spec: {
      monitoredServiceTemplateRef: 'Complete_Monitored_service_templates',
      templateInputs: {
        environmentRef: '<+input>',
        serviceRef: '<+input>',
        sources: {
          healthSources: [
            {
              identifier: 'AddD_Health_source',
              spec: {
                applicationName: '<+input>',
                metricDefinitions: [
                  {
                    analysis: {
                      deploymentVerification: {
                        serviceInstanceMetricPath: '<+input>'
                      }
                    },
                    completeMetricPath: '<+input>',
                    identifier: 'appdMetric'
                  }
                ],
                tierName: '<+input>'
              },
              type: 'AppDynamics'
            }
          ]
        },
        type: 'Application',
        variables: [{ name: 'connectorRef', type: 'String', value: '<+input>' }]
      },
      versionLabel: '1.0'
    },
    type: 'Template'
  },
  monitoredService: {
    spec: {
      monitoredServiceTemplateRef: 'Complete_Monitored_service_templates',
      templateInputs: {
        environmentRef: '<+input>',
        serviceRef: '<+input>',
        sources: {
          healthSources: [
            {
              identifier: 'AddD_Health_source',
              spec: {
                applicationName: '<+input>',
                metricDefinitions: [
                  {
                    analysis: {
                      deploymentVerification: {
                        serviceInstanceMetricPath: '<+input>'
                      }
                    },
                    completeMetricPath: '<+input>',
                    identifier: 'appdMetric'
                  }
                ],
                tierName: '<+input>'
              },
              type: 'AppDynamics'
            }
          ]
        },
        type: 'Application',
        variables: [{ name: 'connectorRef', type: 'String', value: '<+input>' }]
      },
      versionLabel: '1.0'
    },
    type: 'Template'
  },
  monitoredServiceRef: '',
  spec: {
    baseline: '',
    deploymentTag: '<+serviceConfig.artifacts.primary.tag>',
    duration: { label: '5 min', value: '5m' },
    sensitivity: { label: 'High', value: 'HIGH' },
    trafficsplit: ''
  },
  type: 'Rolling'
}
