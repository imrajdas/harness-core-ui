/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Button, Text, Container } from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import EmptyView from '@ce/images/empty-state.svg'
import css from './EmptyPage.module.scss'

interface EmptyPageProps {
  title?: string
  subtitle?: string
  buttonText?: string
  buttonAction?: () => void
  isBtnDisabled?: boolean
}

const EmptyPage: (props: EmptyPageProps) => React.ReactElement = ({
  title,
  subtitle,
  buttonAction,
  buttonText,
  isBtnDisabled
}) => {
  return (
    <Container className={css.empty}>
      <img src={EmptyView} />
      <Text
        margin={{
          top: 'large',
          bottom: 'xsmall'
        }}
        font={{ variation: FontVariation.SMALL_SEMI }}
        style={{
          fontWeight: 600
        }}
        color={Color.GREY_500}
      >
        {title}
      </Text>
      <Text font={{ variation: FontVariation.SMALL }}>{subtitle}</Text>
      {buttonText ? (
        <Button
          disabled={isBtnDisabled}
          margin={{
            top: 'large'
          }}
          intent="primary"
          text={buttonText}
          iconProps={{
            size: 10
          }}
          onClick={buttonAction}
          icon="plus"
        />
      ) : /* istanbul ignore next */ null}
    </Container>
  )
}

export default EmptyPage
