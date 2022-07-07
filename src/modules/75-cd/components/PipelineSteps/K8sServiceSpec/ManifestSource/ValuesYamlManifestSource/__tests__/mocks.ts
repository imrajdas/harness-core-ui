/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

export const manifests = [
  {
    manifest: {
      identifier: 'ValuesManifest',
      type: 'Values',
      spec: {
        store: {
          type: 'Git',
          spec: {
            connectorRef: 'git_final_test',
            gitFetchType: 'Branch',
            paths: ['./'],
            branch: '<+input>'
          }
        }
      }
    }
  },
  {
    manifest: {
      identifier: 'ValuesManifest',
      type: 'Values',
      spec: {
        store: {
          type: 'InheritFromManifest',
          spec: {
            paths: ['./filepath']
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
        identifier: 'ValuesManifest',
        type: 'Values',
        spec: {
          store: {
            type: 'Git',
            spec: {
              connectorRef: 'git_final_test',
              gitFetchType: 'Branch',
              paths: ['./'],
              branch: '<+input>'
            }
          }
        }
      }
    },
    {
      manifest: {
        identifier: 'ValuesManifest',
        type: 'Values',
        spec: {
          store: {
            type: 'InheritFromManifest',
            spec: {
              paths: ['./filepath']
            }
          }
        }
      }
    }
  ]
}

export const path = 'stages[0].stage.spec.serviceConfig.serviceDefinition.spec'

export const stageIdentifier = 'STG1'
