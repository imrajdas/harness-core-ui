/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { TemplateContext } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateContext'
import { RightBar } from '@templates-library/components/TemplateStudio/RightBar/RightBar'
import { getTemplateContextMock } from '@templates-library/components/TemplateStudio/__tests__/stateMock'
import { TemplateType } from '@templates-library/utils/templatesUtils'
import { DrawerTypes } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateActions'

jest.mock('@templates-library/components/TemplateStudio/RightDrawer/RightDrawer', () => ({
  ...(jest.requireActual('@templates-library/components/TemplateStudio/RightDrawer/RightDrawer') as any),
  RightDrawer: () => {
    return <div className="template-studio-right-drawer-mock"></div>
  }
}))

const stepTemplateContextMock = getTemplateContextMock(TemplateType.Step)

describe('RightBar', () => {
  test('should match snapshot', () => {
    const { container } = render(
      <TestWrapper>
        <TemplateContext.Provider value={stepTemplateContextMock}>
          <RightBar />
        </TemplateContext.Provider>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should open variales panel on clicking variables button', async () => {
    const { getByText } = render(
      <TestWrapper>
        <TemplateContext.Provider value={stepTemplateContextMock}>
          <RightBar />
        </TemplateContext.Provider>
      </TestWrapper>
    )
    const variableBtn = getByText('pipeline.templateInputs')
    act(() => {
      fireEvent.click(variableBtn)
    })
    await waitFor(() => expect(stepTemplateContextMock.updateTemplateView).toHaveBeenCalled())
    expect(stepTemplateContextMock.updateTemplateView).toHaveBeenCalledWith({
      drawerData: {
        type: DrawerTypes.TemplateInputs
      },
      isDrawerOpened: true,
      isYamlEditable: false
    })
  })

  test('should open inputs panel on clicking inputs button', async () => {
    const { getByText } = render(
      <TestWrapper>
        <TemplateContext.Provider value={stepTemplateContextMock}>
          <RightBar />
        </TemplateContext.Provider>
      </TestWrapper>
    )
    const variableBtn = getByText('common.variables')
    act(() => {
      fireEvent.click(variableBtn)
    })
    await waitFor(() => expect(stepTemplateContextMock.updateTemplateView).toHaveBeenCalled())
    expect(stepTemplateContextMock.updateTemplateView).toHaveBeenCalledWith({
      drawerData: {
        type: DrawerTypes.TemplateVariables
      },
      isDrawerOpened: true,
      isYamlEditable: false
    })
  })
})
