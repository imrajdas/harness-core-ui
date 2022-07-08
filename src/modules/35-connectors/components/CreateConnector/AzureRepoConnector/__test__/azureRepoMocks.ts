/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { ConnectorInfoDTO, ResponseBoolean } from 'services/cd-ng'

const tokenRef = 'account.azureRepoPassword'

export const backButtonMock: ConnectorInfoDTO = {
  name: 'dummy AzureRepo name',
  identifier: 'dummyAzureRepoIdentifier',
  description: 'dummy AzureRepo description',
  orgIdentifier: '',
  projectIdentifier: '',
  tags: {},
  type: 'AzureRepo',
  spec: {
    url: 'https://dev.azure.com/dev',
    authentication: {
      type: 'Http',
      spec: {
        type: 'UsernameToken',
        spec: { username: 'dev', usernameRef: null, tokenRef }
      }
    },
    apiAccess: null,
    type: 'Account',
    validationRepo: 'test'
  }
}

export const usernameToken: ConnectorInfoDTO = {
  name: 'AzureRepoWorking1',
  identifier: 'asasas',
  description: 'connector before demo',
  orgIdentifier: undefined,
  projectIdentifier: undefined,
  tags: {},
  type: 'AzureRepo',
  spec: {
    delegateSelectors: ['dummyDelegateSelector'],
    type: 'Account',
    url: 'https://dev.azure.com/azureRepoOrg',
    validationRepo: 'test',
    authentication: {
      type: 'Http',
      spec: {
        type: 'UsernameToken',
        spec: { username: 'dev', usernameRef: undefined, tokenRef }
      }
    }
  }
}

export const usernameTokenWithAPIAccess: ConnectorInfoDTO = {
  name: 'AzureRepoWorkingWithApiAccess',
  identifier: 'AzureRepoWorking',
  description: 'AzureRepo description',
  orgIdentifier: undefined,
  projectIdentifier: undefined,
  tags: {},
  type: 'AzureRepo',
  spec: {
    delegateSelectors: ['dummyDelegateSelector'],
    type: 'Account',
    url: 'https://dev.azure.com/azureRepoOrg',
    validationRepo: 'test',
    authentication: {
      type: 'Http',
      spec: {
        type: 'UsernameToken',
        spec: { username: 'dev', usernameRef: undefined, tokenRef }
      }
    },
    apiAccess: {
      type: 'Token',
      spec: { tokenRef }
    }
  }
}

export const mockSecret = {
  status: 'SUCCESS',
  data: {
    secret: {
      type: 'SecretText',
      name: 'azureRepoPassword',
      identifier: 'azureRepoPassword',
      tags: {},
      description: 'for azureRepo connector',
      spec: { secretManagerIdentifier: 'harnessSecretManager', valueType: 'Inline', value: null }
    },
    createdAt: 1608671838510,
    updatedAt: 1608671838510,
    draft: false
  },
  metaData: null,
  correlationId: '349437d7-c6f8-4e14-9b62-64d9acec688d'
}

export const mockResponse: ResponseBoolean = {
  status: 'SUCCESS',
  data: true,
  metaData: {},
  correlationId: ''
}
