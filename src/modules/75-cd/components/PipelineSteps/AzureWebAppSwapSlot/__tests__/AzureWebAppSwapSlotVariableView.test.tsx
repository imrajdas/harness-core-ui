/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'

import { TestWrapper } from '@common/utils/testUtils'
import type { AzureWebAppSwapSlotVariableStepProps } from '../SwapSlot.types'
import { AzureWebAppSwapSlotVariableStep } from '../AzureWebAppSwapSlotVariableView'
jest.mock('@common/components/YAMLBuilder/YamlBuilder')

const props = () =>
  ({
    initialValues: {
      type: StepType.AzureSwapSlot,
      name: 'swap slot',
      timeout: '10m',
      identifier: 'swap slot',
      spec: {}
    },
    stageIdentifier: 'qaStage',
    onUpdate: jest.fn(),
    metadataMap: {},
    variablesData: {
      type: StepType.AzureSwapSlot,
      name: 'swap slot',
      timeout: '10m',
      identifier: 'swap slot',
      spec: {}
    },
    stepType: StepType.AzureSwapSlot
  } as AzureWebAppSwapSlotVariableStepProps)

describe('Azure Web App Swap Slot step Variable view ', () => {
  test('initial render', () => {
    const { container } = render(
      <AzureWebAppSwapSlotVariableStep
        initialValues={{
          type: StepType.AzureSwapSlot,
          name: 'swap slot',
          timeout: '10m',
          identifier: 'swap slot',
          spec: {}
        }}
        {...{
          stageIdentifier: 'qaStage',
          metadataMap: props().metadataMap,
          variablesData: props().variablesData
        }}
      />
    )

    expect(container).toMatchSnapshot()
  })

  test('initial render inline with no values', () => {
    const { container } = render(
      <TestWrapper>
        <AzureWebAppSwapSlotVariableStep
          initialValues={{
            type: StepType.AzureSwapSlot,
            name: '',
            timeout: '',
            identifier: '',
            spec: {}
          }}
          {...{
            stageIdentifier: 'qaStage',
            metadataMap: props().metadataMap,
            variablesData: props().variablesData
          }}
        />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test('should render with inline config', () => {
    const { container } = render(
      <TestWrapper>
        <AzureWebAppSwapSlotVariableStep {...props()} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})
