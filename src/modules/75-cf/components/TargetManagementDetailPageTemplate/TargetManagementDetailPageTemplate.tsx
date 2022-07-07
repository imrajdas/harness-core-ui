/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FC, ReactNode, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import type { Breadcrumb } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import type { Segment, Target } from 'services/cf'
import routes from '@common/RouteDefinitions'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { formatDate, formatTime } from '@cf/utils/CFUtils'
import useActiveEnvironment from '@cf/hooks/useActiveEnvironment'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { DetailPageTemplate, DetailPageTemplateProps } from '../DetailPageTemplate/DetailPageTemplate'

import css from './TargetManagementDetailPageTemplate.module.scss'

export interface TargetManagementDetailPageTemplateProps
  extends Omit<DetailPageTemplateProps, 'title' | 'subTitle' | 'identifier' | 'breadcrumbs'> {
  item: Segment | Target
  openDeleteDialog: () => void
  leftBar: ReactNode
}

const TargetManagementDetailPageTemplate: FC<TargetManagementDetailPageTemplateProps> = ({
  item,
  openDeleteDialog,
  leftBar,
  children,
  ...detailPageTemplateProps
}) => {
  const { getString } = useStrings()

  const { withActiveEnvironment, activeEnvironment: environmentIdentifier } = useActiveEnvironment()
  const { accountId: accountIdentifier, orgIdentifier, projectIdentifier } = useParams<Record<string, string>>()

  const isTarget: boolean = 'segments' in item

  useDocumentTitle(
    `${getString('cf.shared.targetManagement')}: ${getString(isTarget ? 'cf.shared.targets' : 'cf.shared.segments')}`
  )

  const createdOn = useMemo<string>(
    () =>
      getString('cf.targetDetail.createdOnDate', {
        date: formatDate(item.createdAt as number),
        time: formatTime(item.createdAt as number)
      }),
    [item.createdAt]
  )

  const breadcrumbs = useMemo<Breadcrumb[]>(() => {
    if (isTarget) {
      return [
        {
          label: `${getString('cf.shared.targetManagement')}: ${getString('cf.shared.targets')}`,
          url: withActiveEnvironment(
            routes.toCFTargets({
              accountId: accountIdentifier,
              orgIdentifier,
              projectIdentifier
            })
          )
        }
      ]
    }

    return [
      {
        label: `${getString('cf.shared.targetManagement')}: ${getString('cf.shared.segments')}`,
        url: withActiveEnvironment(
          routes.toCFSegments({
            accountId: accountIdentifier,
            orgIdentifier,
            projectIdentifier
          })
        )
      }
    ]
  }, [accountIdentifier, isTarget, orgIdentifier, projectIdentifier])

  return (
    <DetailPageTemplate
      title={item.name}
      subTitle={createdOn}
      identifier={item.identifier}
      breadcrumbs={breadcrumbs}
      menuItems={[
        {
          icon: 'cross',
          text: getString('delete'),
          onClick: openDeleteDialog,
          permission: {
            resource: { resourceType: ResourceType.ENVIRONMENT, resourceIdentifier: environmentIdentifier },
            permission: PermissionIdentifier.DELETE_FF_TARGETGROUP
          }
        }
      ]}
      {...detailPageTemplateProps}
    >
      <div className={css.contentLayout}>
        <div className={css.leftBar}>{leftBar}</div>
        <div className={css.mainContent}>{children}</div>
      </div>
    </DetailPageTemplate>
  )
}

export default TargetManagementDetailPageTemplate
