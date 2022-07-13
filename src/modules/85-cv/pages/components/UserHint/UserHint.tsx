import React from 'react'
import { Layout, Icon, Text } from '@harness/uicore'
import { Color, FontVariation } from '@harness/design-system'
import type { UserHintProps } from './UserHint.types'
import { DefaultUserHintIconName } from './UserHint.constant'

export default function UserHint(props: UserHintProps): JSX.Element {
  const {
    userMessage,
    iconName = DefaultUserHintIconName,
    iconColor = Color.PRIMARY_7,
    color = Color.GREY_600,
    font = { variation: FontVariation.SMALL },
    dataTestId
  } = props

  return (
    <Layout.Horizontal margin={{ top: 'small' }} data-testid={dataTestId}>
      <Icon margin={{ right: 'small' }} name={iconName} color={iconColor} />
      <Text color={color} font={font}>
        {userMessage}
      </Text>
    </Layout.Horizontal>
  )
}
