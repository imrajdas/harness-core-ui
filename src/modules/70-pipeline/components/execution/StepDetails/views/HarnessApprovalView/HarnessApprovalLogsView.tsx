/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import classnames from 'classnames'
import { get } from 'lodash-es'
import { Spinner } from '@blueprintjs/core'
import { useGetApprovalInstance, useGetHarnessApprovalInstanceAuthorization } from 'services/pipeline-ng'
import { useStrings } from 'framework/strings'
import { useDeepCompareEffect } from '@common/hooks'
import { DefaultConsoleViewStepDetails, logsRenderer } from '@pipeline/components/LogsContent/LogsContent'
import type { ConsoleViewStepDetailProps, RenderLogsInterface } from '@pipeline/factories/ExecutionFactory/types'
import { isExecutionWaiting } from '@pipeline/utils/statusHelpers'
import type { ApprovalData } from '@pipeline/components/execution/StepDetails/tabs/HarnessApprovalTab/HarnessApprovalTab'
import { isApprovalWaiting } from '@pipeline/utils/approvalUtils'
import css from './HarnessApprovalLogsView.module.scss'

export function HarnessApprovalLogsView(props: ConsoleViewStepDetailProps) {
  const { getString } = useStrings()
  const step = props.step
  const isWaiting = isExecutionWaiting(step.status)
  const approvalInstanceId = get(step, 'executableResponses[0].async.callbackIds[0]') || ''
  const [approvalData, setApprovalData] = React.useState<ApprovalData>(null)
  const shouldFetchData = !!approvalInstanceId

  const isWaitingAll = isWaiting && approvalData && isApprovalWaiting(approvalData.status)

  const {
    data,
    // refetch,
    loading: loadingApprovalData
    // error
  } = useGetApprovalInstance({
    approvalInstanceId,
    lazy: !shouldFetchData
  })

  const {
    data: authData,
    // refetch: refetchAuthData,
    loading: loadingAuthData
  } = useGetHarnessApprovalInstanceAuthorization({
    approvalInstanceId,
    lazy: !shouldFetchData
  })

  const isCurrentUserAuthorized = !!authData?.data?.authorized
  const currentUserUnAuthorizedReason = authData?.data?.reason

  useDeepCompareEffect(() => {
    setApprovalData(data?.data as ApprovalData)
  }, [data])

  let approveButtonNode: React.ReactNode = null

  if (loadingApprovalData || loadingAuthData || !shouldFetchData) {
    approveButtonNode = (
      <div className={css.loadingContainer}>
        <Spinner size={Spinner.SIZE_SMALL} />
      </div>
    )
  } else if (isWaitingAll && !isCurrentUserAuthorized) {
    approveButtonNode = (
      <div className={classnames(css.approvalRow, css.error)}>
        {currentUserUnAuthorizedReason
          ? currentUserUnAuthorizedReason
          : approvalData?.details?.approvers?.disallowPipelineExecutor
          ? getString('pipeline.approvalStep.disallowedApproverExecution')
          : getString('pipeline.approvalStep.notAuthorizedExecution')}
      </div>
    )
  } else if (isWaitingAll && isCurrentUserAuthorized) {
    approveButtonNode = (
      <div className={css.approvalRow}>{getString('pipeline.approvalStage.approvalStageLogsViewMessage')}</div>
    )
  }

  const renderLogs = (renderLogsProps: RenderLogsInterface) => {
    return (
      <div>
        {approveButtonNode}
        {logsRenderer(renderLogsProps)}
      </div>
    )
  }
  return <DefaultConsoleViewStepDetails {...props} renderLogs={renderLogs} />
}
