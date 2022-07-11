/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { Container, Layout, Text } from '@wings-software/uicore'
import routes from '@common/RouteDefinitions'
import { useStrings } from 'framework/strings'
import CCMDocsImage from './images/CCMDocs.svg'
import AutoStoppingImage from './images/AutoStopping.svg'
import ConnectorImage from './images/Connector.svg'
import NoDataImage from './images/NoData.svg'
import css from './OverviewPage.module.scss'

const NoData = ({ onConnectorCreateClick }: { onConnectorCreateClick: () => void }) => {
  const { accountId } = useParams<{ accountId: string }>()

  const history = useHistory()
  const { getString } = useStrings()

  const handleCreateAutoStoppingClick = () => {
    history.push(routes.toCECORules({ accountId, params: '' }))
  }
  return (
    <div className={css.nodata}>
      <div className={css.noDataContent}>
        <Layout.Vertical spacing="xxxlarge">
          <Container>
            <Layout.Horizontal spacing="large" style={{ alignItems: 'center' }}>
              <img src={NoDataImage} height={150} />
              <Text color="grey800" font="normal" style={{ lineHeight: '25px' }}>
                {getString('ce.overview.noData.info')}
              </Text>
            </Layout.Horizontal>
          </Container>
          <Container>
            <Text color="grey800">{getString('ce.overview.noData.explore')}</Text>
            <Layout.Horizontal style={{ justifyContent: 'space-evenly', marginTop: 25 }}>
              <Layout.Vertical>
                <img src={AutoStoppingImage} height={75} />
                <Text
                  padding="medium"
                  color="primary7"
                  style={{ cursor: 'pointer' }}
                  onClick={handleCreateAutoStoppingClick}
                >
                  {getString('ce.overview.noData.autoStopping')}
                </Text>
              </Layout.Vertical>
              <Layout.Vertical>
                <img src={ConnectorImage} height={75} />
                <Text padding="medium" color="primary7" style={{ cursor: 'pointer' }} onClick={onConnectorCreateClick}>
                  {getString('ce.overview.noData.connector')}
                </Text>
              </Layout.Vertical>
              <Layout.Vertical>
                <img src={CCMDocsImage} height={75} />
                <a href="http://docs.harness.io/" target="_blank" rel="noreferrer" className={css.ngDocs}>
                  {getString('ce.overview.noData.ngDocs')}
                </a>
              </Layout.Vertical>
            </Layout.Horizontal>
          </Container>
        </Layout.Vertical>
      </div>
    </div>
  )
}

export default NoData
