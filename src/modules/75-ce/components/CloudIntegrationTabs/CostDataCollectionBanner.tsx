/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Button, ButtonSize, ButtonVariation, Icon, Layout, Text } from '@harness/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { useStrings } from 'framework/strings'

import { useEnableCloudCostsDialog } from './EnableCloudCostsDialog'

import css from './CloudIntegrationTabs.module.scss'

interface Props {
  isEnabled: boolean
  noOfClusters: number
}

const CostDataCollectionBanner: React.FC<Props> = ({ isEnabled, noOfClusters }) => {
  const { getString } = useStrings()

  const [isBannerDismissed, setIsBannerDismissed] = useState(false)

  const [openDialog] = useEnableCloudCostsDialog({ noOfClusters })

  if (!isEnabled || isBannerDismissed) {
    return <></>
  }

  return (
    <Layout.Horizontal spacing={'large'} className={css.banner}>
      <Icon name={'cost-data-collection'} size={60} />
      <Text font={{ variation: FontVariation.BODY }} color={Color.GREY_1000}>
        {getString('ce.cloudIntegration.banner', { noOfClusters })}
      </Text>
      <Button
        icon="ccm-solid"
        text={getString('ce.cloudIntegration.enableCostDataCollection')}
        variation={ButtonVariation.PRIMARY}
        className={css.enableBtn}
        onClick={openDialog}
      />
      <Button
        variation={ButtonVariation.ICON}
        size={ButtonSize.LARGE}
        icon="cross"
        data-testid="trial-banner-dismiss"
        onClick={() => setIsBannerDismissed(true)}
      />
    </Layout.Horizontal>
  )
}

export default CostDataCollectionBanner
