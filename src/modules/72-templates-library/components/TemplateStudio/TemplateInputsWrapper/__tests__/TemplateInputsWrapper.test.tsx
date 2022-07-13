/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import produce from 'immer'
import { TestWrapper } from '@common/utils/testUtils'
import { TemplateInputsWrapper } from '@templates-library/components/TemplateStudio/TemplateInputsWrapper/TemplateInputsWrapper'
import { TemplateContext } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateContext'
import {
  getTemplateContextMock,
  stepTemplateMock
} from '@templates-library/components/TemplateStudio/__tests__/stateMock'
import { TemplateType } from '@templates-library/utils/templatesUtils'
import * as TemplateInputs from '@templates-library/components/TemplateInputs/TemplateInputs'
import type { TemplateInputsProps } from '@templates-library/components/TemplateInputs/TemplateInputs'

const TemplateInputsMock = jest
  .spyOn(TemplateInputs, 'TemplateInputs')
  .mockImplementation((_props: TemplateInputsProps) => <div className={'template-inputs-mock'} />)

const templateContext = produce(getTemplateContextMock(TemplateType.Step), draft => {
  draft.state.gitDetails = {
    repoIdentifier: 'repoIdentifier',
    branch: 'branch'
  }
})

describe('<TemplateInputsWrapper /> tests', () => {
  test('should call TemplateInputs with correct data', () => {
    render(
      <TestWrapper>
        <TemplateContext.Provider value={templateContext}>
          <TemplateInputsWrapper />
        </TemplateContext.Provider>
      </TestWrapper>
    )
    expect(TemplateInputsMock).toBeCalledWith(
      { template: { ...stepTemplateMock, repo: 'repoIdentifier', branch: 'branch' } },
      expect.anything()
    )
  })
})
