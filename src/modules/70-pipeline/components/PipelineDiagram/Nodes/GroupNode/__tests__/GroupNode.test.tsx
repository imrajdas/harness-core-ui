/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, act, fireEvent, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import GroupNode from '../GroupNode'

const nodeData = {
  id: 'kh5oXTv4RAmATuzxgw7AVw',
  identifier: 'rt2',
  type: 'Deployment',
  name: 'rt',
  icon: 'cd-main',
  status: 'Success',

  data: {
    status: 'Success'
  }
}

const groupNodeData = {
  ...nodeData,
  children: [
    { ...nodeData, id: 'kh5oXTv4RAmATuzxgw7AVw' },
    { ...nodeData, id: 'kh5oXTv4RAmATuzxgw7AVw', status: 'Running' },
    { ...nodeData, id: 'iJXDyTmqQF2pdpRrOzmkTg', status: 'Failed' }
  ],
  isSelected: false,
  isParallelNode: true,
  allowAdd: false,
  intersectingIndex: 1,
  readonly: true,
  selectedNodeId: 'kh5oXTv4RAmATuzxgw7AVw',
  getNode: jest.fn(() => null)
}

describe('GroupNode tests', () => {
  test('renders ok', async () => {
    const { container } = render(
      <TestWrapper>
        <GroupNode {...groupNodeData} />
      </TestWrapper>
    )
    const defaultNode = container.getElementsByClassName('defaultNode')
    const defaultCard = container.getElementsByClassName('defaultCard')
    await waitFor(() => expect(defaultNode).toBeDefined())
    await waitFor(() => expect(defaultCard).toBeDefined())
    let dynamicPopover = document.querySelector('[class*="dynamicPopover"]')
    expect(dynamicPopover).toBeNull()
    act(() => {
      fireEvent.click(defaultNode[0])
    })
    dynamicPopover = document.querySelector('[class*="dynamicPopover"]')
    expect(dynamicPopover).toBeDefined()
    act(() => {
      fireEvent.mouseOver(defaultNode[0] as Element)
    })
    expect(container).toMatchSnapshot()
  })
  test('AddLinkNode not visible on readonly', () => {
    const { container } = render(
      <TestWrapper>
        <GroupNode
          {...groupNodeData}
          allowAdd={true}
          readonly={false}
          intersectingIndex={0.8}
          selectedNodeId="q74FA-PgQ2KrCz5KJeBj9w"
        />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })
})
