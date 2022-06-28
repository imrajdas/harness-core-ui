/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'

import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import GetStartedWithCI from '../GetStartedWithCI'

describe('Test Get Started With CI', () => {
  test('initial render', async () => {
    const { getByText } = render(
      <TestWrapper
        path="/account/:accountId/ci/orgs/:orgId/projects/:projectId/get-started"
        pathParams={{ accountId: 'test_account_id', orgId: 'orgId', projectId: 'projId' }}
        queryParams={{ experience: 'TRIAL' }}
      >
        <GetStartedWithCI />
      </TestWrapper>
    )
    expect(getByText('common.getStarted.firstPipeline')).toBeTruthy()
    const createPipelineBtn = getByText('getStarted')
    expect(createPipelineBtn).toBeInTheDocument()
  })
})
