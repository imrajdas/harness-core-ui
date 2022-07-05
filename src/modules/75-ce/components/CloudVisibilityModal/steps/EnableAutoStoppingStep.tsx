/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect } from 'react'
import { Layout, Text } from '@harness/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'

interface Props {
  name: string
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>
}

const EnableAutoStoppingStep: React.FC<Props> = ({ setCurrentStep }) => {
  const { getString } = useStrings()

  useEffect(() => {
    setCurrentStep(2)
  }, [])

  return (
    <Layout.Vertical spacing={'xlarge'}>
      <Text font={{ variation: FontVariation.H3 }} color={Color.GREY_800}>
        {getString('ce.cloudIntegration.enableAutoStopping')}{' '}
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
