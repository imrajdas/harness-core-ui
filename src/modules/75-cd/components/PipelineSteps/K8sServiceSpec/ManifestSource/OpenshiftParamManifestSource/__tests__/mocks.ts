/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

export const manifests = [
  {
    manifest: {
      identifier: 'OpenShiftParams',
      type: 'OpenshiftParam',
      spec: {
        store: {
          type: 'Git',
          spec: {
            connectorRef: '<+input>',
            gitFetchType: 'Branch',
            paths: '<+input>',
            repoName: '<+input>',
            branch: '<+input>'
          }
        }
      }
    }
  },
  {
    manifest: {
      identifier: 'manifestidentifier',
      type: 'OpenShiftParams',
      spec: {
        store: {
          type: 'InheritFromManifest',
          spec: {
            paths: ['./filepath']
          }
        }
      }
    }
  },
  {
    manifest: {
      identifier: 'manifestIdentifier',
      type: 'OpenShiftParams',
      spec: {
        store: {
          type: 'CustomeRemote',
          spec: {
            filePath: 'file-path',
            extractionScript: 'script',
            delegateSelectors: ['delegate-selector']
          }
        }
      }
    }
  }
]

export const template = {
  manifests: [
    {
      manifest: {
        identifier: 'OpenShiftParams',
        type: 'OpenshiftParam',
        spec: {
          store: {
            type: 'Git',
            spec: {
              connectorRef: '<+input>',
              gitFetchType: 'Branch',
              paths: '<+input>',
              repoName: '<+input>',
              branch: '<+input>'
            }
          }
        }
      }
    },
    {
      manifest: {
        identifier: 'manifestidentifier',
        type: 'OpenShiftParams',
        spec: {
          store: {
            type: 'InheritFromManifest',
            spec: {
              paths: ['./filepath']
            }
          }
        }
      }
    },
    {
      manifest: {
        identifier: 'ident',
        type: 'OpenShiftParams',
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
