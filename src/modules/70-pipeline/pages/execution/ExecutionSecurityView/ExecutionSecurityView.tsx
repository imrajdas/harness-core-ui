/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { lazy } from 'react'
import { Container } from '@wings-software/uicore'
import { FeatureFlag } from '@common/featureFlags'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import CardRailView from '@pipeline/components/Dashboards/CardRailView/CardRailView'
import ExecutionCard from '@pipeline/components/ExecutionCard/ExecutionCard'
import { useExecutionContext } from '@pipeline/context/ExecutionContext'
import type { STOAppCustomProps } from '@pipeline/interfaces/STOApp'
import ChildAppMounter from 'microfrontends/ChildAppMounter'

export default function ExecutionSecurityView(): React.ReactElement | null {
  const context = useExecutionContext()
  const pipelineExecutionDetail = context?.pipelineExecutionDetail

  const isV2 = useFeatureFlag(FeatureFlag.STO_API_V2)
  const RemoteSTOApp = lazy(() => (isV2 ? import(`stoV2/App`) : import(`sto/App`)))
  const RemotePipelineSecurityView = lazy(() =>
    isV2 ? import(`stoV2/PipelineSecurityView`) : import(`sto/PipelineSecurityView`)
  )

  if (!pipelineExecutionDetail || !pipelineExecutionDetail.pipelineExecutionSummary) {
    return null
  }

  return (
    <Container width="100%" height="100%">
      <ChildAppMounter<STOAppCustomProps> ChildApp={RemoteSTOApp} customComponents={{ CardRailView, ExecutionCard }}>
        <RemotePipelineSecurityView pipelineExecutionDetail={pipelineExecutionDetail} />
      </ChildAppMounter>
    </Container>
  )
}
