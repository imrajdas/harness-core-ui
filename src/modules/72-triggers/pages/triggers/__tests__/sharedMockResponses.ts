/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { UseGetReturnData } from '@common/utils/testUtils'
import type {
  ResponseInputSetTemplateResponse,
  ResponseMergeInputSetResponse,
  ResponsePageInputSetSummaryResponse,
  ResponsePageNGTriggerDetailsResponse,
  ResponsePMSPipelineResponseDTO,
  PMSPipelineResponseDTO
} from 'services/pipeline-ng'
import type { ResponseConnectorResponse, ResponseListEnvironmentResponse } from 'services/cd-ng'

export const GetPipelineResponse: UseGetReturnData<ResponsePMSPipelineResponseDTO> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      yamlPipeline:
        'pipeline:\n    name: no-inputs-pipeline-1\n    identifier: noinputspipeline1\n    projectIdentifier: project1\n    orgIdentifier: default\n    tags: {}\n    stages: []\n    variables:\n        - name: newVar\n          type: String\n          value: <+input>\n        - name: otherVariable\n          type: String\n          value: ""\n',
      resolvedTemplatesPipelineYaml:
        'pipeline:\n    name: no-inputs-pipeline-1\n    identifier: noinputspipeline1\n    projectIdentifier: project1\n    orgIdentifier: default\n    tags: {}\n    stages: []\n    variables:\n        - name: newVar\n          type: String\n          value: <+input>\n        - name: otherVariable\n          type: String\n          value: ""\n',
      version: 15,
      gitDetails: {
        objectId: null,
        branch: null,
        repoIdentifier: null,
        rootFolder: null,
        filePath: null
      }
    } as unknown as PMSPipelineResponseDTO,
    metaData: null as unknown as undefined,
    correlationId: '26a25fc1-882a-4499-9059-d1ed08ae12fb'
  }
}

export const GetManifestPipelineResponse: UseGetReturnData<ResponsePMSPipelineResponseDTO> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      yamlPipeline:
        'pipeline:\n    name: TestPipeline-ABC\n    identifier: TestPipelineABC\n    projectIdentifier: project1\n    orgIdentifier: default\n    timeout: 10m\n    tags: {}\n    stages:\n        - stage:\n              name: stagea\n              identifier: stagea\n              description: ""\n              type: Deployment\n              spec:\n                  serviceConfig:\n                      serviceRef: seveice\n                      serviceDefinition:\n                          type: Kubernetes\n                          spec:\n                              variables: []\n                              manifests:\n                                  - manifest:\n                                        identifier: sdfds\n                                        type: HelmChart\n                                        spec:\n                                            store:\n                                                type: S3\n                                                spec:\n                                                    connectorRef: testecr2\n                                                    bucketName: <+input>\n                                                    folderPath: <+input>\n                                                    region: us-east-1\n                                            chartName: <+input>\n                                            chartVersion: <+input>\n                                            helmVersion: V2\n                                            skipResourceVersioning: false\n                                  - manifest:\n                                        identifier: testhelmmanifest\n                                        type: HelmChart\n                                        spec:\n                                            store:\n                                                type: S3\n                                                spec:\n                                                    connectorRef: testecr2\n                                                    bucketName: <+input>\n                                                    folderPath: <+input>\n                                                    region: <+input>\n                                            chartName: <+input>\n                                            chartVersion: <+input>\n                                            helmVersion: V2\n                                            skipResourceVersioning: false\n                  infrastructure:\n                      environmentRef: TestEnv\n                      infrastructureDefinition:\n                          type: KubernetesDirect\n                          spec:\n                              connectorRef: testk8s\n                              namespace: sdfds\n                              releaseName: release-<+INFRA_KEY>\n                          provisioner:\n                              steps:\n                                  - step:\n                                        type: TerraformDestroy\n                                        name: xzcxcx\n                                        identifier: xzcxcx\n                                        spec:\n                                            provisionerIdentifier: xcxzcx\n                                            configuration:\n                                                type: InheritFromApply\n                                        timeout: 10m\n                              rollbackSteps: []\n                      allowSimultaneousDeployments: false\n                  execution:\n                      steps:\n                          - step:\n                                name: Rollout Deployment\n                                identifier: rolloutDeployment\n                                type: K8sRollingDeploy\n                                timeout: 10m\n                                spec:\n                                    skipDryRun: false\n                      rollbackSteps:\n                          - step:\n                                name: Rollback Rollout Deployment\n                                identifier: rollbackRolloutDeployment\n                                type: K8sRollingRollback\n                                timeout: 10m\n                                spec: {}\n              tags: {}\n              failureStrategies:\n                  - onFailure:\n                        errors:\n                            - AllErrors\n                        action:\n                            type: StageRollback\n',
      resolvedTemplatesPipelineYaml:
        'pipeline:\n    name: TestPipeline-ABC\n    identifier: TestPipelineABC\n    projectIdentifier: project1\n    orgIdentifier: default\n    timeout: 10m\n    tags: {}\n    stages:\n        - stage:\n              name: stagea\n              identifier: stagea\n              description: ""\n              type: Deployment\n              spec:\n                  serviceConfig:\n                      serviceRef: seveice\n                      serviceDefinition:\n                          type: Kubernetes\n                          spec:\n                              variables: []\n                              manifests:\n                                  - manifest:\n                                        identifier: sdfds\n                                        type: HelmChart\n                                        spec:\n                                            store:\n                                                type: S3\n                                                spec:\n                                                    connectorRef: testecr2\n                                                    bucketName: <+input>\n                                                    folderPath: <+input>\n                                                    region: us-east-1\n                                            chartName: <+input>\n                                            chartVersion: <+input>\n                                            helmVersion: V2\n                                            skipResourceVersioning: false\n                                  - manifest:\n                                        identifier: testhelmmanifest\n                                        type: HelmChart\n                                        spec:\n                                            store:\n                                                type: S3\n                                                spec:\n                                                    connectorRef: testecr2\n                                                    bucketName: <+input>\n                                                    folderPath: <+input>\n                                                    region: <+input>\n                                            chartName: <+input>\n                                            chartVersion: <+input>\n                                            helmVersion: V2\n                                            skipResourceVersioning: false\n                  infrastructure:\n                      environmentRef: TestEnv\n                      infrastructureDefinition:\n                          type: KubernetesDirect\n                          spec:\n                              connectorRef: testk8s\n                              namespace: sdfds\n                              releaseName: release-<+INFRA_KEY>\n                          provisioner:\n                              steps:\n                                  - step:\n                                        type: TerraformDestroy\n                                        name: xzcxcx\n                                        identifier: xzcxcx\n                                        spec:\n                                            provisionerIdentifier: xcxzcx\n                                            configuration:\n                                                type: InheritFromApply\n                                        timeout: 10m\n                              rollbackSteps: []\n                      allowSimultaneousDeployments: false\n                  execution:\n                      steps:\n                          - step:\n                                name: Rollout Deployment\n                                identifier: rolloutDeployment\n                                type: K8sRollingDeploy\n                                timeout: 10m\n                                spec:\n                                    skipDryRun: false\n                      rollbackSteps:\n                          - step:\n                                name: Rollback Rollout Deployment\n                                identifier: rollbackRolloutDeployment\n                                type: K8sRollingRollback\n                                timeout: 10m\n                                spec: {}\n              tags: {}\n              failureStrategies:\n                  - onFailure:\n                        errors:\n                            - AllErrors\n                        action:\n                            type: StageRollback\n',
      version: 15,
      gitDetails: {
        objectId: null,
        branch: null,
        repoIdentifier: null,
        rootFolder: null,
        filePath: null
      }
    } as unknown as PMSPipelineResponseDTO,
    metaData: null as unknown as undefined,
    correlationId: '26a25fc1-882a-4499-9059-d1ed08ae12fb'
  }
}

export const GetArtifactPipelineResponse: UseGetReturnData<ResponsePMSPipelineResponseDTO> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      yamlPipeline:
        'pipeline:\n    name: TestPipeline-ABC\n    identifier: TestPipelineABC\n    projectIdentifier: test\n    orgIdentifier: default\n    timeout: 10m\n    tags: {}\n    stages:\n        - stage:\n              name: stagea\n              identifier: stagea\n              description: ""\n              type: Deployment\n              spec:\n                  serviceConfig:\n                      serviceRef: seveice\n                      serviceDefinition:\n                          type: Kubernetes\n                          spec:\n                              variables: []\n                              manifests:\n                                  - manifest:\n                                        identifier: sdfds\n                                        type: HelmChart\n                                        spec:\n                                            store:\n                                                type: S3\n                                                spec:\n                                                    connectorRef: testecr2\n                                                    bucketName: <+input>\n                                                    folderPath: <+input>\n                                                    region: us-east-1\n                                            chartName: <+input>\n                                            chartVersion: test-chart-verion\n                                            helmVersion: V2\n                                            skipResourceVersioning: false\n                                  - manifest:\n                                        identifier: testhelmmanifest\n                                        type: HelmChart\n                                        spec:\n                                            store:\n                                                type: S3\n                                                spec:\n                                                    connectorRef: testecr2\n                                                    bucketName: sdfds\n                                                    folderPath: sdfdsf\n                                                    region: us-gov-east-1\n                                            chartName: <+input>\n                                            chartVersion: <+input>\n                                            helmVersion: V2\n                                            skipResourceVersioning: false\n                                  - manifest:\n                                        identifier: werewr\n                                        type: HelmChart\n                                        spec:\n                                            store:\n                                                type: S3\n                                                spec:\n                                                    connectorRef: ertretr\n                                                    bucketName: wewer\n                                                    folderPath: werew\n                                                    region: us-gov-east-1\n                                            chartName: werew\n                                            chartVersion: <+input>\n                                            helmVersion: V2\n                                            skipResourceVersioning: false\n                              artifacts:\n                                  sidecars:\n                                      - sidecar:\n                                            type: Gcr\n                                            spec:\n                                                connectorRef: <+input>\n                                                imagePath: <+input>\n                                                registryHostname: <+input>\n                                                tag: <+input>\n                                            identifier: testsideid\n                                      - sidecar:\n                                            type: Gcr\n                                            spec:\n                                                connectorRef: tst\n                                                imagePath: <+input>\n                                                registryHostname: <+input>\n                                                tag: <+input>\n                                            identifier: artifactgcrida\n                                      - sidecar:\n                                            type: DockerRegistry\n                                            spec:\n                                                connectorRef: testdockder2\n                                                imagePath: sdfd\n                                                tag: <+input>\n                                            identifier: sdfsdf\n                                  primary:\n                                      type: Gcr\n                                      spec:\n                                          connectorRef: testgcp1a\n                                          imagePath: <+input>\n                                          registryHostname: <+input>\n                                          tag: sdfdafd\n                  infrastructure:\n                      environmentRef: TestEnv\n                      infrastructureDefinition:\n                          type: KubernetesDirect\n                          spec:\n                              connectorRef: testk8s\n                              namespace: sdfds\n                              releaseName: release-<+INFRA_KEY>\n                          provisioner:\n                              steps:\n                                  - step:\n                                        type: TerraformDestroy\n                                        name: xzcxcx\n                                        identifier: xzcxcx\n                                        spec:\n                                            provisionerIdentifier: xcxzcx\n                                            configuration:\n                                                type: InheritFromApply\n                                        timeout: 10m\n                              rollbackSteps: []\n                      allowSimultaneousDeployments: false\n                  execution:\n                      steps:\n                          - step:\n                                name: Rollout Deployment\n                                identifier: rolloutDeployment\n                                type: K8sRollingDeploy\n                                timeout: 10m\n                                spec:\n                                    skipDryRun: false\n                          - step:\n                                type: Barrier\n                                name: asds\n                                identifier: asds\n                                spec:\n                                    barrierRef: sdfdstestnarroer\n                                timeout: 10m\n                      rollbackSteps:\n                          - step:\n                                name: Rollback Rollout Deployment\n                                identifier: rollbackRolloutDeployment\n                                type: K8sRollingRollback\n                                timeout: 10m\n                                spec: {}\n                  serviceDependencies: []\n              tags: {}\n              failureStrategies:\n                  - onFailure:\n                        errors:\n                            - AllErrors\n                        action:\n                            type: StageRollback\n    notificationRules:\n        - name: rrtre\n          pipelineEvents:\n              - type: AllEvents\n          notificationMethod:\n              type: MsTeams\n              spec:\n                  userGroups: []\n                  webhookUrl:\n                      - sfggf\n          enabled: true\n        - name: Notification2\n          pipelineEvents:\n              - type: AllEvents\n          notificationMethod:\n              type: MsTeams\n              spec:\n                  userGroups: []\n                  webhookUrl:\n                      - eee\n          enabled: true\n        - name: sdfds\n          pipelineEvents:\n              - type: AllEvents\n          notificationMethod:\n              type: MsTeams\n              spec:\n                  userGroups: []\n                  webhookUrl:\n                      - test-1\n                      - test-2\n          enabled: true\n    flowControl:\n        barriers:\n            - name: barrier1\n              identifier: barrier1\n            - name: fgdgfd\n              identifier: fgdgfd\n            - name: sdfds-test-narroer\n              identifier: sdfdstestnarroer\n            - name: test-barrier-2\n              identifier: testbarrier2\n',
      resolvedTemplatesPipelineYaml:
        'pipeline:\n    name: TestPipeline-ABC\n    identifier: TestPipelineABC\n    projectIdentifier: test\n    orgIdentifier: default\n    timeout: 10m\n    tags: {}\n    stages:\n        - stage:\n              name: stagea\n              identifier: stagea\n              description: ""\n              type: Deployment\n              spec:\n                  serviceConfig:\n                      serviceRef: seveice\n                      serviceDefinition:\n                          type: Kubernetes\n                          spec:\n                              variables: []\n                              manifests:\n                                  - manifest:\n                                        identifier: sdfds\n                                        type: HelmChart\n                                        spec:\n                                            store:\n                                                type: S3\n                                                spec:\n                                                    connectorRef: testecr2\n                                                    bucketName: <+input>\n                                                    folderPath: <+input>\n                                                    region: us-east-1\n                                            chartName: <+input>\n                                            chartVersion: test-chart-verion\n                                            helmVersion: V2\n                                            skipResourceVersioning: false\n                                  - manifest:\n                                        identifier: testhelmmanifest\n                                        type: HelmChart\n                                        spec:\n                                            store:\n                                                type: S3\n                                                spec:\n                                                    connectorRef: testecr2\n                                                    bucketName: sdfds\n                                                    folderPath: sdfdsf\n                                                    region: us-gov-east-1\n                                            chartName: <+input>\n                                            chartVersion: <+input>\n                                            helmVersion: V2\n                                            skipResourceVersioning: false\n                                  - manifest:\n                                        identifier: werewr\n                                        type: HelmChart\n                                        spec:\n                                            store:\n                                                type: S3\n                                                spec:\n                                                    connectorRef: ertretr\n                                                    bucketName: wewer\n                                                    folderPath: werew\n                                                    region: us-gov-east-1\n                                            chartName: werew\n                                            chartVersion: <+input>\n                                            helmVersion: V2\n                                            skipResourceVersioning: false\n                              artifacts:\n                                  sidecars:\n                                      - sidecar:\n                                            type: Gcr\n                                            spec:\n                                                connectorRef: <+input>\n                                                imagePath: <+input>\n                                                registryHostname: <+input>\n                                                tag: <+input>\n                                            identifier: testsideid\n                                      - sidecar:\n                                            type: Gcr\n                                            spec:\n                                                connectorRef: tst\n                                                imagePath: <+input>\n                                                registryHostname: <+input>\n                                                tag: <+input>\n                                            identifier: artifactgcrida\n                                      - sidecar:\n                                            type: DockerRegistry\n                                            spec:\n                                                connectorRef: testdockder2\n                                                imagePath: sdfd\n                                                tag: <+input>\n                                            identifier: sdfsdf\n                                  primary:\n                                      type: Gcr\n                                      spec:\n                                          connectorRef: testgcp1a\n                                          imagePath: <+input>\n                                          registryHostname: <+input>\n                                          tag: sdfdafd\n                  infrastructure:\n                      environmentRef: TestEnv\n                      infrastructureDefinition:\n                          type: KubernetesDirect\n                          spec:\n                              connectorRef: testk8s\n                              namespace: sdfds\n                              releaseName: release-<+INFRA_KEY>\n                          provisioner:\n                              steps:\n                                  - step:\n                                        type: TerraformDestroy\n                                        name: xzcxcx\n                                        identifier: xzcxcx\n                                        spec:\n                                            provisionerIdentifier: xcxzcx\n                                            configuration:\n                                                type: InheritFromApply\n                                        timeout: 10m\n                              rollbackSteps: []\n                      allowSimultaneousDeployments: false\n                  execution:\n                      steps:\n                          - step:\n                                name: Rollout Deployment\n                                identifier: rolloutDeployment\n                                type: K8sRollingDeploy\n                                timeout: 10m\n                                spec:\n                                    skipDryRun: false\n                          - step:\n                                type: Barrier\n                                name: asds\n                                identifier: asds\n                                spec:\n                                    barrierRef: sdfdstestnarroer\n                                timeout: 10m\n                      rollbackSteps:\n                          - step:\n                                name: Rollback Rollout Deployment\n                                identifier: rollbackRolloutDeployment\n                                type: K8sRollingRollback\n                                timeout: 10m\n                                spec: {}\n                  serviceDependencies: []\n              tags: {}\n              failureStrategies:\n                  - onFailure:\n                        errors:\n                            - AllErrors\n                        action:\n                            type: StageRollback\n    notificationRules:\n        - name: rrtre\n          pipelineEvents:\n              - type: AllEvents\n          notificationMethod:\n              type: MsTeams\n              spec:\n                  userGroups: []\n                  webhookUrl:\n                      - sfggf\n          enabled: true\n        - name: Notification2\n          pipelineEvents:\n              - type: AllEvents\n          notificationMethod:\n              type: MsTeams\n              spec:\n                  userGroups: []\n                  webhookUrl:\n                      - eee\n          enabled: true\n        - name: sdfds\n          pipelineEvents:\n              - type: AllEvents\n          notificationMethod:\n              type: MsTeams\n              spec:\n                  userGroups: []\n                  webhookUrl:\n                      - test-1\n                      - test-2\n          enabled: true\n    flowControl:\n        barriers:\n            - name: barrier1\n              identifier: barrier1\n            - name: fgdgfd\n              identifier: fgdgfd\n            - name: sdfds-test-narroer\n              identifier: sdfdstestnarroer\n            - name: test-barrier-2\n              identifier: testbarrier2\n',
      version: 20,
      gitDetails: {
        objectId: null,
        branch: null,
        repoIdentifier: null,
        rootFolder: null,
        filePath: null
      }
    } as unknown as PMSPipelineResponseDTO,
    metaData: null as unknown as undefined,
    correlationId: '26a25fc1-882a-4499-9059-d1ed08ae12fb'
  }
}

export const GetParallelArtifactPipelineResponse: UseGetReturnData<ResponsePMSPipelineResponseDTO> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      yamlPipeline:
        'pipeline:\n    name: artifact-pipeline1\n    identifier: artifactpipeline1\n    allowStageExecutions: false\n    projectIdentifier: mtran\n    orgIdentifier: harness\n    tags: {}\n    stages:\n        - parallel:\n              - stage:\n                    name: stage1\n                    identifier: stage1\n                    description: ""\n                    type: Deployment\n                    spec:\n                        serviceConfig:\n                            serviceRef: s1\n                            serviceDefinition:\n                                type: Kubernetes\n                                spec:\n                                    variables: []\n                                    artifacts:\n                                        primary:\n                                            spec:\n                                                connectorRef: account.dockerTestJasmeet\n                                                imagePath: <+input>\n                                                tag: <+input>\n                                            type: DockerRegistry\n                        infrastructure:\n                            environmentRef: env1\n                            infrastructureDefinition:\n                                type: KubernetesDirect\n                                spec:\n                                    connectorRef: account.testdisableharnesssm\n                                    namespace: def\n                                    releaseName: release-<+INFRA_KEY>\n                            allowSimultaneousDeployments: false\n                        execution:\n                            steps:\n                                - step:\n                                      type: ShellScript\n                                      name: shell\n                                      identifier: shell\n                                      spec:\n                                          shell: Bash\n                                          onDelegate: true\n                                          source:\n                                              type: Inline\n                                              spec:\n                                                  script: echo \'hi\'\n                                          environmentVariables: []\n                                          outputVariables: []\n                                          executionTarget: {}\n                                      timeout: 10m\n                            rollbackSteps: []\n                    tags: {}\n              - stage:\n                    name: stage2\n                    identifier: stage2\n                    description: ""\n                    type: Deployment\n                    spec:\n                        serviceConfig:\n                            serviceRef: s1\n                            serviceDefinition:\n                                type: Kubernetes\n                                spec:\n                                    variables: []\n                                    artifacts:\n                                        primary:\n                                            spec:\n                                                connectorRef: account.testAm\n                                                imagePath: d2\n                                                tag: <+input>\n                                            type: DockerRegistry\n                        infrastructure:\n                            environmentRef: env00005\n                            infrastructureDefinition:\n                                type: KubernetesDirect\n                                spec:\n                                    connectorRef: account.testdisableharnesssm\n                                    namespace: def\n                                    releaseName: release-<+INFRA_KEY>\n                            allowSimultaneousDeployments: false\n                        execution:\n                            steps:\n                                - step:\n                                      type: ShellScript\n                                      name: shell2\n                                      identifier: shell2\n                                      spec:\n                                          shell: Bash\n                                          onDelegate: true\n                                          source:\n                                              type: Inline\n                                              spec:\n                                                  script: echo \'hi\'\n                                          environmentVariables: []\n                                          outputVariables: []\n                                          executionTarget: {}\n                                      timeout: 10m\n                            rollbackSteps: []\n                    tags: {}\n',
      resolvedTemplatesPipelineYaml:
        'pipeline:\n    name: artifact-pipeline1\n    identifier: artifactpipeline1\n    allowStageExecutions: false\n    projectIdentifier: mtran\n    orgIdentifier: harness\n    tags: {}\n    stages:\n        - parallel:\n              - stage:\n                    name: stage1\n                    identifier: stage1\n                    description: ""\n                    type: Deployment\n                    spec:\n                        serviceConfig:\n                            serviceRef: s1\n                            serviceDefinition:\n                                type: Kubernetes\n                                spec:\n                                    variables: []\n                                    artifacts:\n                                        primary:\n                                            spec:\n                                                connectorRef: account.dockerTestJasmeet\n                                                imagePath: <+input>\n                                                tag: <+input>\n                                            type: DockerRegistry\n                        infrastructure:\n                            environmentRef: env1\n                            infrastructureDefinition:\n                                type: KubernetesDirect\n                                spec:\n                                    connectorRef: account.testdisableharnesssm\n                                    namespace: def\n                                    releaseName: release-<+INFRA_KEY>\n                            allowSimultaneousDeployments: false\n                        execution:\n                            steps:\n                                - step:\n                                      type: ShellScript\n                                      name: shell\n                                      identifier: shell\n                                      spec:\n                                          shell: Bash\n                                          onDelegate: true\n                                          source:\n                                              type: Inline\n                                              spec:\n                                                  script: echo \'hi\'\n                                          environmentVariables: []\n                                          outputVariables: []\n                                          executionTarget: {}\n                                      timeout: 10m\n                            rollbackSteps: []\n                    tags: {}\n              - stage:\n                    name: stage2\n                    identifier: stage2\n                    description: ""\n                    type: Deployment\n                    spec:\n                        serviceConfig:\n                            serviceRef: s1\n                            serviceDefinition:\n                                type: Kubernetes\n                                spec:\n                                    variables: []\n                                    artifacts:\n                                        primary:\n                                            spec:\n                                                connectorRef: account.testAm\n                                                imagePath: d2\n                                                tag: <+input>\n                                            type: DockerRegistry\n                        infrastructure:\n                            environmentRef: env00005\n                            infrastructureDefinition:\n                                type: KubernetesDirect\n                                spec:\n                                    connectorRef: account.testdisableharnesssm\n                                    namespace: def\n                                    releaseName: release-<+INFRA_KEY>\n                            allowSimultaneousDeployments: false\n                        execution:\n                            steps:\n                                - step:\n                                      type: ShellScript\n                                      name: shell2\n                                      identifier: shell2\n                                      spec:\n                                          shell: Bash\n                                          onDelegate: true\n                                          source:\n                                              type: Inline\n                                              spec:\n                                                  script: echo \'hi\'\n                                          environmentVariables: []\n                                          outputVariables: []\n                                          executionTarget: {}\n                                      timeout: 10m\n                            rollbackSteps: []\n                    tags: {}\n',
      version: 4,
      gitDetails: {
        objectId: null,
        branch: null,
        repoIdentifier: null,
        rootFolder: null,
        filePath: null,
        repoName: null
      },
      entityValidityDetails: {
        valid: true,
        invalidYaml: null
      },
      modules: ['cd']
    } as unknown as PMSPipelineResponseDTO,
    metaData: null as unknown as undefined,
    correlationId: '26a25fc1-882a-4499-9059-d1ed08ae12fb'
  }
}

export const GetManifestWithEventConditionsResponse: UseGetReturnData<ResponsePMSPipelineResponseDTO> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      yamlPipeline:
        'pipeline:\n    name: TestPipeline-ABC\n    identifier: TestPipelineABC\n    projectIdentifier: project1\n    orgIdentifier: default\n    timeout: 10m\n    tags: {}\n    stages:\n        - stage:\n              name: stagea\n              identifier: stagea\n              description: ""\n              type: Deployment\n              spec:\n                  serviceConfig:\n                      serviceRef: seveice\n                      serviceDefinition:\n                          type: Kubernetes\n                          spec:\n                              variables: []\n                              manifests:\n                                  - manifest:\n                                        identifier: sdfds\n                                        type: HelmChart\n                                        spec:\n                                            store:\n                                                type: S3\n                                                spec:\n                                                    connectorRef: testecr2\n                                                    bucketName: <+input>\n                                                    folderPath: <+input>\n                                                    region: us-east-1\n                                            chartName: <+input>\n                                            chartVersion: <+input>\n                                            helmVersion: V2\n                                            skipResourceVersioning: false\n                                  - manifest:\n                                        identifier: testhelmmanifest\n                                        type: HelmChart\n                                        spec:\n                                            store:\n                                                type: S3\n                                                spec:\n                                                    connectorRef: testecr2\n                                                    bucketName: <+input>\n                                                    folderPath: <+input>\n                                                    region: <+input>\n                                            chartName: <+input>\n                                            chartVersion: <+input>\n                                            helmVersion: V2\n                                            skipResourceVersioning: false\n                  infrastructure:\n                      environmentRef: TestEnv\n                      infrastructureDefinition:\n                          type: KubernetesDirect\n                          spec:\n                              connectorRef: testk8s\n                              namespace: sdfds\n                              releaseName: release-<+INFRA_KEY>\n                          provisioner:\n                              steps:\n                                  - step:\n                                        type: TerraformDestroy\n                                        name: xzcxcx\n                                        identifier: xzcxcx\n                                        spec:\n                                            provisionerIdentifier: xcxzcx\n                                            configuration:\n                                                type: InheritFromApply\n                                        timeout: 10m\n                              rollbackSteps: []\n                      allowSimultaneousDeployments: false\n                  execution:\n                      steps:\n                          - step:\n                                name: Rollout Deployment\n                                identifier: rolloutDeployment\n                                type: K8sRollingDeploy\n                                timeout: 10m\n                                spec:\n                                    skipDryRun: false\n                      rollbackSteps:\n                          - step:\n                                name: Rollback Rollout Deployment\n                                identifier: rollbackRolloutDeployment\n                                type: K8sRollingRollback\n                                timeout: 10m\n                                spec: {}\n              tags: {}\n              failureStrategies:\n                  - onFailure:\n                        errors:\n                            - AllErrors\n                        action:\n                            type: StageRollback\n',
      resolvedTemplatesPipelineYaml:
        'pipeline:\n    name: TestPipeline-ABC\n    identifier: TestPipelineABC\n    projectIdentifier: project1\n    orgIdentifier: default\n    timeout: 10m\n    tags: {}\n    stages:\n        - stage:\n              name: stagea\n              identifier: stagea\n              description: ""\n              type: Deployment\n              spec:\n                  serviceConfig:\n                      serviceRef: seveice\n                      serviceDefinition:\n                          type: Kubernetes\n                          spec:\n                              variables: []\n                              manifests:\n                                  - manifest:\n                                        identifier: sdfds\n                                        type: HelmChart\n                                        spec:\n                                            store:\n                                                type: S3\n                                                spec:\n                                                    connectorRef: testecr2\n                                                    bucketName: <+input>\n                                                    folderPath: <+input>\n                                                    region: us-east-1\n                                            chartName: <+input>\n                                            chartVersion: <+input>\n                                            helmVersion: V2\n                                            skipResourceVersioning: false\n                                  - manifest:\n                                        identifier: testhelmmanifest\n                                        type: HelmChart\n                                        spec:\n                                            store:\n                                                type: S3\n                                                spec:\n                                                    connectorRef: testecr2\n                                                    bucketName: <+input>\n                                                    folderPath: <+input>\n                                                    region: <+input>\n                                            chartName: <+input>\n                                            chartVersion: <+input>\n                                            helmVersion: V2\n                                            skipResourceVersioning: false\n                  infrastructure:\n                      environmentRef: TestEnv\n                      infrastructureDefinition:\n                          type: KubernetesDirect\n                          spec:\n                              connectorRef: testk8s\n                              namespace: sdfds\n                              releaseName: release-<+INFRA_KEY>\n                          provisioner:\n                              steps:\n                                  - step:\n                                        type: TerraformDestroy\n                                        name: xzcxcx\n                                        identifier: xzcxcx\n                                        spec:\n                                            provisionerIdentifier: xcxzcx\n                                            configuration:\n                                                type: InheritFromApply\n                                        timeout: 10m\n                              rollbackSteps: []\n                      allowSimultaneousDeployments: false\n                  execution:\n                      steps:\n                          - step:\n                                name: Rollout Deployment\n                                identifier: rolloutDeployment\n                                type: K8sRollingDeploy\n                                timeout: 10m\n                                spec:\n                                    skipDryRun: false\n                      rollbackSteps:\n                          - step:\n                                name: Rollback Rollout Deployment\n                                identifier: rollbackRolloutDeployment\n                                type: K8sRollingRollback\n                                timeout: 10m\n                                spec: {}\n              tags: {}\n              failureStrategies:\n                  - onFailure:\n                        errors:\n                            - AllErrors\n                        action:\n                            type: StageRollback\n',
      version: 15,
      gitDetails: {
        objectId: null,
        branch: null,
        repoIdentifier: null,
        rootFolder: null,
        filePath: null
      }
    } as unknown as PMSPipelineResponseDTO,
    metaData: null as unknown as undefined,
    correlationId: '26a25fc1-882a-4499-9059-d1ed08ae12fb'
  }
}

export const GetParseableManifestPipelineResponse: UseGetReturnData<ResponsePMSPipelineResponseDTO> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      yamlPipeline:
        'pipeline:\n    name: test-manifest\n    identifier: testmanifest\n    projectIdentifier: mtran\n    orgIdentifier: harness\n    tags: {}\n    stages:\n        - stage:\n              name: stage\n              identifier: stage\n              description: ""\n              type: Deployment\n              spec:\n                  serviceConfig:\n                      serviceDefinition:\n                          type: Kubernetes\n                          spec:\n                              artifacts:\n                                  sidecars: []\n                              variables: []\n                              manifestOverrideSets: []\n                              manifests:\n                                  - manifest:\n                                        identifier: s3manifestid\n                                        type: HelmChart\n                                        spec:\n                                            store:\n                                                type: S3\n                                                spec:\n                                                    connectorRef: <+input>\n                                                    bucketName: <+input>\n                                                    folderPath: chartPathasdfasdfasdfasdfasdfadsf\n                                                    region: <+input>\n                                            chartName: <+input>\n                                            chartVersion: <+input>\n                                            helmVersion: V2\n                                            skipResourceVersioning: false\n                                  - manifest:\n                                        identifier: gcrManifestId\n                                        type: HelmChart\n                                        spec:\n                                            store:\n                                                type: Gcs\n                                                spec:\n                                                    connectorRef: <+input>\n                                                    bucketName: bucketname\n                                                    folderPath: ""\n                                            chartName: chartName\n                                            chartVersion: chartVersion\n                                            helmVersion: V2\n                                            skipResourceVersioning: false\n                                  - manifest:\n                                        identifier: httpManifestIdentifierasdfasdfasdf\n                                        type: HelmChart\n                                        spec:\n                                            store:\n                                                type: Http\n                                                spec:\n                                                    connectorRef: account.hgjhsgdsd\n                                            chartName: chartName\n                                            chartVersion: <+input>\n                                            helmVersion: V2\n                                            skipResourceVersioning: <+input>\n                                            commandFlags:\n                                                - commandType: Fetch\n                                                  flag: <+input>\n                                  - manifest:\n                                        identifier: gcrIdentifier\n                                        type: HelmChart\n                                        spec:\n                                            store:\n                                                type: Gcs\n                                                spec:\n                                                    connectorRef: <+input>\n                                                    bucketName: bucketName\n                                                    folderPath: chartPath\n                                            chartName: chartName\n                                            chartVersion: <+input>\n                                            helmVersion: V2\n                                            skipResourceVersioning: false\n                      serviceRef: <+input>\n                  infrastructure:\n                      environmentRef: <+input>\n                      infrastructureDefinition:\n                          type: KubernetesDirect\n                          spec:\n                              connectorRef: <+input>\n                              namespace: <+input>\n                              releaseName: <+input>\n                      allowSimultaneousDeployments: false\n                      infrastructureKey: <+input>\n                  execution:\n                      steps:\n                          - step:\n                                name: Rollout Deployment\n                                identifier: rolloutDeployment\n                                type: K8sRollingDeploy\n                                timeout: 10m\n                                spec:\n                                    skipDryRun: false\n                      rollbackSteps:\n                          - step:\n                                name: Rollback Rollout Deployment\n                                identifier: rollbackRolloutDeployment\n                                type: K8sRollingRollback\n                                timeout: 10m\n                                spec: {}\n              tags: {}\n              failureStrategies:\n                  - onFailure:\n                        errors:\n                            - AllErrors\n                        action:\n                            type: StageRollback\n        - stage:\n              name: stage2\n              identifier: stage2\n              description: ""\n              type: Deployment\n              spec:\n                  serviceConfig:\n                      serviceDefinition:\n                          type: Kubernetes\n                          spec:\n                              artifacts:\n                                  sidecars: []\n                                  primary:\n                                      type: DockerRegistry\n                                      spec:\n                                          connectorRef: configurableartifact\n                                          imagePath: imagePath\n                                          tag: <+input>\n                              manifestOverrideSets: []\n                              manifests:\n                                  - manifest:\n                                        identifier: manifestId\n                                        type: HelmChart\n                                        spec:\n                                            store:\n                                                type: S3\n                                                spec:\n                                                    connectorRef: account.sdhgjhgdj\n                                                    bucketName: <+input>\n                                                    folderPath: <+input>\n                                                    region: us-gov-west-1\n                                            chartName: chartName\n                                            chartVersion: chartVersion\n                                            helmVersion: V2\n                                            skipResourceVersioning: false\n                                  - manifest:\n                                        identifier: manifestId2\n                                        type: HelmChart\n                                        spec:\n                                            store:\n                                                type: S3\n                                                spec:\n                                                    connectorRef: account.Aws_connectpr\n                                                    bucketName: bucketname\n                                                    folderPath: chartPath\n                                                    region: us-gov-west-1\n                                            chartName: chartName\n                                            chartVersion: chartVersion\n                                            helmVersion: V2\n                                            skipResourceVersioning: false\n                              variables: []\n                      serviceRef: <+input>\n                  infrastructure:\n                      environmentRef: <+input>\n                      infrastructureDefinition:\n                          type: KubernetesDirect\n                          spec:\n                              connectorRef: account.builfarm\n                              namespace: a\n                              releaseName: a\n                      allowSimultaneousDeployments: false\n                      infrastructureKey: a\n                  execution:\n                      steps:\n                          - step:\n                                name: Rollout Deployment\n                                identifier: rolloutDeployment\n                                type: K8sRollingDeploy\n                                timeout: 10m\n                                spec:\n                                    skipDryRun: false\n                      rollbackSteps:\n                          - step:\n                                name: Rollback Rollout Deployment\n                                identifier: rollbackRolloutDeployment\n                                type: K8sRollingRollback\n                                timeout: 10m\n                                spec: {}\n              tags: {}\n              failureStrategies:\n                  - onFailure:\n                        errors:\n                            - AllErrors\n                        action:\n                            type: StageRollback\n        - stage:\n              name: manifest-stage\n              identifier: manifeststage\n              description: ""\n              type: Deployment\n              spec:\n                  serviceConfig:\n                      serviceDefinition:\n                          type: Kubernetes\n                          spec:\n                              artifacts:\n                                  sidecars: []\n                              manifestOverrideSets: []\n                              manifests:\n                                  - manifest:\n                                        identifier: manifest\n                                        type: K8sManifest\n                                        spec:\n                                            store:\n                                                type: Github\n                                                spec:\n                                                    connectorRef: configurablemanifest\n                                                    gitFetchType: Branch\n                                                    paths:\n                                                        - abc\n                                                    repoName: reponame\n                                                    branch: <+input>\n                                            skipResourceVersioning: false\n                              variables: []\n                      serviceRef: <+input>\n                  infrastructure:\n                      environmentRef: <+input>\n                      infrastructureDefinition:\n                          type: KubernetesDirect\n                          spec:\n                              connectorRef: account.builfarm\n                              namespace: a\n                              releaseName: a\n                      allowSimultaneousDeployments: false\n                      infrastructureKey: a\n                  execution:\n                      steps:\n                          - step:\n                                name: Rollout Deployment\n                                identifier: rolloutDeployment\n                                type: K8sRollingDeploy\n                                timeout: 10m\n                                spec:\n                                    skipDryRun: false\n                      rollbackSteps:\n                          - step:\n                                name: Rollback Rollout Deployment\n                                identifier: rollbackRolloutDeployment\n                                type: K8sRollingRollback\n                                timeout: 10m\n                                spec: {}\n              tags: {}\n              failureStrategies:\n                  - onFailure:\n                        errors:\n                            - AllErrors\n                        action:\n                            type: StageRollback\n',
      resolvedTemplatesPipelineYaml:
        'pipeline:\n    name: test-manifest\n    identifier: testmanifest\n    projectIdentifier: mtran\n    orgIdentifier: harness\n    tags: {}\n    stages:\n        - stage:\n              name: stage\n              identifier: stage\n              description: ""\n              type: Deployment\n              spec:\n                  serviceConfig:\n                      serviceDefinition:\n                          type: Kubernetes\n                          spec:\n                              artifacts:\n                                  sidecars: []\n                              variables: []\n                              manifestOverrideSets: []\n                              manifests:\n                                  - manifest:\n                                        identifier: s3manifestid\n                                        type: HelmChart\n                                        spec:\n                                            store:\n                                                type: S3\n                                                spec:\n                                                    connectorRef: <+input>\n                                                    bucketName: <+input>\n                                                    folderPath: chartPathasdfasdfasdfasdfasdfadsf\n                                                    region: <+input>\n                                            chartName: <+input>\n                                            chartVersion: <+input>\n                                            helmVersion: V2\n                                            skipResourceVersioning: false\n                                  - manifest:\n                                        identifier: gcrManifestId\n                                        type: HelmChart\n                                        spec:\n                                            store:\n                                                type: Gcs\n                                                spec:\n                                                    connectorRef: <+input>\n                                                    bucketName: bucketname\n                                                    folderPath: ""\n                                            chartName: chartName\n                                            chartVersion: chartVersion\n                                            helmVersion: V2\n                                            skipResourceVersioning: false\n                                  - manifest:\n                                        identifier: httpManifestIdentifierasdfasdfasdf\n                                        type: HelmChart\n                                        spec:\n                                            store:\n                                                type: Http\n                                                spec:\n                                                    connectorRef: account.hgjhsgdsd\n                                            chartName: chartName\n                                            chartVersion: <+input>\n                                            helmVersion: V2\n                                            skipResourceVersioning: <+input>\n                                            commandFlags:\n                                                - commandType: Fetch\n                                                  flag: <+input>\n                                  - manifest:\n                                        identifier: gcrIdentifier\n                                        type: HelmChart\n                                        spec:\n                                            store:\n                                                type: Gcs\n                                                spec:\n                                                    connectorRef: <+input>\n                                                    bucketName: bucketName\n                                                    folderPath: chartPath\n                                            chartName: chartName\n                                            chartVersion: <+input>\n                                            helmVersion: V2\n                                            skipResourceVersioning: false\n                      serviceRef: <+input>\n                  infrastructure:\n                      environmentRef: <+input>\n                      infrastructureDefinition:\n                          type: KubernetesDirect\n                          spec:\n                              connectorRef: <+input>\n                              namespace: <+input>\n                              releaseName: <+input>\n                      allowSimultaneousDeployments: false\n                      infrastructureKey: <+input>\n                  execution:\n                      steps:\n                          - step:\n                                name: Rollout Deployment\n                                identifier: rolloutDeployment\n                                type: K8sRollingDeploy\n                                timeout: 10m\n                                spec:\n                                    skipDryRun: false\n                      rollbackSteps:\n                          - step:\n                                name: Rollback Rollout Deployment\n                                identifier: rollbackRolloutDeployment\n                                type: K8sRollingRollback\n                                timeout: 10m\n                                spec: {}\n              tags: {}\n              failureStrategies:\n                  - onFailure:\n                        errors:\n                            - AllErrors\n                        action:\n                            type: StageRollback\n        - stage:\n              name: stage2\n              identifier: stage2\n              description: ""\n              type: Deployment\n              spec:\n                  serviceConfig:\n                      serviceDefinition:\n                          type: Kubernetes\n                          spec:\n                              artifacts:\n                                  sidecars: []\n                                  primary:\n                                      type: DockerRegistry\n                                      spec:\n                                          connectorRef: configurableartifact\n                                          imagePath: imagePath\n                                          tag: <+input>\n                              manifestOverrideSets: []\n                              manifests:\n                                  - manifest:\n                                        identifier: manifestId\n                                        type: HelmChart\n                                        spec:\n                                            store:\n                                                type: S3\n                                                spec:\n                                                    connectorRef: account.sdhgjhgdj\n                                                    bucketName: <+input>\n                                                    folderPath: <+input>\n                                                    region: us-gov-west-1\n                                            chartName: chartName\n                                            chartVersion: chartVersion\n                                            helmVersion: V2\n                                            skipResourceVersioning: false\n                                  - manifest:\n                                        identifier: manifestId2\n                                        type: HelmChart\n                                        spec:\n                                            store:\n                                                type: S3\n                                                spec:\n                                                    connectorRef: account.Aws_connectpr\n                                                    bucketName: bucketname\n                                                    folderPath: chartPath\n                                                    region: us-gov-west-1\n                                            chartName: chartName\n                                            chartVersion: chartVersion\n                                            helmVersion: V2\n                                            skipResourceVersioning: false\n                              variables: []\n                      serviceRef: <+input>\n                  infrastructure:\n                      environmentRef: <+input>\n                      infrastructureDefinition:\n                          type: KubernetesDirect\n                          spec:\n                              connectorRef: account.builfarm\n                              namespace: a\n                              releaseName: a\n                      allowSimultaneousDeployments: false\n                      infrastructureKey: a\n                  execution:\n                      steps:\n                          - step:\n                                name: Rollout Deployment\n                                identifier: rolloutDeployment\n                                type: K8sRollingDeploy\n                                timeout: 10m\n                                spec:\n                                    skipDryRun: false\n                      rollbackSteps:\n                          - step:\n                                name: Rollback Rollout Deployment\n                                identifier: rollbackRolloutDeployment\n                                type: K8sRollingRollback\n                                timeout: 10m\n                                spec: {}\n              tags: {}\n              failureStrategies:\n                  - onFailure:\n                        errors:\n                            - AllErrors\n                        action:\n                            type: StageRollback\n        - stage:\n              name: manifest-stage\n              identifier: manifeststage\n              description: ""\n              type: Deployment\n              spec:\n                  serviceConfig:\n                      serviceDefinition:\n                          type: Kubernetes\n                          spec:\n                              artifacts:\n                                  sidecars: []\n                              manifestOverrideSets: []\n                              manifests:\n                                  - manifest:\n                                        identifier: manifest\n                                        type: K8sManifest\n                                        spec:\n                                            store:\n                                                type: Github\n                                                spec:\n                                                    connectorRef: configurablemanifest\n                                                    gitFetchType: Branch\n                                                    paths:\n                                                        - abc\n                                                    repoName: reponame\n                                                    branch: <+input>\n                                            skipResourceVersioning: false\n                              variables: []\n                      serviceRef: <+input>\n                  infrastructure:\n                      environmentRef: <+input>\n                      infrastructureDefinition:\n                          type: KubernetesDirect\n                          spec:\n                              connectorRef: account.builfarm\n                              namespace: a\n                              releaseName: a\n                      allowSimultaneousDeployments: false\n                      infrastructureKey: a\n                  execution:\n                      steps:\n                          - step:\n                                name: Rollout Deployment\n                                identifier: rolloutDeployment\n                                type: K8sRollingDeploy\n                                timeout: 10m\n                                spec:\n                                    skipDryRun: false\n                      rollbackSteps:\n                          - step:\n                                name: Rollback Rollout Deployment\n                                identifier: rollbackRolloutDeployment\n                                type: K8sRollingRollback\n                                timeout: 10m\n                                spec: {}\n              tags: {}\n              failureStrategies:\n                  - onFailure:\n                        errors:\n                            - AllErrors\n                        action:\n                            type: StageRollback\n',
      version: 5202,
      gitDetails: {
        objectId: null,
        branch: null,
        repoIdentifier: null,
        rootFolder: null,
        filePath: null
      }
    } as unknown as PMSPipelineResponseDTO,
    metaData: null as unknown as undefined,
    correlationId: '26a25fc1-882a-4499-9059-d1ed08ae12fb'
  }
}

export const GetUpdatedPipelineWithVariablesResponse: UseGetReturnData<ResponsePMSPipelineResponseDTO> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      yamlPipeline:
        'pipeline:\n    name: mt\n    identifier: mt\n    projectIdentifier: SanityTest_Triggger\n    orgIdentifier: default\n    tags: {}\n    properties:\n        ci:\n            codebase:\n                connectorRef: testcicd\n                build: <+input>\n    stages:\n        - stage:\n              name: adwaitUser\n              identifier: Coverage_Report\n              type: CI\n              spec:\n                  cloneCodebase: true\n                  execution:\n                      steps:\n                          - step:\n                                type: Run\n                                name: Jest\n                                identifier: Jest\n                                spec:\n                                    connectorRef: harnessImage\n                                    image: <+pipeline.variables.ImageName>\n                                    command: <+input>\n                                    envVariables:\n                                        GIT_BOT_TOKEN: <+pipeline.variables.GIT_BOT_TOKEN>\n                                        GIT_EMAIL: bot@harness.io\n                                        GIT_USER: bot-harness\n                                    resources:\n                                        limits:\n                                            memory: 8Gi\n                                            cpu: 2000m\n                                    privileged: false\n                                description: <+input>\n                  serviceDependencies: []\n                  infrastructure:\n                      type: KubernetesDirect\n                      spec:\n                          connectorRef: account.platformK8s\n                          namespace: <+input>\n              when:\n                  pipelineStatus: Success\n    variables:\n        - name: var1\n          type: String\n          value: <+input>\n        - name: var2\n          type: String\n          default: "1"\n          value: <+input>\n        - name: var3withDefault\n          type: String\n          default: val1\n          value: <+input>.allowedValues(val1,val2)\n',
      resolvedTemplatesPipelineYaml:
        'pipeline:\n    name: mt\n    identifier: mt\n    projectIdentifier: SanityTest_Triggger\n    orgIdentifier: default\n    tags: {}\n    properties:\n        ci:\n            codebase:\n                connectorRef: testcicd\n                build: <+input>\n    stages:\n        - stage:\n              name: adwaitUser\n              identifier: Coverage_Report\n              type: CI\n              spec:\n                  cloneCodebase: true\n                  execution:\n                      steps:\n                          - step:\n                                type: Run\n                                name: Jest\n                                identifier: Jest\n                                spec:\n                                    connectorRef: harnessImage\n                                    image: <+pipeline.variables.ImageName>\n                                    command: <+input>\n                                    envVariables:\n                                        GIT_BOT_TOKEN: <+pipeline.variables.GIT_BOT_TOKEN>\n                                        GIT_EMAIL: bot@harness.io\n                                        GIT_USER: bot-harness\n                                    resources:\n                                        limits:\n                                            memory: 8Gi\n                                            cpu: 2000m\n                                    privileged: false\n                                description: <+input>\n                  serviceDependencies: []\n                  infrastructure:\n                      type: KubernetesDirect\n                      spec:\n                          connectorRef: account.platformK8s\n                          namespace: <+input>\n              when:\n                  pipelineStatus: Success\n    variables:\n        - name: var1\n          type: String\n          value: <+input>\n        - name: var2\n          type: String\n          default: "1"\n          value: <+input>\n        - name: var3withDefault\n          type: String\n          default: val1\n          value: <+input>.allowedValues(val1,val2)\n',
      version: 3,
      gitDetails: {
        objectId: null,
        branch: null,
        repoIdentifier: null,
        rootFolder: null,
        filePath: null
      }
    } as unknown as PMSPipelineResponseDTO,
    metaData: null as unknown as undefined,
    correlationId: '26a25fc1-882a-4499-9059-d1ed08ae12fb'
  }
}

export const GetTemplateFromPipelineResponseArtifacts: UseGetReturnData<ResponseInputSetTemplateResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      inputSetTemplateYaml:
        'pipeline:\n  identifier: "SampleTestArtifactsArchit"\n  stages:\n  - stage:\n      identifier: "s1"\n      type: "Deployment"\n      spec:\n        serviceConfig:\n          serviceDefinition:\n            type: "Kubernetes"\n            spec:\n              artifacts:\n                primary:\n                  type: "DockerRegistry"\n                  spec:\n                    tag: "<+input>"\n        infrastructure:\n          infrastructureDefinition:\n            type: "KubernetesDirect"\n            spec:\n              namespace: "<+input>"\n'
    },
    correlationId: 'ddff4d3f-25f5-4a13-9820-c11dad9bc901'
  }
}

export const GetTemplateFromPipelineResponse: UseGetReturnData<ResponseInputSetTemplateResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      inputSetTemplateYaml:
        'pipeline:\n  identifier: "noinputspipeline1"\n  variables:\n  - name: "newVar"\n    type: "String"\n    value: "<+input>"\n'
    },
    metaData: null as unknown as undefined,
    correlationId: '4e057505-dbd4-4de7-9a9d-43a0364e5825'
  }
}

export const GetParseableTemplateFromPipelineResponse: UseGetReturnData<ResponseInputSetTemplateResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      inputSetTemplateYaml:
        'pipeline:\n  identifier: "testmanifest"\n  stages:\n  - stage:\n      identifier: "stage"\n      type: "Deployment"\n      spec:\n        serviceConfig:\n          serviceDefinition:\n            type: "Kubernetes"\n            spec:\n              manifests:\n              - manifest:\n                  identifier: "s3manifestid"\n                  type: "HelmChart"\n                  spec:\n                    store:\n                      type: "S3"\n                      spec:\n                        connectorRef: "<+input>"\n                        bucketName: "<+input>"\n                        region: "<+input>"\n                    chartName: "<+input>"\n                    chartVersion: "<+input>"\n              - manifest:\n                  identifier: "gcrManifestId"\n                  type: "HelmChart"\n                  spec:\n                    store:\n                      type: "Gcs"\n                      spec:\n                        connectorRef: "<+input>"\n              - manifest:\n                  identifier: "httpManifestIdentifierasdfasdfasdf"\n                  type: "HelmChart"\n                  spec:\n                    chartVersion: "<+input>"\n                    skipResourceVersioning: "<+input>"\n                    commandFlags:\n                    - commandType: "Fetch"\n                      flag: "<+input>"\n              - manifest:\n                  identifier: "gcrIdentifier"\n                  type: "HelmChart"\n                  spec:\n                    store:\n                      type: "Gcs"\n                      spec:\n                        connectorRef: "<+input>"\n                    chartVersion: "<+input>"\n          serviceRef: "<+input>"\n        infrastructure:\n          environmentRef: "<+input>"\n          infrastructureDefinition:\n            type: "KubernetesDirect"\n            spec:\n              connectorRef: "<+input>"\n              namespace: "<+input>"\n              releaseName: "<+input>"\n          infrastructureKey: "<+input>"\n  - stage:\n      identifier: "stage2"\n      type: "Deployment"\n      spec:\n        serviceConfig:\n          serviceDefinition:\n            type: "Kubernetes"\n            spec:\n              artifacts:\n                primary:\n                  type: "DockerRegistry"\n                  spec:\n                    tag: "<+input>"\n              manifests:\n              - manifest:\n                  identifier: "manifestId"\n                  type: "HelmChart"\n                  spec:\n                    store:\n                      type: "S3"\n                      spec:\n                        bucketName: "<+input>"\n                        folderPath: "<+input>"\n          serviceRef: "<+input>"\n        infrastructure:\n          environmentRef: "<+input>"\n  - stage:\n      identifier: "manifeststage"\n      type: "Deployment"\n      spec:\n        serviceConfig:\n          serviceDefinition:\n            type: "Kubernetes"\n            spec:\n              manifests:\n              - manifest:\n                  identifier: "manifest"\n                  type: "K8sManifest"\n                  spec:\n                    store:\n                      type: "Github"\n                      spec:\n                        branch: "<+input>"\n          serviceRef: "<+input>"\n        infrastructure:\n          environmentRef: "<+input>"\n'
    },
    metaData: null as unknown as undefined,
    correlationId: '4e057505-dbd4-4de7-9a9d-43a0364e5825'
  }
}

export const GetParseableParallelArtifactTemplateFromPipelineResponse: UseGetReturnData<ResponseInputSetTemplateResponse> =
  {
    loading: false,
    refetch: jest.fn(),
    error: null,
    data: {
      status: 'SUCCESS',
      data: {
        inputSetTemplateYaml:
          'pipeline:\n  identifier: "artifactpipeline1"\n  stages:\n  - parallel:\n    - stage:\n        identifier: "stage1"\n        type: "Deployment"\n        spec:\n          serviceConfig:\n            serviceDefinition:\n              type: "Kubernetes"\n              spec:\n                artifacts:\n                  primary:\n                    type: "DockerRegistry"\n                    spec:\n                      imagePath: "<+input>"\n                      tag: "<+input>"\n    - stage:\n        identifier: "stage2"\n        type: "Deployment"\n        spec:\n          serviceConfig:\n            serviceDefinition:\n              type: "Kubernetes"\n              spec:\n                artifacts:\n                  primary:\n                    type: "DockerRegistry"\n                    spec:\n                      tag: "<+input>"\n'
      },
      metaData: null as unknown as undefined,
      correlationId: '4e057505-dbd4-4de7-9a9d-43a0364e5825'
    }
  }

export const GetParseableArtifactTemplateFromPipelineResponse: UseGetReturnData<ResponseInputSetTemplateResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      inputSetTemplateYaml:
        'pipeline:\n  identifier: "TestPipelineABC"\n  stages:\n  - stage:\n      identifier: "stagea"\n      type: "Deployment"\n      spec:\n        serviceConfig:\n          serviceDefinition:\n            type: "Kubernetes"\n            spec:\n              manifests:\n              - manifest:\n                  identifier: "sdfds"\n                  type: "HelmChart"\n                  spec:\n                    store:\n                      type: "S3"\n                      spec:\n                        bucketName: "<+input>"\n                        folderPath: "<+input>"\n                    chartName: "<+input>"\n              - manifest:\n                  identifier: "testhelmmanifest"\n                  type: "HelmChart"\n                  spec:\n                    chartName: "<+input>"\n                    chartVersion: "<+input>"\n              - manifest:\n                  identifier: "werewr"\n                  type: "HelmChart"\n                  spec:\n                    chartVersion: "<+input>"\n              artifacts:\n                sidecars:\n                - sidecar:\n                    identifier: "testsideid"\n                    type: "Gcr"\n                    spec:\n                      connectorRef: "<+input>"\n                      imagePath: "<+input>"\n                      registryHostname: "<+input>"\n                      tag: "<+input>"\n                - sidecar:\n                    identifier: "artifactgcrida"\n                    type: "Gcr"\n                    spec:\n                      imagePath: "<+input>"\n                      registryHostname: "<+input>"\n                      tag: "<+input>"\n                - sidecar:\n                    identifier: "sdfsdf"\n                    type: "DockerRegistry"\n                    spec:\n                      tag: "<+input>"\n                primary:\n                  type: "Gcr"\n                  spec:\n                    imagePath: "<+input>"\n                    registryHostname: "<+input>"\n'
    },
    metaData: null as unknown as undefined,
    correlationId: '4e057505-dbd4-4de7-9a9d-43a0364e5825'
  }
}

export const GetManifestTemplateFromPipelineResponse: UseGetReturnData<any> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      inputSetTemplateYaml:
        'pipeline:\n  identifier: "TestPipelineABC"\n  stages:\n  - stage:\n      identifier: "stagea"\n      type: "Deployment"\n      spec:\n        serviceConfig:\n          serviceDefinition:\n            type: "Kubernetes"\n            spec:\n              manifests:\n              - manifest:\n                  identifier: "sdfds"\n                  type: "HelmChart"\n                  spec:\n                    store:\n                      type: "S3"\n                      spec:\n                        bucketName: "<+input>"\n                        folderPath: "<+input>"\n                    chartName: "<+input>"\n                    chartVersion: "<+input>"\n              - manifest:\n                  identifier: "testhelmmanifest"\n                  type: "HelmChart"\n                  spec:\n                    store:\n                      type: "S3"\n                      spec:\n                        bucketName: "<+input>"\n                        folderPath: "<+input>"\n                        region: "<+input>"\n                    chartName: "<+input>"\n                    chartVersion: "<+input>"\n'
    },
    metaData: null as unknown as undefined,
    correlationId: '4e057505-dbd4-4de7-9a9d-43a0364e5825'
  }
}

// updated with 2 additional pipeline variables and 1 runtime input
export const GetUpdatedTemplateFromPipelineResponse: UseGetReturnData<ResponseInputSetTemplateResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      inputSetTemplateYaml:
        'pipeline:\n  identifier: "mt"\n  properties:\n    ci:\n      codebase:\n        build: "<+input>"\n  stages:\n  - stage:\n      identifier: "Coverage_Report"\n      type: "CI"\n      spec:\n        execution:\n          steps:\n          - step:\n              identifier: "Jest"\n              type: "Run"\n              spec:\n                command: "<+input>"\n              description: "<+input>"\n        infrastructure:\n          type: "KubernetesDirect"\n          spec:\n            namespace: "<+input>"\n  variables:\n  - name: "var1"\n    type: "String"\n    value: "<+input>"\n  - name: "var2"\n    type: "String"\n    value: "<+input>"\n  - name: "var3withDefault"\n    type: "String"\n    value: "<+input>.allowedValues(val1,val2)"\n'
    },
    metaData: null as unknown as undefined,
    correlationId: '4e057505-dbd4-4de7-9a9d-43a0364e5825'
  }
}

export const GetTemplateStageVariablesFromPipelineResponse: UseGetReturnData<ResponseInputSetTemplateResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      inputSetTemplateYaml:
        'pipeline:\n  identifier: "pipeline1"\n  stages:\n  - stage:\n      identifier: "stage1"\n      type: "Deployment"\n      spec:\n        infrastructure:\n          environmentRef: "env"\n          infrastructureDefinition:\n            type: "KubernetesDirect"\n            spec:\n              namespace: "<+input>"\n'
    },
    metaData: null as unknown as undefined,
    correlationId: '4e057505-dbd4-4de7-9a9d-43a0364e5825'
  }
}

export const GetTemplateStageVariablesFromPipelineResponse2: UseGetReturnData<ResponseInputSetTemplateResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      inputSetTemplateYaml:
        'pipeline:\n  identifier: "tolerations1"\n  properties:\n    ci:\n      codebase:\n        build: "<+input>"\n  stages:\n  - stage:\n      identifier: "stage1"\n      type: "CI"\n      spec:\n        infrastructure:\n          type: "KubernetesDirect"\n          spec:\n            namespace: "<+input>"\n        execution:\n          steps:\n          - step:\n              identifier: "s"\n              type: "Run"\n              spec:\n                image: "<+input>"\n'
    },
    metaData: null as unknown as undefined,
    correlationId: '4e057505-dbd4-4de7-9a9d-43a0364e5825'
  }
}

export const GetTemplateFromPipelineResponseEmpty: UseGetReturnData<ResponseInputSetTemplateResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      inputSetTemplateYaml: ''
    },
    metaData: null as unknown as undefined,
    correlationId: '4e057505-dbd4-4de7-9a9d-43a0364e5825'
  }
}

export const GetMergeInputSetFromPipelineTemplateWithListInputResponse: UseGetReturnData<ResponseMergeInputSetResponse> =
  {
    loading: false,
    refetch: jest.fn(),
    error: null,
    data: {
      status: 'SUCCESS',
      data: {
        inputSetTemplateYaml:
          'pipeline:\n  identifier: "p1"\n  stages:\n  - stage:\n      identifier: "stage1"\n      type: "Deployment"\n      spec:\n        infrastructure:\n          infrastructureDefinition:\n            type: "KubernetesDirect"\n            spec:\n              namespace: "<+input>"\n              releaseName: "<+input>"\n'
      },
      metaData: null,
      correlationId: '2197e87f-64d4-44a4-91c7-607337cf4394'
    } as unknown as ResponseMergeInputSetResponse
  }

export const GetMergeInputSetArtifactTemplateWithListInputResponse: UseGetReturnData<ResponseMergeInputSetResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      inputSetTemplateYaml:
        'pipeline:\n  identifier: "TestPipelineABC"\n  stages:\n  - stage:\n      identifier: "stagea"\n      type: "Deployment"\n      spec:\n        serviceConfig:\n          serviceDefinition:\n            type: "Kubernetes"\n            spec:\n              manifests:\n              - manifest:\n                  identifier: "sdfds"\n                  type: "HelmChart"\n                  spec:\n                    store:\n                      type: "S3"\n                      spec:\n                        bucketName: "<+input>"\n                        folderPath: "<+input>"\n                    chartName: "<+input>"\n              - manifest:\n                  identifier: "testhelmmanifest"\n                  type: "HelmChart"\n                  spec:\n                    chartName: "<+input>"\n                    chartVersion: "<+input>"\n              - manifest:\n                  identifier: "werewr"\n                  type: "HelmChart"\n                  spec:\n                    chartVersion: "<+input>"\n              artifacts:\n                sidecars:\n                - sidecar:\n                    identifier: "testsideid"\n                    type: "Gcr"\n                    spec:\n                      connectorRef: "<+input>"\n                      imagePath: "<+input>"\n                      registryHostname: "<+input>"\n                      tag: "<+input>"\n                - sidecar:\n                    identifier: "artifactgcrida"\n                    type: "Gcr"\n                    spec:\n                      imagePath: "<+input>"\n                      registryHostname: "<+input>"\n                      tag: "<+input>"\n                - sidecar:\n                    identifier: "sdfsdf"\n                    type: "DockerRegistry"\n                    spec:\n                      tag: "<+input>"\n                primary:\n                  type: "Gcr"\n                  spec:\n                    imagePath: "<+input>"\n                    registryHostname: "<+input>"\n'
    },
    metaData: null,
    correlationId: '2197e87f-64d4-44a4-91c7-607337cf4394'
  } as unknown as ResponseMergeInputSetResponse
}

export const GetMergeManifestInputSetFromPipelineTemplateWithListInputResponse: UseGetReturnData<ResponseMergeInputSetResponse> =
  {
    loading: false,
    refetch: jest.fn(),
    error: null,
    data: {
      status: 'SUCCESS',
      data: {
        inputSetTemplateYaml:
          'pipeline:\n  identifier: "TestPipelineABC"\n  stages:\n  - stage:\n      identifier: "stagea"\n      type: "Deployment"\n      spec:\n        serviceConfig:\n          serviceDefinition:\n            type: "Kubernetes"\n            spec:\n              manifests:\n              - manifest:\n                  identifier: "sdfds"\n                  type: "HelmChart"\n                  spec:\n                    store:\n                      type: "S3"\n                      spec:\n                        bucketName: "<+input>"\n                        folderPath: "<+input>"\n                    chartName: "<+input>"\n                    chartVersion: "<+input>"\n              - manifest:\n                  identifier: "testhelmmanifest"\n                  type: "HelmChart"\n                  spec:\n                    store:\n                      type: "S3"\n                      spec:\n                        bucketName: "<+input>"\n                        folderPath: "<+input>"\n                        region: "<+input>"\n                    chartName: "<+input>"\n                    chartVersion: "<+input>"\n'
      },
      metaData: null,
      correlationId: '2197e87f-64d4-44a4-91c7-607337cf4394'
    } as unknown as ResponseMergeInputSetResponse
  }

export const ConnectorResponse: UseGetReturnData<ResponseConnectorResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      connector: {
        name: 'test',
        identifier: 'test',
        description: '',
        orgIdentifier: 'default',
        projectIdentifier: 'project1',
        tags: {},
        type: 'Github',
        spec: {
          url: 'github.com/account',
          authentication: {
            type: 'Http',
            spec: {
              type: 'UsernamePassword',
              spec: {
                username: 'username',
                usernameRef: null,
                passwordRef: 'HARNESS_IMAGE_PASSWORD'
              }
            }
          },
          apiAccess: null,
          delegateSelectors: [],
          type: 'Account'
        }
      },
      createdAt: 1602062958274,
      lastModifiedAt: 1602062958274
    },
    correlationId: 'e1841cfc-9ed5-4f7c-a87b-c9be1eeaae34'
  }
}
export const RepoConnectorResponse: UseGetReturnData<ResponseConnectorResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      connector: {
        name: 'repo-connector',
        identifier: 'repoconnector',
        description: '',
        orgIdentifier: 'default',
        projectIdentifier: 'project1',
        tags: {},
        type: 'Github',
        spec: {
          url: 'https://github.com/account',
          authentication: {
            type: 'Http',
            spec: {
              type: 'UsernamePassword',
              spec: {
                username: 'username',
                usernameRef: null,
                passwordRef: 'HARNESS_IMAGE_PASSWORD'
              }
            }
          },
          apiAccess: null,
          delegateSelectors: [],
          type: 'Repo'
        }
      },
      createdAt: 1621454553668,
      lastModifiedAt: 1621454553245,
      status: {
        status: 'FAILURE',
        errorSummary: ' No Delegate Found ( No Delegate Eligible to perform the request)',
        errors: [
          {
            reason: ' No Delegate Found',
            message: ' No Delegate Eligible to perform the request',
            code: 463
          }
        ],
        testedAt: 1621454555821,
        lastTestedAt: 0,
        lastConnectedAt: 0
      },
      activityDetails: {
        lastActivityTime: 1621454554101
      },
      harnessManaged: false,
      gitDetails: {
        objectId: null as unknown as undefined,
        branch: null as unknown as undefined,
        repoIdentifier: null as unknown as undefined,
        rootFolder: null as unknown as undefined,
        filePath: null as unknown as undefined
      }
    },
    correlationId: 'e1841cfc-9ed5-4f7c-a87b-c9be1eeaae34'
  }
}

export const GetInputSetsResponse: UseGetReturnData<ResponsePageInputSetSummaryResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      totalPages: 1,
      totalItems: 1,
      pageItemCount: 1,
      pageSize: 100,
      content: [
        {
          identifier: 'test',
          name: 'test',
          pipelineIdentifier: 'pipeline1',
          inputSetType: 'INPUT_SET',
          tags: {},
          gitDetails: {
            objectId: null as unknown as undefined,
            branch: null as unknown as undefined,
            repoIdentifier: null as unknown as undefined,
            rootFolder: null as unknown as undefined,
            filePath: null as unknown as undefined
          }
        }
      ],
      pageIndex: 0,
      empty: false
    },
    correlationId: 'dbc7238c-380f-4fe0-b160-a29510cfe0c8'
  }
}

export const GetInputSetsResponse2: UseGetReturnData<ResponsePageInputSetSummaryResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      totalPages: 1,
      totalItems: 1,
      pageItemCount: 1,
      pageSize: 100,
      content: [
        {
          identifier: 'inputset1',
          name: 'inputset1',
          pipelineIdentifier: 'tolerations1',
          inputSetType: 'INPUT_SET',
          tags: {},
          createdAt: 1654886025540,
          lastUpdatedAt: 1654886025540,
          isOutdated: false,
          entityValidityDetails: {
            valid: true
          },
          storeType: 'INLINE'
        }
      ],
      pageIndex: 0,
      empty: false
    },
    correlationId: 'dbc7238c-380f-4fe0-b160-a29510cfe0c8'
  }
}

export const GetManifestInputSetsResponse: UseGetReturnData<ResponsePageInputSetSummaryResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      totalPages: 1,
      totalItems: 1,
      pageItemCount: 1,
      pageSize: 100,
      content: [
        {
          identifier: 'test',
          name: 'test',
          pipelineIdentifier: ' TestPipeline-ABC',
          inputSetType: 'INPUT_SET',
          tags: {},
          gitDetails: {
            objectId: null as unknown as undefined,
            branch: null as unknown as undefined,
            repoIdentifier: null as unknown as undefined,
            rootFolder: null as unknown as undefined,
            filePath: null as unknown as undefined
          }
        }
      ],
      pageIndex: 0,
      empty: false
    },
    correlationId: 'dbc7238c-380f-4fe0-b160-a29510cfe0c8'
  }
}

export const GetEnvironmentList: UseGetReturnData<ResponseListEnvironmentResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: [
      {
        environment: {
          accountId: 'accountId',
          orgIdentifier: 'default',
          projectIdentifier: 'p1',
          identifier: 'prod',
          name: 'prod',
          description: null as unknown as undefined,
          color: '#0063F7',
          type: 'Production',
          deleted: false,
          tags: {}
        }
      }
    ],
    correlationId: 'dbc7238c-380f-4fe0-b160-a29510cfe0c8'
  }
}
export const GetTriggerListForTargetResponse: UseGetReturnData<ResponsePageNGTriggerDetailsResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      totalPages: 1,
      totalItems: 6,
      pageItemCount: 6,
      pageSize: 25,
      content: [
        {
          name: 'AllValues123',
          identifier: 'AllValues',
          description: 'desc',
          type: 'Webhook',
          executions: [2, 3, 4, 5, 4, 3, 2],
          enabled: true,
          yaml: 'trigger:\n  name: AllValues123\n  identifier: AllValues\n  description: desc\n  target:\n    targetIdentifier: p1\n    type: Pipeline\n    spec:\n      runtimeInputYaml: |\n        pipeline:\n          identifier: p1\n          stages:\n            - stage:\n                identifier: stage1\n                type: Deployment\n                spec:\n                  infrastructure:\n                    infrastructureDefinition:\n                      type: KubernetesDirect\n                      spec:\n                        namespace: newNameSpaces\n                        releaseName: "22"\n  source:\n    type: Webhook\n    spec:\n      type: GITHUB\n      spec:\n        repoUrl: repoUrlss1\n        event: Pull Request\n        actions:\n          - closed\n          - edited\n          - opened\n        payloadConditions:\n          - key: sourceBranch\n            operator: Equals\n            value: "123"\n          - key: targetBranch\n            operator: Regex\n            value: Regex\n          - key: abcd\n            operator: In\n            value: abc\n          - key: defg\n            operator: NotIn\n            value: def\n'
        },
        {
          name: 'test1',
          identifier: 'test1',
          type: 'Webhook',
          lastTriggerExecutionDetails: {
            lastExecutionTime: 1607637774407,
            lastExecutionSuccessful: true
          },
          enabled: true,
          webhookUrl: 'http://localhost:12001/api/webhook/trigger?accountIdentifier=accountIdentifier',
          tags: {
            tag1: '',
            tag2: 'val2'
          },
          yaml: 'trigger:\n  name: test1\n  identifier: test1\n  target:\n    targetIdentifier: p1\n    type: Pipeline\n    spec:\n      runtimeInputYaml: |\n        pipeline:\n          identifier: p1\n          stages:\n            - stage:\n                identifier: stage1\n                type: Deployment\n                spec:\n                  infrastructure:\n                    infrastructureDefinition:\n                      type: KubernetesDirect\n                      spec:\n                        namespace: namespace\n                        releaseName: releaseName\n  source:\n    type: Webhook\n    spec:\n      type: GITHUB\n      spec:\n        repoUrl: test\n        event: Pull Request\n        actions: []\n'
        },
        {
          name: 'trigger-2',
          identifier: 'trigger2',
          type: 'Webhook',
          enabled: false,
          webhookUrl: 'http://localhost:12001/api/webhook/trigger?accountIdentifier=accountIdentifier',
          yaml: 'trigger:\n  name: trigger-2\n  identifier: trigger2\n  target:\n    targetIdentifier: p1\n    type: Pipeline\n    spec:\n      runtimeInputYaml: |\n        pipeline: {}\n  source:\n    type: Webhook\n    spec:\n      type: GITHUB\n      spec:\n        repoUrl: "12"\n        event: Pull Request\n        actions:\n          - closed\n          - edited\n          - labeled\n        payloadConditions:\n          - key: sourceBranch\n            operator: Regex\n            value: abc\n          - key: targetBranch\n            operator: Contains\n            value: abc\n'
        },
        {
          name: 'testcustomtrigger1',
          identifier: 'testcustomtrigger1',
          type: 'Webhook',
          webhookDetails: {
            webhookSecret: 'token',
            webhookSourceRepo: 'CUSTOM'
          },
          webhookUrl: 'http://localhost:12001/api/webhook/trigger?accountIdentifier=accountIdentifier',
          tags: {},
          executions: [0, 0, 0, 0, 0, 0, 0],
          yaml: '',
          enabled: false
        },
        {
          name: 'sdfsdfdsfdfd',
          identifier: 'sdfsdfdsfdfd',
          type: 'Manifest',
          enabled: false,
          yaml: 'trigger:\n    name: sdfsdfdsfdfd\n    identifier: sdfsdfdsfdfd\n    enabled: true\n    tags: {}\n    orgIdentifier: default\n    projectIdentifier: test\n    pipelineIdentifier: TestPipelineABC\n    source:\n        type: Manifest\n        spec:\n            stageIdentifier: stagea\n            manifestRef: testhelmmanifest\n            type: HelmChart\n            spec:\n                store:\n                    type: S3\n                    spec:\n                        connectorRef: testecr2\n                        bucketName: ""\n                        folderPath: sdfds\n                        region: ""\n                chartName: sdfds\n                chartVersion: <+trigger.manifest.version>\n                helmVersion: V2\n                skipResourceVersioning: false\n                eventConditions: []\n    inputYaml: |\n        pipeline:\n            identifier: TestPipelineABC\n            stages:\n                - stage:\n                      identifier: stagea\n                      type: Deployment\n                      spec:\n                          serviceConfig:\n                              serviceDefinition:\n                                  type: Kubernetes\n                                  spec:\n                                      manifests:\n                                          - manifest:\n                                                identifier: sdfds\n                                                type: HelmChart\n                                                spec:\n                                                    store:\n                                                        type: S3\n                                                        spec:\n                                                            bucketName: ""\n                                                            folderPath: ""\n                                                    chartName: ""\n                                                    chartVersion: ""\n                                          - manifest:\n                                                identifier: testhelmmanifest\n                                                type: HelmChart\n                                                spec:\n                                                    store:\n                                                        type: S3\n                                                        spec:\n                                                            connectorRef: testecr2\n                                                            bucketName: ""\n                                                            folderPath: sdfds\n                                                            region: ""\n                                                    chartName: sdfds\n                                                    chartVersion: <+trigger.manifest.version>\n                                                    helmVersion: V2\n                                                    skipResourceVersioning: false\n'
        },
        {
          name: 'gcr-manifest',
          identifier: 'gcrmanifest',
          type: 'Manifest',
          triggerStatus: {
            pollingSubscriptionStatus: null as unknown as undefined,
            validationStatus: {
              statusResult: 'FAILED',
              detailedMessage:
                'Exception while applying ManifestTriggerValidation for Trigger: px7xd_BFRCi-pfWPYXVjvw:harness:mtran:testmanifest:gcrmanifest. Exception: Manifest With Given StageIdentifier and ManifestRef in Trigger does not exist in Pipeline'
            },
            webhookAutoRegistrationStatus: null as unknown as undefined
          },
          buildDetails: {
            buildType: 'io.harness.ngtriggers.beans.source.artifact.HelmManifestSpec'
          },
          tags: {},
          executions: [0, 0, 0, 0, 0, 0, 0],
          yaml: 'trigger:\n    name: gcr-manifest\n    identifier: gcrmanifest\n    enabled: true\n    tags: {}\n    orgIdentifier: harness\n    projectIdentifier: mtran\n    pipelineIdentifier: testmanifest\n    source:\n        type: Manifest\n        spec:\n            stageIdentifier: stage\n            manifestRef: gcrIdentifier\n            type: HelmChart\n            spec:\n                store:\n                    type: Gcs\n                    spec:\n                        connectorRef: account.gcpconnector\n                        bucketName: sdaf\n                        folderPath: chartPath\n                chartName: chartName\n                chartVersion: <+trigger.manifest.version>\n                helmVersion: V2\n                skipResourceVersioning: false\n                eventConditions: []\n    inputYaml: |\n        pipeline:\n            identifier: testmanifest\n            stages:\n                - stage:\n                      identifier: stage\n                      type: Deployment\n                      spec:\n                          serviceConfig:\n                              serviceDefinition:\n                                  type: Kubernetes\n                                  spec:\n                                      manifests:\n                                          - manifest:\n                                                identifier: s3manifestid\n                                                type: HelmChart\n                                                spec:\n                                                    store:\n                                                        type: S3\n                                                        spec:\n                                                            connectorRef: ""\n                                                            region: ""\n                                                            bucketName: ""\n                                                    chartVersion: ""\n                                                    chartName: ""\n                                          - manifest:\n                                                identifier: gcrManifestId\n                                                type: HelmChart\n                                                spec:\n                                                    store:\n                                                        type: Gcs\n                                                        spec:\n                                                            connectorRef: ""\n                                          - manifest:\n                                                identifier: gcrIdentifier\n                                                type: HelmChart\n                                                spec:\n                                                    store:\n                                                        type: Gcs\n                                                        spec:\n                                                            connectorRef: account.gcpconnector\n                                                            bucketName: sdaf\n                                                            folderPath: chartPath\n                                                    chartName: chartName\n                                                    chartVersion: <+trigger.manifest.version>\n                                                    helmVersion: V2\n                                                    skipResourceVersioning: false\n                              serviceRef: ""\n                          infrastructure:\n                              environmentRef: ""\n                              infrastructureDefinition:\n                                  type: KubernetesDirect\n                                  spec:\n                                      connectorRef: ""\n                                      namespace: ""\n                                      releaseName: ""\n                              infrastructureKey: ""\n                - stage:\n                      identifier: stage2\n                      type: Deployment\n                      spec:\n                          serviceConfig:\n                              stageOverrides:\n                                  manifests:\n                                      - manifest:\n                                            identifier: s3manifestid\n                                            type: HelmChart\n                                            spec:\n                                                store:\n                                                    type: S3\n                                                    spec:\n                                                        folderPath: ""\n                                                chartVersion: ""\n                              serviceDefinition:\n                                  type: Kubernetes\n                                  spec:\n                                      artifacts:\n                                          primary:\n                                              type: DockerRegistry\n                                              spec:\n                                                  tag: ""\n                                      manifests:\n                                          - manifest:\n                                                identifier: manifestId\n                                                type: HelmChart\n                                                spec:\n                                                    store:\n                                                        type: S3\n                                                        spec:\n                                                            bucketName: ""\n                                                            folderPath: ""\n                              serviceRef: ""\n                          infrastructure:\n                              environmentRef: ""\n                - stage:\n                      identifier: manifeststage\n                      type: Deployment\n                      spec:\n                          serviceConfig:\n                              serviceDefinition:\n                                  type: Kubernetes\n                                  spec:\n                                      manifests:\n                                          - manifest:\n                                                identifier: manifest\n                                                type: K8sManifest\n                                                spec:\n                                                    store:\n                                                        type: Github\n                                                        spec:\n                                                            branch: ""\n                              serviceRef: ""\n                          infrastructure:\n                              environmentRef: ""\n',
          webhookUrl: '',
          enabled: false
        },
        {
          name: 'H1',
          identifier: 'H1',
          type: 'Manifest',
          triggerStatus: {
            pollingSubscriptionStatus: {
              statusResult: 'FAILED',
              detailedMessage: 'Failed to subscribe with error: error'
            },
            validationStatus: {
              statusResult: 'SUCCESS',
              detailedMessage: null as unknown as undefined
            },
            webhookAutoRegistrationStatus: null as unknown as undefined
          },
          buildDetails: {
            buildType: 'io.harness.ngtriggers.beans.source.artifact.HelmManifestSpec'
          },
          tags: {},
          executions: [0, 0, 0, 0, 0, 0, 0],
          yaml: 'trigger:\n    name: H1\n    identifier: H1\n    enabled: true\n    tags: {}\n    orgIdentifier: default\n    projectIdentifier: trigger\n    pipelineIdentifier: pipeline\n    source:\n        type: Manifest\n        spec:\n            stageIdentifier: stage1\n            manifestRef: m1\n            type: HelmChart\n            spec:\n                store:\n                    type: Http\n                    spec:\n                        connectorRef: test\n                chartName: c1\n                chartVersion: <+trigger.manifest.version>\n                helmVersion: V2\n                skipResourceVersioning: false\n                eventConditions: []\n    inputYaml: |\n        pipeline:\n            identifier: pipeline\n            stages:\n                - stage:\n                      identifier: stage1\n                      type: Deployment\n                      spec:\n                          serviceConfig:\n                              serviceDefinition:\n                                  type: Kubernetes\n                                  spec:\n                                      manifests:\n                                          - identifier: m1\n                                            type: HelmChart\n                                            spec:\n                                                store:\n                                                    type: Http\n                                                    spec:\n                                                        connectorRef: test\n                                                chartName: c1\n                                                chartVersion: <+trigger.manifest.version>\n                                                helmVersion: V2\n                                                skipResourceVersioning: false\n',
          webhookUrl: '',
          enabled: true
        },
        {
          name: 'webhookAutoRegistrationFailed',
          identifier: 'webhookautoregistrationfailed',
          type: 'Webhook',
          triggerStatus: {
            webhookAutoRegistrationStatus: {
              registrationResult: 'FAILED',
              detailedMessage: 'Failed to register webhook with error: error'
            }
          },
          buildDetails: {
            buildType: 'io.harness.ngtriggers.beans.source.artifact.HelmManifestSpec'
          },
          tags: {},
          executions: [0, 0, 0, 0, 0, 0, 0],
          yaml: 'trigger:\n    name: H1\n    identifier: H1\n    enabled: true\n    tags: {}\n    orgIdentifier: default\n    projectIdentifier: trigger\n    pipelineIdentifier: pipeline\n    source:\n        type: Manifest\n        spec:\n            stageIdentifier: stage1\n            manifestRef: m1\n            type: HelmChart\n            spec:\n                store:\n                    type: Http\n                    spec:\n                        connectorRef: test\n                chartName: c1\n                chartVersion: <+trigger.manifest.version>\n                helmVersion: V2\n                skipResourceVersioning: false\n                eventConditions: []\n    inputYaml: |\n        pipeline:\n            identifier: pipeline\n            stages:\n                - stage:\n                      identifier: stage1\n                      type: Deployment\n                      spec:\n                          serviceConfig:\n                              serviceDefinition:\n                                  type: Kubernetes\n                                  spec:\n                                      manifests:\n                                          - identifier: m1\n                                            type: HelmChart\n                                            spec:\n                                                store:\n                                                    type: Http\n                                                    spec:\n                                                        connectorRef: test\n                                                chartName: c1\n                                                chartVersion: <+trigger.manifest.version>\n                                                helmVersion: V2\n                                                skipResourceVersioning: false\n',
          webhookUrl: '',
          enabled: true
        }
      ],
      pageIndex: 0,
      empty: false
    },
    metaData: null as unknown as undefined,
    correlationId: 'bd8be6bf-2fdb-4df1-8a09-ba3b56b6b3e0'
  }
}

export const GetDeleteTriggerResponse = {
  status: 'SUCCESS',
  data: true,
  metaData: null,
  correlationId: '60982855-534b-4997-9bd5-a30b1f5964df'
}
