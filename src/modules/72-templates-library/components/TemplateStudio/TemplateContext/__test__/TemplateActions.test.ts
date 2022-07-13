/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import {
  initialState,
  TemplateReducer,
  TemplateViewData
} from '@templates-library/components/TemplateStudio/TemplateContext/TemplateReducer'
import {
  DrawerTypes,
  TemplateActions,
  TemplateContextActions
} from '@templates-library/components/TemplateStudio/TemplateContext/TemplateActions'
import { stageTemplateMock } from '@templates-library/components/TemplateStudio/__tests__/stateMock'
import type { YamlBuilderHandlerBinding } from '@common/interfaces/YAMLBuilderProps'

describe('TemplateActions test', () => {
  test('TemplateActions Initialize', () => {
    const newState = TemplateReducer(initialState, { ...TemplateContextActions.initialized(), response: undefined })
    expect(newState).toEqual({ ...initialState, isInitialized: true })
  })

  test('TemplateActions DBInitialize', () => {
    const newState = TemplateReducer(initialState, { ...TemplateContextActions.dbInitialized(), response: undefined })
    expect(newState).toEqual({ ...initialState, isDBInitialized: true })
  })

  test('TemplateActions SetYamlHandler', () => {
    const resp = {
      yamlHandler: {
        getLatestYaml: jest.fn(),
        getYAMLValidationErrorMap: jest.fn()
      } as YamlBuilderHandlerBinding
    }
    const newState = TemplateReducer(initialState, { ...TemplateContextActions.setYamlHandler(resp) })
    expect(newState).toEqual({ ...initialState, yamlHandler: resp.yamlHandler })
  })

  test('TemplateActions UpdateTemplateView', () => {
    const templateViewData: TemplateViewData = {
      isDrawerOpened: false,
      isYamlEditable: true,
      drawerData: {
        type: DrawerTypes.TemplateVariables
      }
    }
    const newState = TemplateReducer(initialState, {
      ...TemplateContextActions.updateTemplateView({ templateView: templateViewData })
    })
    expect(newState).toEqual({ ...initialState, templateView: templateViewData })
  })

  test('TemplateActions UpdateTemplate', () => {
    const newState = TemplateReducer(initialState, {
      type: TemplateActions.UpdateTemplate,
      response: { template: stageTemplateMock, isUpdated: false }
    })
    expect(newState).toEqual({ ...initialState, template: stageTemplateMock, isUpdated: false })
  })

  test('TemplateActions Loading', () => {
    const newState = TemplateReducer(initialState, { ...TemplateContextActions.loading({ isLoading: true }) })
    expect(newState).toEqual({ ...initialState, isLoading: true })
  })

  test('TemplateActions Fetching', () => {
    const newState = TemplateReducer(initialState, { ...TemplateContextActions.fetching() })
    expect(newState).toEqual({ ...initialState, isLoading: true, isBETemplateUpdated: false, isUpdated: false })
  })

  test('TemplateActions Success', () => {
    const resp = { template: stageTemplateMock }
    const newState = TemplateReducer(initialState, { ...TemplateContextActions.success(resp) })
    expect(newState).toEqual({ ...initialState, isLoading: false, ...resp })
  })

  test('TemplateActions Error', () => {
    const resp = { template: stageTemplateMock }
    const newState = TemplateReducer(initialState, { ...TemplateContextActions.error(resp) })
    expect(newState).toEqual({ ...initialState, isLoading: false, ...resp })
  })

  test('TemplateActions Default', () => {
    const newState = TemplateReducer(initialState, { type: 'none' as TemplateActions })
    expect(newState).toEqual({ ...initialState })
  })
})
