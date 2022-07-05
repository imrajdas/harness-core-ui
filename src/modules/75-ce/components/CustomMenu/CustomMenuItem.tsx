/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Icon, Layout, Text, IconName, FlexExpander } from '@wings-software/uicore'
import { Classes } from '@blueprintjs/core'
import type { FontSize } from '@harness/design-system'
import cx from 'classnames'
import css from './CustomMenu.module.scss'

interface CustomMenuItemProps {
  text: string
  iconName?: string
  onClick?: () => void
  fontSize?: FontSize
  hidePopoverOnClick?: boolean
  rightIcon?: IconName
  disabledMenuItem?: boolean
}

const CustomMenuItem: React.FC<CustomMenuItemProps> = ({
  text,
  iconName,
  onClick,
  fontSize,
  hidePopoverOnClick,
  rightIcon,
  disabledMenuItem
}) => {
  return (
    <Layout.Horizontal
      padding={{
        left: 'medium',
        right: 'medium',
        top: 'small',
        bottom: 'small'
      }}
      spacing="medium"
      onClick={onClick}
      className={cx(
        css.customMenuContainer,
        { [Classes.POPOVER_DISMISS]: hidePopoverOnClick, [css.disabledPopover]: disabledMenuItem },
        'custom-menu-item'
      )}
    >
      {iconName ? <Icon name={iconName as IconName} size={20} /> : null}
      <Text font={fontSize ? fontSize : 'small'}>{text}</Text>
      <FlexExpander />
      {rightIcon ? <Icon name={rightIcon} /> : null}
    </Layout.Horizontal>
  )
}

export default CustomMenuItem
