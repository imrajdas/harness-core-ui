/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Card, Container, Icon, Layout, Text } from '@wings-software/uicore'
import { useHistory } from 'react-router-dom'
import { Color } from '@harness/design-system'
import { getModuleIcon } from '@common/utils/utils'
import { getModulePurpose, getModuleTitle } from '@projects-orgs/utils/utils'
import { useStrings } from 'framework/strings'

import { ModuleName } from 'framework/types/ModuleName'
import routes from '@common/RouteDefinitions'
import css from './ModuleListCard.module.scss'

export interface ModuleListCardProps {
  module: ModuleName
  orgIdentifier: string
  projectIdentifier: string
  accountId: string
}
export const getModuleLink = ({ accountId, orgIdentifier, projectIdentifier, module }: ModuleListCardProps): string => {
  switch (module) {
    case ModuleName.CD:
      return routes.toProjectOverview({
        projectIdentifier,
        orgIdentifier,
        accountId,
        module: 'cd'
      })
    case ModuleName.CI:
      return routes.toProjectOverview({
        projectIdentifier,
        orgIdentifier,
        accountId,
        module: 'ci'
      })
    case ModuleName.CV:
      return routes.toCVSLOs({
        projectIdentifier,
        orgIdentifier,
        accountId
      })
    case ModuleName.CF:
      return routes.toCFFeatureFlags({
        projectIdentifier,
        orgIdentifier,
        accountId
      })
    case ModuleName.CE:
      return routes.toCEOverview({ accountId })
    case ModuleName.STO:
      return routes.toSTOProjectOverview({
        projectIdentifier,
        orgIdentifier,
        accountId
      })
  }
  return ''
}
const ModuleListCard: React.FC<ModuleListCardProps> = ({ module, accountId, orgIdentifier, projectIdentifier }) => {
  const { getString } = useStrings()
  const history = useHistory()

  const purpose = getModulePurpose(module)

  return (
    <>
      <Card
        className={css.card}
        interactive
        onClick={() => history.push(getModuleLink({ module, accountId, orgIdentifier, projectIdentifier }))}
      >
        <Layout.Horizontal>
          <Container width="100%" flex border={{ right: true, color: Color.WHITE }}>
            <Layout.Horizontal flex spacing="large">
              <Icon name={getModuleIcon(module)} size={70}></Icon>
              <div>
                <Layout.Vertical padding={{ bottom: 'medium' }}>
                  <Text font={{ size: 'small' }}>{getString(getModuleTitle(module)).toUpperCase()}</Text>
                  <Text font={{ size: 'medium' }} color={Color.BLACK}>
                    {purpose && getString(purpose)}
                  </Text>
                </Layout.Vertical>
              </div>
            </Layout.Horizontal>
          </Container>
        </Layout.Horizontal>
      </Card>
    </>
  )
}

export default ModuleListCard
