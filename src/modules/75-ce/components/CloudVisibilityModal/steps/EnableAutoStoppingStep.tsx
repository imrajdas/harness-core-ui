/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout, Text } from '@harness/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'

interface Props {
  name: string
}

const EnableAutoStoppingStep: React.FC<Props> = () => {
  const { getString } = useStrings()

  return (
    <Layout.Vertical spacing={'xlarge'}>
      <Text font={{ variation: FontVariation.H3 }} color={Color.GREY_800}>
        {getString('ce.cloudIntegration.costVisibilityDialog.step1.enableAutoStopping')}{' '}
        <Text inline font={{ weight: 'light', italic: true }} color={Color.GREY_800}>
          {getString('common.optionalLabel')}
        </Text>
      </Text>
      <Text font={{ variation: FontVariation.BODY }} color={Color.GREY_700}>
        {getString('ce.cloudIntegration.costVisibilityDialog.step1.desc')}
      </Text>
    </Layout.Vertical>
  )
}

export default EnableAutoStoppingStep
