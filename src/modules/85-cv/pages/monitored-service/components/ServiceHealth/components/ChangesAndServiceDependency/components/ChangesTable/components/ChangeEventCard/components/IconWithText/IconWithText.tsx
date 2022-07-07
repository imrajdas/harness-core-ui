import React from 'react'
import { Container, Icon, Layout, Text } from '@wings-software/uicore'
import { Color } from '@harness/design-system'

import type { IconName } from '@blueprintjs/core'

export const IconWithText = ({ icon, text = '' }: { icon?: string; text?: string }) => {
  return (
    <Container>
      <Layout.Horizontal spacing={'small'}>
        {icon && <Icon name={icon as unknown as IconName} size={15} />}
        {text && (
          <Text font={{ size: 'small' }} color={Color.GREY_800}>
            {text}
          </Text>
        )}
      </Layout.Horizontal>
    </Container>
  )
}
