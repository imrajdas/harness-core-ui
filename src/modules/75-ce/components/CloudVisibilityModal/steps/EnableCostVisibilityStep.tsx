/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Button, ButtonVariation, Layout, StepProps, Text } from '@harness/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import type { ConnectorInfoDTO } from 'services/cd-ng'

interface Props {
  name: string
  closeModal: () => void
}

const EnableCostVisibilityStep: React.FC<Props & StepProps<ConnectorInfoDTO>> = props => {
  const { nextStep, closeModal } = props

  const { getString } = useStrings()

  return (
    <>
      <Layout.Vertical height={'100%'} spacing={'xlarge'}>
        <Text font={{ variation: FontVariation.H3 }} color={Color.GREY_800}>
          {getString('ce.cloudIntegration.costVisibilityDialog.step1.title')}
        </Text>
        <Text font={{ variation: FontVariation.BODY }} color={Color.GREY_700}>
          {getString('ce.cloudIntegration.costVisibilityDialog.step1.desc')}
        </Text>
        <div style={{ height: '100%' }}>
          <Text>Content</Text>
        </div>
        <div>
          <Button
            text={getString('finish')}
            variation={ButtonVariation.SECONDARY}
            margin={{ right: 'small' }}
            onClick={closeModal}
          />
          <Button
            text={getString('ce.cloudIntegration.costVisibilityDialog.step1.enableAutoStopping')}
            variation={ButtonVariation.PRIMARY}
            onClick={() => nextStep?.()}
          />
        </div>
      </Layout.Vertical>
    </>
  )
}

export default EnableCostVisibilityStep
