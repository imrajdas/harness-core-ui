/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo, useCallback } from 'react'
import { Text, Container, Layout, Button, ButtonVariation, ButtonSize } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import VerificationStatusCard from '@cv/components/ExecutionVerification/components/DeploymentProgressAndNodes/components/VerificationStatusCard/VerificationStatusCard'
import type { ChangeTitleData } from '../../ChangeEventCard.types'
import { IconWithText } from '../IconWithText/IconWithText'
import css from '../ChangeTitle/ChangeTitle.module.scss'

export default function ChangeTitleForHarness({ changeTitleData }: { changeTitleData: ChangeTitleData }): JSX.Element {
  const { getString } = useStrings()
  const { name, executionId, url, serviceIdentifier, envIdentifier, status } = changeTitleData
  const titleOptions = useMemo(
    () =>
      url
        ? {
            tooltip: name,
            className: css.addEllipsis
          }
        : {},
    [url, name]
  )

  const openPipelineInNewTab = useCallback(() => {
    const pipelineURL = `${window.location.origin}${window.location.pathname}#${url}`
    window.open(pipelineURL, '_blank')
  }, [url])

  return (
    <Container>
      <Layout.Horizontal>
        <Text
          {...titleOptions}
          font={{ size: 'medium', weight: 'semi-bold' }}
          width="max-content"
          margin={{ right: 'medium' }}
          color={Color.BLACK_100}
        >
          {name}
        </Text>
        <Text font={{ size: 'xsmall' }} color={Color.GREY_800} flex={{ align: 'center-center' }}>
          ({getString('cd.serviceDashboard.executionId')}
          <span>{executionId}</span>)
        </Text>
      </Layout.Horizontal>
      <Container flex margin={{ top: 'xsmall' }}>
        <Layout.Horizontal spacing="xlarge">
          <IconWithText icon={'cd-solid'} />
          <IconWithText icon={'main-setup'} text={serviceIdentifier} />
          <IconWithText icon={'environments'} text={envIdentifier} />
          <VerificationStatusCard status={status} />
        </Layout.Horizontal>
        {url ? (
          <Button
            onClick={openPipelineInNewTab}
            className={css.redirectButtonPipeline}
            text={getString('cv.changeSource.changeSourceCard.viewDeployment')}
            icon="share"
            iconProps={{ size: 12 }}
            variation={ButtonVariation.SECONDARY}
            size={ButtonSize.SMALL}
          />
        ) : null}
      </Container>
    </Container>
  )
}
