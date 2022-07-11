/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

export const manifests = [
  {
    manifest: {
      identifier: 'OpenShift',
      type: 'OpenshiftTemplate',
      spec: {
        store: {
          type: 'Git',
          spec: {
            connectorRef: '<+input>',
            gitFetchType: 'Branch',
            paths: ['./'],
            repoName: '<+input>',
            branch: 'branch'
          }
        },
        skipResourceVersioning: '<+input>'
      }
    }
  },
  {
    manifest: {
      identifier: 'OpenShift',
      type: 'OpenshiftTemplate',
      spec: {
        paramsPaths: ['params-path'],
        store: {
          type: 'Github',
          spec: {
            connectorRef: '<+input>',
            gitFetchType: 'Branch',
            paths: ['./'],
            repoName: '<+input>',
            branch: 'branch'
          }
        },
        skipResourceVersioning: '<+input>'
      }
    }
  },
  {
    manifest: {
      identifier: 'manifestIdentifier',
      type: 'OpenshiftTemplate',
      spec: {
        store: {
          type: 'CustomeRemote',
          spec: {
            filePath: 'file-path',
            extractionScript: 'script',
            delegateSelectors: ['delegate-selector']
          }
        },
        skipResourceVersioning: false
      }
    }
  }
]

export const template = {
  manifests: [
    {
      manifest: {
        identifier: 'OpenShift',
        type: 'OpenshiftTemplate',
        spec: {
          store: {
            type: 'Git',
            spec: {
              connectorRef: '<+input>',
              gitFetchType: 'Branch',
              paths: ['./'],
              repoName: '<+input>',
              branch: 'branch'
            }
          },
          skipResourceVersioning: '<+input>'
        }
      }
    },
    {
      manifest: {
        identifier: 'OpenShift',
        type: 'OpenshiftTemplate',
        spec: {
          paramsPaths: ['params-path'],
          store: {
            type: 'Github',
            spec: {
              connectorRef: '<+input>',
              gitFetchType: 'Branch',
              paths: ['./'],
              repoName: '<+input>',
              branch: 'branch'
            }
          },
          skipResourceVersioning: '<+input>'
        }
      }
    },
    {
      manifest: {
        identifier: 'ident',
        type: 'K8sManifest',
        spec: {
          store: {
            type: 'CustomeRemote',
            spec: {
              filePath: '<+input>',
              extractionScript: 'script',
              delegateSelectors: ['delegate-selector']
            }
          }
        }
      }
    }
  ]
}

export const path = 'stages[0].stage.spec.serviceConfig.serviceDefinition.spec'

export const stageIdentifier = 'STG1'
