/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { getIconForTemplate, getTypeForTemplate } from '@templates-library/pages/TemplatesPage/TemplatesPageUtils'
import type { StringKeys } from 'framework/strings'
import {
  pipelineTemplateMock,
  stageTemplateMock,
  stepTemplateMock
} from '@templates-library/components/TemplateStudio/__tests__/stateMock'
import { stagesCollection } from '@pipeline/components/PipelineStudio/Stages/StagesCollection'
import { StageType } from '@pipeline/utils/stageHelpers'
// eslint-disable-next-line no-restricted-imports
import { getStageAttributes, getStageEditorImplementation } from '@cd/components/PipelineStudio/DeployStage'
import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
// eslint-disable-next-line no-restricted-imports
import { HttpStep } from '@cd/components/PipelineSteps/HttpStep/HttpStep'

function getString(key: StringKeys): StringKeys {
  return key
}

describe('TemplatesPageUtils tests', () => {
  beforeAll(() => {
    stagesCollection.registerStageFactory(StageType.DEPLOY, getStageAttributes, getStageEditorImplementation)
    factory.registerStep(new HttpStep())
  })
  test('Test getIconForTemplate method', () => {
    expect(getIconForTemplate(getString, stepTemplateMock)).toEqual('http-step')
    expect(getIconForTemplate(getString, stageTemplateMock)).toEqual('cd-main')
    expect(getIconForTemplate(getString, pipelineTemplateMock)).toEqual('pipeline')
  })
  test('Test getTypeForTemplate method', () => {
    expect(getTypeForTemplate(getString, stepTemplateMock)).toEqual('HTTP Step')
    expect(getTypeForTemplate(getString, stageTemplateMock)).toEqual('pipelineSteps.deploy.create.deployStageName')
    expect(getTypeForTemplate(getString, pipelineTemplateMock)).toEqual(undefined)
  })
})
