/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { IconName, Text } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import type { VerifyStepSummary } from 'services/cv'
import { useStrings } from 'framework/strings'
import type { PipelineExecutionSummary } from 'services/pipeline-ng'
import css from './VerificationStatusCard.module.scss'

export default function VerificationStatusCard({
  status
}: {
  status: VerifyStepSummary['verificationStatus'] | PipelineExecutionSummary['status']
}) {
  let statusMessage: string | undefined = undefined
  let color: Color | undefined = undefined
  let backgroundColor: Color | undefined = undefined
  let icon = ''
  const { getString } = useStrings()
  switch (status) {
    case 'IN_PROGRESS':
    case 'Running':
      statusMessage = getString('inProgress')
      color = Color.PRIMARY_2
      backgroundColor = Color.PRIMARY_6
      icon = 'deployment-inprogress-new'
      break
    case 'VERIFICATION_FAILED':
    case 'Failed':
    case 'IgnoreFailed':
      statusMessage = getString('failed')
      color = Color.RED_500
      backgroundColor = Color.RED_200
      icon = 'danger-icon'
      break
    case 'ERROR':
    case 'Errored':
      statusMessage = getString('error')
      color = Color.RED_500
      backgroundColor = Color.RED_200
      icon = 'error'
      break
    case 'VERIFICATION_PASSED':
      statusMessage = getString('passed')
      color = Color.GREEN_700
      backgroundColor = Color.GREEN_350
      icon = 'deployment-success-new'
      break
    default:
      statusMessage = status
  }
  if (!statusMessage) {
    return null
  }
  return (
    <Text className={css.verificationStatusCard} icon={icon as IconName} background={backgroundColor} color={color}>
      {statusMessage}
    </Text>
  )
}
