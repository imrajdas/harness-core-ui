/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { Breadcrumb } from '@wings-software/uicore'
import type { UseStringsReturn } from 'framework/strings'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import { Scope } from '@common/interfaces/SecretsInterface'
import routes from '@common/RouteDefinitions'

export interface GetLinkForAccountResourcesProps {
  accountId: string
  orgIdentifier?: string
  projectIdentifier?: string
  getString: UseStringsReturn['getString']
}

export const getLinkForAccountResources = ({
  accountId,
  orgIdentifier,
  projectIdentifier,
  getString
}: GetLinkForAccountResourcesProps): Breadcrumb[] => {
  return getScopeFromDTO({ orgIdentifier, projectIdentifier }) === Scope.ACCOUNT
    ? [{ label: getString('common.accountResources'), url: routes.toAccountResources({ accountId }) }]
    : []
}
