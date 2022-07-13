/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Icon } from '@wings-software/uicore'
import { render } from '@testing-library/react'
import { renderHook } from '@testing-library/react-hooks'
import { useStrings } from 'framework/strings'
import { TestWrapper } from '@common/utils/testUtils'
import DetailPageCard, { ContentType } from '../DetailPageCard'

const wrapper = ({ children }: React.PropsWithChildren<unknown>): React.ReactElement => (
  <TestWrapper>{children}</TestWrapper>
)
const { result } = renderHook(() => useStrings(), { wrapper })

describe('DetailPageCard tests', () => {
  test('Render text content type', async () => {
    const { container } = render(
      <TestWrapper>
        <DetailPageCard
          title={result.current.getString('overview')}
          content={[
            {
              label: result.current.getString('common.triggerName'),
              value: 'name'
            },
            {
              label: result.current.getString('description'),
              value: 'description'
            },
            {
              label: result.current.getString('identifier'),
              value: 'identifier'
            }
          ]}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
  test('Render custom content type', async () => {
    const { container } = render(
      <TestWrapper>
        <DetailPageCard
          title={result.current.getString('overview')}
          content={[
            {
              label: 'Icon',
              value: <Icon size={16} name="library" />,
              type: ContentType.CUSTOM
            },
            {
              label: result.current.getString('triggers.pipelineExecutionInput'),
              value: <pre>code</pre>,
              type: ContentType.CUSTOM
            }
          ]}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('Render hideOnUndefinedValue content type only when applicable', async () => {
    const { container } = render(
      <TestWrapper>
        <DetailPageCard
          title={result.current.getString('overview')}
          content={[
            {
              label: 'Code',
              value: <pre>code</pre>,
              hideOnUndefinedValue: true,
              type: ContentType.CUSTOM
            },
            {
              label: '',
              value: undefined,
              hideOnUndefinedValue: true,
              type: ContentType.CUSTOM
            }
          ]}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})
