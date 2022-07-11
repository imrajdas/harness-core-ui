/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Popover, Position } from '@blueprintjs/core'
import { Icon, IconName, Layout, Text } from '@wings-software/uicore'
import { FontVariation } from '@harness/design-system'
import cx from 'classnames'
import { defaultTo } from 'lodash-es'
import { String } from 'framework/strings'
import css from './ServiceExecutionsCard.module.scss'

export enum DashboardSelected {
  OVERVIEW = 'overviewPage',
  SERVICEDETAIL = 'serviceDetail'
}
interface ListProps {
  listName: string[]
  className?: string
  limit?: number
  iconName: IconName
  iconClass?: string
}

export interface ServiceExecutionsCardProps {
  envIdentifiers?: string[]
  serviceIdentifiers?: string[]
  caller: string
}

function List({ listName, limit = 2, className, iconName, iconClass }: ListProps): React.ReactElement {
  const visibleList = listName.slice(0, limit).join(', ')
  return (
    <div className={css.main}>
      {listName.length > 0 ? (
        <>
          <div className={className}>
            <Icon name={iconName} className={iconClass} size={14} />
            <Text>{visibleList}</Text>
          </div>
          {listName.length > limit ? (
            <>
              ,&nbsp;
              <Popover
                wrapperTagName="div"
                targetTagName="div"
                interactionKind="hover"
                position={Position.RIGHT}
                className={css.serviceWrapper}
              >
                <String
                  tagName="div"
                  className={cx(css.serviceName, css.count)}
                  stringID={'common.plusNumberNoSpace'}
                  vars={{ number: Math.abs(listName.length - limit) }}
                />
                <Layout.Vertical padding="small">
                  {listName.slice(limit).map((name, index) => (
                    <Text font={{ variation: FontVariation.FORM_LABEL }} key={index}>
                      {name}
                    </Text>
                  ))}
                </Layout.Vertical>
              </Popover>
            </>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

export function ServiceExecutionsCard(data: ServiceExecutionsCardProps): React.ReactElement {
  let serviceIdentifiers: string[] = defaultTo(data?.serviceIdentifiers as string[], [])
  let envIdentifiers: string[] = defaultTo(data?.envIdentifiers as string[], [])

  serviceIdentifiers = serviceIdentifiers.filter(item => !!item)
  envIdentifiers = envIdentifiers.filter(item => !!item)

  const limit = data.caller === DashboardSelected.OVERVIEW ? 2 : 3
  const headerText =
    data.caller === DashboardSelected.OVERVIEW
      ? 'pipeline.executionList.servicesDeployedText'
      : 'pipeline.executionList.artifactDeployedText'

  return (
    <Layout.Horizontal spacing="medium" className={css.moduleData}>
      <Icon name="cd-main" size={20} className={css.moduleIcon} />
      <div className={css.cardSummary}>
        <String
          tagName="div"
          className={css.heading}
          stringID={headerText}
          vars={{ size: serviceIdentifiers.length }}
        />
        <List
          className={css.services}
          listName={serviceIdentifiers}
          limit={limit}
          iconClass={css.servicesIcon}
          iconName={'services'}
        />
      </div>
      <div className={css.cardSummary}>
        <String
          tagName="div"
          className={css.heading}
          stringID="pipeline.executionList.EnvironmentsText"
          vars={{ size: envIdentifiers.length }}
        />
        <List
          className={css.environments}
          listName={envIdentifiers}
          limit={limit}
          iconClass={css.envIcon}
          iconName={'environments'}
        />
      </div>
    </Layout.Horizontal>
  )
}
