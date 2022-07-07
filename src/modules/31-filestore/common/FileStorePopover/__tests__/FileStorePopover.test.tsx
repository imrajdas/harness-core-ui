/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { fireEvent, render, waitFor } from '@testing-library/react'
import React from 'react'
import { TestWrapper } from '@common/utils/testUtils'
import FileStorePopover, { FileStorePopoverItem } from '@filestore/common/FileStorePopover/FileStorePopover'

import { FileStoreActionTypes } from '@filestore/utils/constants'

const menuItemCallBack = jest.fn()

const menuItems: FileStorePopoverItem[] = [
  {
    label: 'testLabel',
    onClick: menuItemCallBack,
    actionType: FileStoreActionTypes.CREATE_NODE
  }
]

describe('FileStorePopover', () => {
  // eslint-disable-next-line jest/no-disabled-tests
  test.skip('render', async () => {
    const { findByText, getByTestId } = render(
      <TestWrapper>
        <FileStorePopover icon="plus" btnText="testBtnText" items={menuItems} />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(getByTestId('newFileButton')).toBeDefined()
    })

    fireEvent.click(getByTestId('newFileButton'))
    expect(await findByText('testLabel')).toBeInTheDocument()

    fireEvent.click(await findByText('testLabel'))
    expect(menuItemCallBack).toHaveBeenCalled()
  })
})
