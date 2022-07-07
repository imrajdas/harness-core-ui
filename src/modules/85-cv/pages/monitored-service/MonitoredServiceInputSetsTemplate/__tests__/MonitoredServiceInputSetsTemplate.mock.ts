/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

export const spec = {
  applicationName: '<+input>',
  tierName: '<+input>',
  metricData: { Errors: true, Performance: true },
  metricDefinitions: [
    {
      identifier: 'appdMetric_101',
      metricName: 'appdMetric 101',
      baseFolder: '',
      metricPath: '',
      completeMetricPath: '<+input>',
      groupName: 'Group 1',
      sli: { enabled: true },
      analysis: {
        riskProfile: { category: 'Performance', metricType: 'RESP_TIME', thresholdTypes: ['ACT_WHEN_HIGHER'] },
        liveMonitoring: { enabled: false },
        deploymentVerification: { enabled: true, serviceInstanceMetricPath: '<+input>' }
      }
    }
  ],
  feature: 'Application Monitoring',
  connectorRef: '<+input>',
  metricPacks: [{ identifier: 'Errors' }, { identifier: 'Performance' }]
}

export const pathList = [
  {
    name: 'applicationName',
    path: 'path.applicationName'
  },
  {
    name: 'tierName',
    path: 'path.tierName'
  },
  {
    name: 'completeMetricPath',
    path: 'path.metricDefinitions.0.completeMetricPath'
  },
  {
    name: 'serviceInstanceMetricPath',
    path: 'path.metricDefinitions.0.analysis.deploymentVerification.serviceInstanceMetricPath'
  },
  {
    name: 'connectorRef',
    path: 'path.connectorRef'
  }
]

export const templateYamlData = {
  correlationId: '98305889-6183-4b93-84dd-0305a5bef1d1',
  data: {
    accountId: 'zEaak-FLS425IEO7OLzMUg',
    childType: 'Application',
    description: '',
    entityValidityDetails: { valid: true, invalidYaml: null },
    gitDetails: {},
    identifier: 'Demo_Template',
    lastUpdatedAt: 1654668248587,
    name: 'Demo Template ',
    orgIdentifier: 'CVNG',
    projectIdentifier: 'SRM',
    stableTemplate: false,
    tags: {},
    templateEntityType: 'MonitoredService',
    templateScope: 'project',
    version: 1,
    versionLabel: '3',
    yaml: 'template:\n    name: "Demo Template "\n    identifier: Demo_Template\n    versionLabel: "3"\n    type: MonitoredService\n    projectIdentifier: SRM\n    orgIdentifier: CVNG\n    tags: {}\n    spec:\n        serviceRef: <+input>\n        environmentRef: <+input>\n        type: Application\n        sources:\n            healthSources:\n                - name: AppD default metrics runtime connector\n                  identifier: AppD_default_metrics_runtime_connector\n                  type: AppDynamics\n                  spec:\n                      applicationName: <+input>\n                      tierName: <+input>\n                      metricData:\n                          Errors: true\n                          Performance: true\n                      metricDefinitions: []\n                      feature: Application Monitoring\n                      connectorRef: <+input>\n                      metricPacks:\n                          - identifier: Errors\n                          - identifier: Performance\n                - name: Appd with custom and runtime connector\n                  identifier: Appd_with_custom_and_runtime_connector\n                  type: AppDynamics\n                  spec:\n                      applicationName: <+input>\n                      tierName: <+input>\n                      metricData:\n                          Errors: true\n                          Performance: true\n                      metricDefinitions:\n                          - identifier: appdMetric_101\n                            metricName: appdMetric 101\n                            baseFolder: ""\n                            metricPath: ""\n                            completeMetricPath: <+input>\n                            groupName: Group 1\n                            sli:\n                                enabled: true\n                            analysis:\n                                riskProfile:\n                                    category: Performance\n                                    metricType: RESP_TIME\n                                    thresholdTypes:\n                                        - ACT_WHEN_HIGHER\n                                liveMonitoring:\n                                    enabled: false\n                                deploymentVerification:\n                                    enabled: true\n                                    serviceInstanceMetricPath: <+input>\n                      feature: Application Monitoring\n                      connectorRef: <+input>\n                      metricPacks:\n                          - identifier: Errors\n                          - identifier: Performance\n        name: <+monitoredService.serviceRef> <+monitoredService.environmentRef>\n        identifier: <+monitoredService.serviceRef>_<+monitoredService.environmentRef>\n'
  },
  metaData: null,
  status: 'SUCCESS'
}
