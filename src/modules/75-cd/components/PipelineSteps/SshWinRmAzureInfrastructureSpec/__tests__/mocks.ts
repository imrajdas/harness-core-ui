/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { UseGetReturnData } from '@common/utils/testUtils'
import type {
  ResponseAzureClustersDTO,
  ResponseAzureResourceGroupsDTO,
  ResponseAzureSubscriptionsDTO,
  ResponseAzureTagsDTO
} from 'services/cd-ng'

export const connectorResponse = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      connector: {
        name: 'connectorRef',
        identifier: 'connectorRef',
        description: '',
        tags: {},
        type: 'Azure',
        spec: {
          credential: {
            type: 'ManualConfig',
            spec: {
              masterUrl: 'master',
              auth: { type: 'UsernamePassword', spec: { username: 'usr', passwordRef: 'account.test' } }
            }
          }
        }
      }
    }
  }
}

export const connectorsResponse = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      content: [
        {
          connector: {
            name: 'AWS',
            identifier: 'AWS',
            description: '',
            orgIdentifier: 'undefined',
            projectIdentifier: 'undefined',
            tags: {},
            type: 'Azure',
            spec: {
              credential: {
                crossAccountAccess: null,
                type: 'InheritFromDelegate',
                spec: { delegateSelector: 'qwe' }
              }
            }
          },
          createdAt: 1608697269523,
          lastModifiedAt: 1608697269523,
          status: null,
          harnessManaged: false
        },
        {
          connector: {
            name: 'Git CTR',
            identifier: 'Git_CTR',
            description: 'To connect to Git',
            orgIdentifier: 'undefined',
            projectIdentifier: 'undefined',
            tags: { git: '' },
            type: 'Git',
            spec: {
              url: 'https://github.com',
              branchName: '',
              type: 'Http',
              connectionType: 'Repo',
              spec: { username: 'admin', passwordRef: 'account.sec1' },
              gitSync: { enabled: false, customCommitAttributes: null, syncEnabled: false }
            }
          },
          createdAt: 1608679004757,
          lastModifiedAt: 1608679004757,
          status: null,
          harnessManaged: false
        }
      ]
    }
  }
}

export const resourceGroupsResponse: UseGetReturnData<ResponseAzureResourceGroupsDTO> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: { resourceGroups: [{ resourceGroup: 'rg1' }, { resourceGroup: 'rg2' }] },
    correlationId: '33715e30-e0cd-408c-ad82-a412161733c2'
  }
}

export const subscriptionsResponse: UseGetReturnData<ResponseAzureSubscriptionsDTO> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      subscriptions: [
        { subscriptionId: 'sub1', subscriptionName: 'subscription1' },
        { subscriptionId: 'sub2', subscriptionName: 'subscription2' }
      ]
    },
    correlationId: '33715e30-e0cd-408c-ad82-a412161733c2'
  }
}

export const clustersResponse: UseGetReturnData<ResponseAzureClustersDTO> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: { clusters: [{ cluster: 'us-west2/abc' }, { cluster: 'us-west1-b/qwe' }] },
    correlationId: '33715e30-e0cd-408c-ad82-a412161733c2'
  }
}

export const tagsResponse: UseGetReturnData<ResponseAzureTagsDTO> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      tags: [{ tag: 'tag1' }, { tag: 'tag2' }]
    },
    correlationId: '33715e30-e0cd-408c-ad82-a412161733c2'
  }
}

export const mockSecret = {
  status: 'SUCCESS',
  data: {
    secret: {
      type: 'SecretText',
      name: 'connectorPass',
      identifier: 'connectorPass',
      tags: {},
      description: '',
      spec: { secretManagerIdentifier: 'harnessSecretManager' }
    },
    createdAt: 1606373702954,
    updatedAt: 1606373702954,
    draft: false
  },
  metaData: null,
  correlationId: '0346aa2b-290e-4892-a7f0-4ad2128c9829'
}

export const mockListSecrets = {
  status: 'SUCCESS',
  data: {
    totalPages: 1,
    totalItems: 1,
    pageItemCount: 1,
    pageSize: 100,
    content: [
      {
        secret: {
          type: 'SecretFile',
          name: 'nfile1',
          identifier: 'nfile1',
          tags: {},
          description: 'desc',
          spec: {
            secretManagerIdentifier: 'vault1'
          }
        },
        createdAt: 1602137372269,
        updatedAt: 1602137372269,
        draft: false
      }
    ],
    pageIndex: 0,
    empty: false
  },
  metaData: null,
  correlationId: 'eae05856-9cc0-450d-9d18-b459320311ff'
}
