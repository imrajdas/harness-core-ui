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
