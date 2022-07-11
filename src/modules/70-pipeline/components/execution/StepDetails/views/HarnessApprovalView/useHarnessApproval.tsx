/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  ResponseApprovalInstanceResponse,
  ResponseHarnessApprovalInstanceAuthorization,
  useGetApprovalInstance,
  useGetHarnessApprovalInstanceAuthorization
} from 'services/pipeline-ng'
import { useDeepCompareEffect } from '@common/hooks'
import type { ApprovalData } from '@pipeline/components/execution/StepDetails/tabs/HarnessApprovalTab/HarnessApprovalTab'

export type ApprovalMock = {
  data?: ResponseApprovalInstanceResponse
  loading?: boolean
}

export type AuthMock = {
  loading: boolean
  data: ResponseHarnessApprovalInstanceAuthorization
}

interface UseHarnessApprovalPropsInterface {
  approvalInstanceId: string
  mock?: ApprovalMock
  getApprovalAuthorizationMock?: AuthMock
}

export const useHarnessApproval = ({
  approvalInstanceId,
  mock,
  getApprovalAuthorizationMock
}: UseHarnessApprovalPropsInterface) => {
  // store the data in state because the approve/reject call returns the updated state
  // hence we can save one additional call to the server
  const [approvalData, setApprovalData] = React.useState<ApprovalData>(null)
  const shouldFetchData = !!approvalInstanceId
  const {
    data,
    refetch,
    loading: loadingApprovalData,
    error
  } = useGetApprovalInstance({
    approvalInstanceId,
    mock,
    lazy: !shouldFetchData
  })

  const {
    data: authData,
    refetch: refetchAuthData,
    loading: loadingAuthData
  } = useGetHarnessApprovalInstanceAuthorization({
    approvalInstanceId,
    lazy: !shouldFetchData,
    mock: getApprovalAuthorizationMock
  })

  useDeepCompareEffect(() => {
    setApprovalData(data?.data as ApprovalData)
  }, [data])

  return {
    authData,
    refetchAuthData,
    approvalData,
    setApprovalData,
    loadingApprovalData,
    loadingAuthData,
    shouldFetchData,
    refetch,
    error
  }
}
