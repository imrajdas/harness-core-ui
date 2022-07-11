/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { set } from 'lodash-es'
import type { ConnectorInfoDTO, ConnectorRequestBody } from 'services/cd-ng'
import { Connectors } from '@connectors/constants'
import {
  BitbucketPRTriggerActions,
  GitHubPRTriggerActions,
  GitlabPRTriggerActions
} from '../pages/get-started-with-ci/InfraProvisioningWizard/Constants'

const OAuthConnectorPayload: ConnectorRequestBody = {
  connector: {
    name: '',
    identifier: '',
    type: 'Github',
    spec: {
      authentication: {
        type: 'Http',
        spec: {
          type: 'OAuth',
          spec: {
            tokenRef: ''
          }
        }
      },
      apiAccess: {
        type: 'OAuth',
        spec: {
          tokenRef: ''
        }
      },
      executeOnDelegate: true,
      type: 'Account'
    }
  }
}

export const getOAuthConnectorPayload = ({
  tokenRef,
  refreshTokenRef,
  gitProviderType
}: {
  tokenRef: string
  refreshTokenRef?: string
  gitProviderType?: ConnectorInfoDTO['type']
}): ConnectorRequestBody => {
  let updatedConnectorPayload: ConnectorRequestBody = {}
  updatedConnectorPayload = set(OAuthConnectorPayload, 'connector.name', `${gitProviderType} OAuth`)
  updatedConnectorPayload = set(
    OAuthConnectorPayload,
    'connector.identifier',
    `${gitProviderType}_OAuth_${new Date().getTime()}`
  )
  updatedConnectorPayload = set(OAuthConnectorPayload, 'connector.type', gitProviderType)
  switch (gitProviderType) {
    case Connectors.GITHUB:
      updatedConnectorPayload = set(OAuthConnectorPayload, 'connector.spec.authentication.spec.spec', { tokenRef })
      updatedConnectorPayload = set(OAuthConnectorPayload, 'connector.spec.apiAccess.spec', { tokenRef })
      return updatedConnectorPayload
    case Connectors.GITLAB:
    case Connectors.BITBUCKET:
      updatedConnectorPayload = set(OAuthConnectorPayload, 'connector.spec.authentication.spec.spec', {
        tokenRef,
        refreshTokenRef
      })
      updatedConnectorPayload = set(OAuthConnectorPayload, 'connector.spec.apiAccess.spec', {
        tokenRef,
        refreshTokenRef
      })
      return updatedConnectorPayload
    default:
      return updatedConnectorPayload
  }
}

export const getPRTriggerActions = (gitProviderType: ConnectorInfoDTO['type']) => {
  switch (gitProviderType) {
    case Connectors.GITHUB:
      return GitHubPRTriggerActions

    case Connectors.GITLAB:
      return GitlabPRTriggerActions

    case Connectors.BITBUCKET:
      return BitbucketPRTriggerActions

    default:
      return []
  }
}
