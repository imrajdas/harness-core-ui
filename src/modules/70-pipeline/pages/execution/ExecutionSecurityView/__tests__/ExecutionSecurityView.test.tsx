/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import mockImport from 'framework/utils/mockImport'
import ExecutionSecurityView from '../ExecutionSecurityView'

describe('<ExecutionSecurityView /> tests', () => {
  test('Should render', () => {
    mockImport('@pipeline/context/ExecutionContext', {
      useExecutionContext: () => {
        return {
          pipelineExecutionDetail: {
            pipelineExecutionSummary: {}
          }
        }
      }
    })

    const { container } = render(
      <TestWrapper>
        <ExecutionSecurityView />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('Should render null when pipeline execution context is null', () => {
    mockImport('@pipeline/context/ExecutionContext', {
      useExecutionContext: jest.fn()
    })

    const { container } = render(
      <TestWrapper>
        <ExecutionSecurityView />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})
