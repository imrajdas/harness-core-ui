/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, render } from '@testing-library/react'
import { waitFor } from '@testing-library/dom'
import produce from 'immer'
import { set } from 'lodash-es'
import { TestWrapper } from '@common/utils/testUtils'
import { templateSelectorContextMock } from 'framework/Templates/TemplateSelectorContext/stateMocks'
import { TemplateSelectorDrawer } from '../TemplateSelectorDrawer'

jest.mock('@blueprintjs/core', () => ({
  ...(jest.requireActual('@blueprintjs/core') as any),
  // eslint-disable-next-line react/display-name
  Drawer: ({ children, title }: any) => (
    <div className="drawer-mock">
      {title}
      {children}
    </div>
  )
}))

jest.mock('@templates-library/components/TemplateSelector/TemplateSelector', () => ({
  ...jest.requireActual('@templates-library/components/TemplateSelector/TemplateSelector'),
  TemplateSelector: () => {
    return <div className="template-selector-mock"></div>
  }
}))

const contextMock = produce(templateSelectorContextMock, draft => {
  set(draft, 'state.isDrawerOpened', true)
})

describe('<TemplateSelectorDrawer /> tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should match snapshot', async () => {
    const { container } = render(
      <TestWrapper defaultTemplateSelectorValues={contextMock}>
        <TemplateSelectorDrawer />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should close drawer on clicking close button', async () => {
    const { getByRole } = render(
      <TestWrapper defaultTemplateSelectorValues={contextMock}>
        <TemplateSelectorDrawer />
      </TestWrapper>
    )
    const closeBtn = getByRole('button', { name: 'cross' })
    act(() => {
      fireEvent.click(closeBtn)
    })
    await waitFor(() => expect(contextMock.state.selectorData?.onCancel).toBeCalled())
  })
})
