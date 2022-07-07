/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@common/utils/testUtils'
import SliderBar from '../SliderBar'

const setValueMock = jest.fn()
const props = {
  min: 0,
  max: 100,
  stepSize: 1,
  labelStepSize: 10,
  value: 5,
  setValue: setValueMock
}

describe('SliderBar', () => {
  test('input', async () => {
    const { container } = render(
      <TestWrapper>
        <SliderBar {...props} />
      </TestWrapper>
    )
    await waitFor(() => {
      expect(container).toMatchSnapshot()
    })
  })

  test('dropdown', async () => {
    const dropdownProps = {
      ...props,
      stepSize: 5,
      list: [0, 5, 10],
      unit: 'm'
    }
    const { container } = render(
      <TestWrapper>
        <SliderBar {...dropdownProps} />
      </TestWrapper>
    )
    await waitFor(() => {
      expect(container).toMatchSnapshot()
    })
  })

  test('dropdown click', async () => {
    const dropdownProps = {
      ...props,
      stepSize: 5,
      list: [0, 5, 10],
      unit: 'm'
    }
    const { container, getByTestId } = render(
      <TestWrapper>
        <SliderBar {...dropdownProps} />
      </TestWrapper>
    )

    const dropdown = getByTestId('slider-dropdown')
    fireEvent.click(dropdown)

    const listItem = container.getElementsByClassName('DropDown--menuItem')[1]
    fireEvent.click(listItem)
    expect(listItem).toHaveTextContent('5m')
    await waitFor(() => {
      expect(setValueMock).toHaveBeenCalledWith(5)
    })
  })

  test('input setValue', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <SliderBar {...props} />
      </TestWrapper>
    )
    userEvent.clear(getByTestId('slider-input'))
    userEvent.type(getByTestId('slider-input'), '20')
    expect(setValueMock).toHaveBeenCalledWith(20)
  })
})
