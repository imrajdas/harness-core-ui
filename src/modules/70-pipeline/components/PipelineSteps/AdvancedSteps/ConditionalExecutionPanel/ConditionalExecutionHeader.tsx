/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Link, Text } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import type { StepMode as Modes } from '@pipeline/utils/stepUtils'
import { ModeEntityNameMap } from './ConditionalExecutionPanelUtils'

const DOCUMENT_URL = 'https://docs.harness.io/article/i36ibenkq2-step-skip-condition-settings'

export interface ConditionalExecutionStatusProps {
  mode: Modes
}

export default function ConditionalExecutionHeader(props: ConditionalExecutionStatusProps): React.ReactElement {
  const { mode } = props
  const { getString } = useStrings()

  return (
    <Text color={Color.GREY_700} font={{ size: 'small' }}>
      {getString('pipeline.conditionalExecution.subTitle', { entity: ModeEntityNameMap[mode] })}{' '}
      <Link rel="noreferrer" color={Color.BLUE_400} target="_blank" href={DOCUMENT_URL} font={{ size: 'small' }}>
        {getString('pipeline.createPipeline.learnMore')}
      </Link>
    </Text>
  )
}
