/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Text, Layout, Checkbox, Popover } from '@harness/uicore'
import { Color } from '@harness/design-system'
import { PopoverInteractionKind, Classes, Position } from '@blueprintjs/core'
import { useStrings } from 'framework/strings'
import css from './CostCalculator.module.scss'

const PremLabel: React.FC = () => {
  const { getString } = useStrings()
  return (
    <Layout.Horizontal
      flex={{ alignItems: 'center', justifyContent: 'space-between' }}
      padding={{ top: 'xsmall' }}
      width="90%"
    >
      <Layout.Horizontal spacing="small">
        <Text font={{ size: 'small', weight: 'bold' }} icon={'crown'} iconProps={{ color: Color.ORANGE_700 }}>
          {getString('authSettings.costCalculator.premSupport.title')}
        </Text>
        <Text font={{ size: 'small', weight: 'semi-bold' }}>
          {getString('authSettings.costCalculator.premSupport.onCallSupport')}
        </Text>
      </Layout.Horizontal>
      <Text font={{ size: 'xsmall' }}>{getString('authSettings.costCalculator.premSupport.includedByDefault')}</Text>
    </Layout.Horizontal>
  )
}

interface PremiumSupportProps {
  premiumSupport: boolean
  onChange: (value: boolean) => void
  disabled: boolean
}

export const PremiumSupport: React.FC<PremiumSupportProps> = ({ premiumSupport, onChange, disabled }) => {
  const { getString } = useStrings()
  const checkbox = disabled ? (
    <Popover
      interactionKind={PopoverInteractionKind.HOVER}
      popoverClassName={Classes.DARK}
      position={Position.BOTTOM}
      content={
        <Text padding={'medium'} color={Color.GREY_100} font={{ size: 'small' }}>
          {getString('authSettings.costCalculator.switchTooltip')}
        </Text>
      }
    >
      <Checkbox
        size={12}
        checked={premiumSupport}
        onChange={() => onChange(!premiumSupport)}
        disabled
        className={css.checkbox}
      />
    </Popover>
  ) : (
    <Checkbox size={12} checked={premiumSupport} onChange={() => onChange(!premiumSupport)} className={css.checkbox} />
  )
  return (
    <Layout.Horizontal
      className={css.premSupport}
      padding={'small'}
      flex={{ alignItems: 'baseline', justifyContent: 'start' }}
    >
      {checkbox}
      <PremLabel />
    </Layout.Horizontal>
  )
}
