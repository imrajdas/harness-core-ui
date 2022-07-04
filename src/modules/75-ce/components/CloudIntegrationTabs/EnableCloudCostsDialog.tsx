/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import { Button, ButtonVariation, Container, Dialog, Layout, Text } from '@harness/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { useModalHook } from '@harness/use-modal'

import { useStrings } from 'framework/strings'
import type { StringsMap } from 'stringTypes'

import enableCloudCostImg from './images/enabe-cloud-cost-data.svg'

import css from './CloudIntegrationTabs.module.scss'

export const useEnableCloudCostsDialog = () => {
  const { getString } = useStrings()

  const features: (keyof StringsMap)[] = useMemo(
    () => [
      'ce.cloudIntegration.enableCloudCostDialog.content.feat1',
      'ce.cloudIntegration.enableCloudCostDialog.content.feat2',
      'ce.cloudIntegration.enableCloudCostDialog.content.feat3',
      'ce.cloudIntegration.enableCloudCostDialog.content.feat4',
      'ce.cloudIntegration.enableCloudCostDialog.content.feat5',
      'ce.cloudIntegration.enableCloudCostDialog.content.feat6'
    ],
    []
  )

  const [openDialog, closeDialog] = useModalHook(() => (
    <Dialog
      isOpen
      enforceFocus={false}
      onClose={closeDialog}
      title={getString('ce.cloudIntegration.enableCloudCostDialog.title')}
      className={css.enableCloudCostsDialog}
    >
      <Container className={css.dialogContainer}>
        <Layout.Vertical spacing={'xlarge'} width={500}>
          <Text color={Color.GREY_800} font={{ variation: FontVariation.BODY }}>
            {getString('ce.cloudIntegration.enableCloudCostDialog.desc')}
          </Text>
          <div>
            <Text color={Color.GREY_800} font={{ variation: FontVariation.BODY2 }} margin={{ bottom: 'small' }}>
              {getString('ce.cloudIntegration.enableCloudCostDialog.content.header')}
            </Text>
            {features.map(feature => (
              <Text
                key={feature}
                color={Color.GREY_800}
                font={{ variation: FontVariation.BODY }}
                icon="tick"
                iconProps={{ size: 12, color: Color.GREEN_700, margin: { right: 'small' } }}
              >
                {getString(feature)}
              </Text>
            ))}
          </div>
          <div>
            <Button
              text={getString('yes')}
              width={90}
              variation={ButtonVariation.PRIMARY}
              margin={{ right: 'small' }}
            />
            <Button text={getString('cancel')} width={90} variation={ButtonVariation.TERTIARY} onClick={closeDialog} />
          </div>
        </Layout.Vertical>
        <img src={enableCloudCostImg} className={css.dialogImg} />
      </Container>
    </Dialog>
  ))

  return [openDialog, closeDialog]
}
