/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'

import { MultiTypeInputType } from '@wings-software/uicore'
import { TestWrapper } from '@common/utils/testUtils'
import {
  PipelineContext,
  PipelineContextInterface,
  PipelineContextType
} from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { DrawerTypes } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineActions'
import { factory } from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'
import { CustomVariables } from '@pipeline/components/PipelineSteps/Steps/CustomVariables/CustomVariables'
import { Scope } from '@common/interfaces/SecretsInterface'
import StageOverview from '../StageOverview'

jest.mock('@common/components/YAMLBuilder/YamlBuilder')

factory.registerStep(new CustomVariables())

const getPipelineContext = (): PipelineContextInterface => ({
  state: {
    pipeline: { name: '', identifier: '', stages: [] },
    originalPipeline: { name: '', identifier: '', stages: [] },
    pipelineView: {
      isSplitViewOpen: true,
      isDrawerOpened: false,
      isYamlEditable: false,
      drawerData: { type: DrawerTypes.AddStep },
      splitViewData: {}
    },
    schemaErrors: false,
    gitDetails: {},
    entityValidityDetails: {},
    selectionState: {},
    pipelineIdentifier: '',
    isBEPipelineUpdated: false,
    isDBInitialized: true,
    isInitialized: true,
    isLoading: false,
    isUpdated: true,
    templateTypes: {}
  },
  contextType: PipelineContextType.Pipeline,
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
  setSchemaErrorView: jest.fn(),
  updatePipelineStoreMetadata: jest.fn(),
  updateGitDetails: jest.fn(),
  updateEntityValidityDetails: jest.fn(),
  stagesMap: {},
  isReadonly: false,
  scope: Scope.PROJECT,
  renderPipelineStage: jest.fn(),
  fetchPipeline: jest.fn(),
  setYamlHandler: jest.fn(),
  updatePipeline: jest.fn(),
  updatePipelineView: jest.fn(),
  updateStage: jest.fn(),
  getStageFromPipeline: jest.fn(() => ({ stage: undefined, parent: undefined })),
  deletePipelineCache: jest.fn(),
  runPipeline: jest.fn(),
  pipelineSaved: jest.fn(),
  view: 'ui',
  setView: jest.fn(),
  stepsFactory: factory,
  setSelectedStageId: jest.fn(),
  setSelectedStepId: jest.fn(),
  setSelectedSectionId: jest.fn(),
  setSelection: jest.fn(),
  getStagePathFromPipeline: jest.fn(),
  setTemplateTypes: jest.fn()
})

describe('StepWidget tests', () => {
  test(`renders DeployStageSpecifications without crashing `, () => {
    const { container } = render(
      <TestWrapper>
        <PipelineContext.Provider value={getPipelineContext()}>
          <StageOverview />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})
