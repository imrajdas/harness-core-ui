/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import isMatch from 'lodash-es/isMatch'
import has from 'lodash-es/has'
import { get } from 'lodash-es'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import type { PipelineInfoConfig } from 'services/pipeline-ng'
import { validateCICodebase, validatePipeline } from '../StepUtil'
import {
  pipelineTemplateWithRuntimeInput,
  pipelineWithNoBuildInfo,
  pipelineWithBranchBuild,
  pipelineWithTagBuild,
  pipelineWithDeploymentStage,
  templateWithRuntimeTimeout,
  pipelineTemplateOriginalPipeline,
  pipelineTemplateTemplate,
  pipelineTemplateResolvedPipeline
} from './mock'

jest.mock('@common/utils/YamlUtils', () => ({
  validateJSONWithSchema: jest.fn(() => Promise.resolve(new Map())),
  useValidationError: () => ({ errorMap: new Map() })
}))

describe('Test StepUtils', () => {
  test('Test validateCICodebase method for pipeline without build info', () => {
    const errors = validateCICodebase({
      // eslint-disable-next-line
      // @ts-ignore
      pipeline: pipelineWithNoBuildInfo as PipelineInfoConfig,
      // eslint-disable-next-line
      // @ts-ignore
      originalPipeline: pipelineWithNoBuildInfo as PipelineInfoConfig,
      // eslint-disable-next-line
      // @ts-ignore
      template: pipelineTemplateWithRuntimeInput as PipelineInfoConfig,
      viewType: StepViewType.InputSet
    })
    expect(isMatch(errors, { properties: { ci: { codebase: { build: {} } } } })).toBeTruthy()
  })

  test('Test validateCICodebase method for pipeline with build as run time info', () => {
    const errors = validateCICodebase({
      // eslint-disable-next-line
      // @ts-ignore
      pipeline: pipelineWithNoBuildInfo as PipelineInfoConfig,
      // eslint-disable-next-line
      // @ts-ignore
      originalPipeline: pipelineWithNoBuildInfo as PipelineInfoConfig,
      // eslint-disable-next-line
      // @ts-ignore
      template: pipelineTemplateWithRuntimeInput as PipelineInfoConfig,
      viewType: StepViewType.InputSet
    })
    expect(isMatch(errors, { properties: { ci: { codebase: { build: {} } } } })).toBeTruthy()
    expect(has(errors, 'properties.ci.codebase.build.type')).toBeTruthy()
  })

  test('Test validateCICodebase method for pipeline with branch build', () => {
    const errors = validateCICodebase({
      pipeline: pipelineWithBranchBuild as PipelineInfoConfig,
      originalPipeline: pipelineWithBranchBuild as PipelineInfoConfig,
      // eslint-disable-next-line
      // @ts-ignore
      template: pipelineTemplateWithRuntimeInput as PipelineInfoConfig,
      viewType: StepViewType.InputSet
    })
    expect(isMatch(errors, { properties: { ci: { codebase: { build: { spec: {} } } } } })).toBeTruthy()
    expect(has(errors, 'properties.ci.codebase.build.spec.branch')).toBeTruthy()
  })

  test('Test validateCICodebase method for pipeline with tag build', () => {
    const errors = validateCICodebase({
      pipeline: pipelineWithTagBuild as PipelineInfoConfig,
      originalPipeline: pipelineWithTagBuild as PipelineInfoConfig,
      // eslint-disable-next-line
      // @ts-ignore
      template: pipelineTemplateWithRuntimeInput as PipelineInfoConfig,
      viewType: StepViewType.InputSet
    })
    expect(isMatch(errors, { properties: { ci: { codebase: { build: { spec: {} } } } } })).toBeTruthy()
    expect(has(errors, 'properties.ci.codebase.build.spec.tag')).toBeTruthy()
  })
  test('Test validateCodebase method for pipeline with deployment stage', () => {
    const errors = validatePipeline({
      pipeline: pipelineWithDeploymentStage as PipelineInfoConfig,
      originalPipeline: pipelineWithDeploymentStage as PipelineInfoConfig,
      // eslint-disable-next-line
      // @ts-ignore
      template: templateWithRuntimeTimeout as PipelineInfoConfig,
      viewType: StepViewType.DeploymentForm
    })
    expect(isMatch(errors, { timeout: 'Invalid syntax provided' })).toBeTruthy()
  })

  test('Test requires Connector and RepoName only when all CI Codebase fields are runtime inputs', () => {
    const errors = validatePipeline({
      pipeline: {
        identifier: 'cicodebaseallfieldsruntime',
        template: {
          templateInputs: {
            properties: {
              ci: {
                codebase: {
                  connectorRef: '',
                  repoName: '',
                  build: {
                    spec: {}
                  },
                  depth: 50,
                  sslVerify: true,
                  prCloneStrategy: 'MergeCommit',
                  resources: {
                    limits: {
                      memory: '500Mi',
                      cpu: '400m'
                    }
                  }
                }
              }
            }
          }
        }
      } as any,
      originalPipeline: pipelineTemplateOriginalPipeline as PipelineInfoConfig,
      // eslint-disable-next-line
      // @ts-ignore
      template: pipelineTemplateTemplate as PipelineInfoConfig,
      resolvedPipeline: pipelineTemplateResolvedPipeline as any,
      viewType: StepViewType.DeploymentForm
    })

    const errorKeys = Object.keys(get(errors, 'template.templateInputs.properties.ci.codebase') || {})
    expect(errorKeys).toContain('connectorRef')
    expect(errorKeys).toContain('repoName')
  })
  test('Test pipeline template requires Connector and RepoName only when all CI Codebase fields are runtime inputs', () => {
    const errors = validatePipeline({
      pipeline: {
        identifier: 'cicodebaseallfieldsruntime',
        template: {
          templateInputs: {
            properties: {
              ci: {
                codebase: {
                  connectorRef: 'githubconnector',
                  repoName: 'repo',
                  build: {
                    spec: {}
                  },
                  depth: 50,
                  sslVerify: true,
                  prCloneStrategy: 'abc',
                  resources: {
                    limits: {
                      memory: 'abc',
                      cpu: 'abc'
                    }
                  }
                }
              }
            }
          }
        }
      } as any,
      originalPipeline: pipelineTemplateOriginalPipeline as PipelineInfoConfig,
      // eslint-disable-next-line
      // @ts-ignore
      template: pipelineTemplateTemplate as PipelineInfoConfig,
      resolvedPipeline: pipelineTemplateResolvedPipeline as any,
      viewType: StepViewType.DeploymentForm
    })

    const errorKeys = Object.keys(get(errors, 'template.templateInputs.properties.ci.codebase') || {})
    expect(errorKeys).not.toContain('connectorRef')
    expect(errorKeys).not.toContain('repoName')
    expect(errorKeys).toContain('build')
    expect(errorKeys).toContain('prCloneStrategy')
    expect(errorKeys).toContain('resources')
  })
})
