/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { StepProps, Text, Layout } from '@harness/uicore'
import { FontVariation, Color } from '@harness/design-system'

import { useStrings } from 'framework/strings'
import type { ConnectorInfoDTO } from 'services/cd-ng'
import AutoStoppingPopover from '../AutoStoppingPopover'

interface Props {
  name?: string
}

const EnableAutoStoppingHeader: React.FC<Props & StepProps<ConnectorInfoDTO>> = () => {
  const { getString } = useStrings()

  return (
    <Layout.Horizontal spacing={'xsmall'} style={{ alignItems: 'center' }}>
      <Text font={{ variation: FontVariation.H3 }} color={Color.GREY_800}>
        {getString('ce.cloudIntegration.enableAutoStopping')}{' '}
        <Text inline font={{ weight: 'light', italic: true }} color={Color.GREY_800}>
          {getString('common.optionalLabel')}
        </Text>
      </Text>
      <AutoStoppingPopover />
    </Layout.Horizontal>
  )
}

export default EnableAutoStoppingHeader
