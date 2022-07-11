/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { ServiceSpec } from 'services/cd-ng'

export const commonFormikInitialValues = {
  pipeline: {
    name: 'Pipeline',
    identifier: 'testPipeline',
    projectIdentifier: 'testProject',
    orgIdentifier: 'testOrg',
    tags: {},
    stages: [
      {
        stage: {
          name: 'Stage 1',
          identifier: 'Stage_1',
          description: '',
          type: 'Deployment',
          spec: {
            serviceConfig: {
              serviceRef: 'HELLO',
              serviceDefinition: {
                spec: {
                  variables: [],
                  artifacts: {
                    primary: {
                      spec: {
                        connectorRef: 'artifactJenkinsConnector',
                        artifactPath: '',
                        build: '<+input>',
                        jobName: '<+input>'
                      },
                      type: 'Jenkins'
                    }
                  }
                },
                type: 'ServerlessAwsLambda'
              }
            },
            infrastructure: {
              environmentRef: 'Prod',
              infrastructureDefinition: {
                type: 'ServerlessAwsLambda',
                spec: {
                  connectorRef: '<+input>',
                  stage: '<+input>',
                  region: '<+input>'
                }
              },
              allowSimultaneousDeployments: false
            },
            execution: {
              steps: [
                {
                  step: {
                    type: 'ShellScript',
                    name: 'ss',
                    identifier: 'ss',
                    spec: {
                      shell: 'Bash',
                      onDelegate: true,
                      source: {
                        type: 'Inline',
                        spec: {
                          script: 'echo 1'
                        }
                      },
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

export const templateJenkinsArtifact: ServiceSpec = {
  artifacts: {
    primary: {
      spec: {
        connectorRef: 'artifactJenkinsConnector',
        artifactPath: '<+input>',
        build: '<+input>',
        jobName: '<+input>'
      },
      type: 'Jenkins'
    }
  }
}

export const templateJenkinsArtifactWithoutJobName: ServiceSpec = {
  artifacts: {
    primary: {
      spec: {
        artifactPath: '<+input>',
        build: '<+input>'
      },
      type: 'Jenkins'
    }
  }
}

export const mockArtifactPathResponse = {
  status: 'SUCCESS',
  data: [
    'target/CDC-Test-Data-1.0-SNAPSHOT-bundle.tar',
    'target/CDC-Test-Data-1.0-SNAPSHOT-bundle.tar.gz',
    'target/CDC-Test-Data-1.0-SNAPSHOT-bundle.zip',
    'target/CDC-Test-Data-1.0-SNAPSHOT.jar'
  ],
  metaData: null,
  correlationId: '16aab655-e6c2-4d8b-8975-0f28ca7009d7'
}

export const mockBuildResponse = {
  status: 'SUCCESS',
  data: [
    {
      number: '19',
      revision: '49aeaabede5c766a6a46f8d997d912c07cf556d9',
      description: null,
      artifactPath: null,
      buildUrl: 'https://jenkins.dev.harness.io/job/CDC-Artifact-Verification-Project/19/',
      buildDisplayName: '#19',
      buildFullDisplayName: 'CDC-Artifact-Verification-Project #19',
      artifactFileSize: null,
      uiDisplayName: 'Build# 19',
      status: 'SUCCESS',
      buildParameters: {},
      metadata: {},
      labels: {},
      artifactFileMetadataList: []
    },
    {
      number: '18',
      revision: '49aeaabede5c766a6a46f8d997d912c07cf556d9',
      description: null,
      artifactPath: null,
      buildUrl: 'https://jenkins.dev.harness.io/job/CDC-Artifact-Verification-Project/18/',
      buildDisplayName: '#18',
      buildFullDisplayName: 'CDC-Artifact-Verification-Project #18',
      artifactFileSize: null,
      uiDisplayName: 'Build# 18',
      status: 'SUCCESS',
      buildParameters: {},
      metadata: {},
      labels: {},
      artifactFileMetadataList: []
    }
  ],
  metaData: null,
  correlationId: 'a7908d83-5ea2-47b6-9ac5-9a441c309195'
}
