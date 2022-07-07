/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Text, Layout } from '@wings-software/uicore'
import type { IconName } from '@blueprintjs/core'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import type { ServiceError } from 'services/lw'
import useErrorModalHook from '../../common/useErrorModalHook'
import css from './TextWithToolTip.module.scss'

export enum textWithToolTipStatus {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

interface TextWithToolTipProps {
  status: textWithToolTipStatus
  messageText?: string
  showDetails?: boolean
  errors: ServiceError[]
  iconSize?: number
  icon?: IconName
  indicatorColor?: string // TEMP: to set color for circle icon
}

const TextWithToolTip: React.FC<TextWithToolTipProps> = props => {
  const { getString } = useStrings()
  const { openErrorModal } = useErrorModalHook({ errorSummary: 'ERROR FOUND!!' })
  const isSuccess: boolean = props.status === textWithToolTipStatus.SUCCESS
  return (
    <Text
      inline
      icon={props.icon || (isSuccess ? 'full-circle' : 'warning-sign')}
      iconProps={{
        size: props.iconSize || (isSuccess ? 6 : 12),
        color: props.indicatorColor ? props.indicatorColor : isSuccess ? Color.GREEN_500 : Color.RED_500
      }}
      tooltip={
        !isSuccess ? (
          <Layout.Vertical font={{ size: 'small' }} spacing="small" padding="small">
            <Text font={{ size: 'normal' }} color={Color.WHITE}>
              {'ERROR' + (props.messageText ? `: ${props.messageText}` : '')}
            </Text>
            <Text
              color={Color.BLUE_400}
              onClick={e => {
                e.stopPropagation()
                openErrorModal(props.errors || [])
              }}
              className={css.viewDetails}
            >
              {getString('connectors.testConnectionStep.errorDetails')}
            </Text>
          </Layout.Vertical>
        ) : undefined
      }
      tooltipProps={{ isDark: true, position: 'bottom' }}
    >
      {props.messageText || null}
    </Text>
  )
}

export default TextWithToolTip
