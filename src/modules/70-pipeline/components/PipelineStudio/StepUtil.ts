/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { FormikErrors, yupToFormErrors } from 'formik'
import { getMultiTypeFromValue, MultiTypeInputType, RUNTIME_INPUT_VALUE } from '@harness/uicore'
import { isEmpty, has, set, isBoolean, get } from 'lodash-es'
import * as Yup from 'yup'
import type { K8sDirectInfraYaml } from 'services/ci'
import type { DeploymentStageConfig, Infrastructure } from 'services/cd-ng'

import type { UseStringsReturn } from 'framework/strings'
import { getDurationValidationSchema } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import type {
  TemplateStepNode,
  StageElementWrapperConfig,
  StepElementConfig,
  PipelineInfoConfig,
  ExecutionWrapperConfig,
  StageElementConfig
} from 'services/pipeline-ng'
import { ServiceDeploymentType } from '@pipeline/utils/stageHelpers'
import { getPrCloneStrategyOptions } from '@pipeline/utils/constants'
import { CodebaseTypes, isCloneCodebaseEnabledAtLeastOneStage } from '@pipeline/utils/CIUtils'
import type { DeployStageConfig, InfraStructureDefinitionYaml } from '@pipeline/utils/DeployStageInterface'
import factory from '../PipelineSteps/PipelineStepFactory'
import { StepType } from '../PipelineSteps/PipelineStepInterface'
// eslint-disable-next-line no-restricted-imports
import '@cd/components/PipelineSteps'
// eslint-disable-next-line no-restricted-imports
import '@ci/components/PipelineSteps'
// eslint-disable-next-line no-restricted-imports
import '@sto-steps/components/PipelineSteps'
import { StepViewType } from '../AbstractSteps/Step'

export function getStepFromStage(stepId: string, steps?: ExecutionWrapperConfig[]): ExecutionWrapperConfig | undefined {
  let responseStep: ExecutionWrapperConfig | undefined = undefined
  steps?.forEach(item => {
    if (item.step?.identifier === stepId) {
      responseStep = item
    } else if (item.stepGroup?.identifier === stepId) {
      responseStep = item
    } else if (item.parallel) {
      return item.parallel.forEach(node => {
        if (node.step?.identifier === stepId || node.stepGroup?.identifier === stepId) {
          responseStep = node
        }
      })
    }
  })
  return responseStep
}

export function getStageFromPipeline(
  stageId: string,
  pipeline?: PipelineInfoConfig
): StageElementWrapperConfig | undefined {
  if (pipeline?.stages) {
    let responseStage: StageElementWrapperConfig | undefined = undefined
    pipeline.stages.forEach(item => {
      if (item.stage && item.stage.identifier === stageId) {
        responseStage = item
      } else if (item.parallel) {
        return item.parallel.forEach(node => {
          if (node.stage?.identifier === stageId) {
            responseStage = node
          }
        })
      }
    })
    return responseStage
  }
  return
}

export interface ValidateStepProps {
  step: StepElementConfig | TemplateStepNode
  template?: StepElementConfig | TemplateStepNode
  originalStep?: ExecutionWrapperConfig
  getString?: UseStringsReturn['getString']
  viewType: StepViewType
}

export const validateStep = ({
  step,
  template,
  originalStep,
  getString,
  viewType
}: ValidateStepProps): FormikErrors<StepElementConfig> => {
  const errors = {}
  const isTemplateStep = !!(originalStep?.step as unknown as TemplateStepNode)?.template
  const stepType = isTemplateStep ? StepType.Template : (originalStep?.step as StepElementConfig)?.type
  const pipelineStep = factory.getStep(stepType)
  const errorResponse = pipelineStep?.validateInputSet({
    data: step,
    template: template,
    getString,
    viewType
  })
  if (!isEmpty(errorResponse)) {
    const suffix = isTemplateStep ? '.template.templateInputs' : ''
    set(errors, `step${suffix}`, errorResponse)
  }
  return errors
}

export interface ValidateStepsProps {
  steps: ExecutionWrapperConfig[]
  template?: ExecutionWrapperConfig[]
  originalSteps?: ExecutionWrapperConfig[]
  getString?: UseStringsReturn['getString']
  viewType: StepViewType
}

const validateSteps = ({
  steps,
  template,
  originalSteps,
  getString,
  viewType
}: ValidateStepsProps): FormikErrors<ExecutionWrapperConfig> => {
  const errors = {}
  steps.forEach((stepObj, index) => {
    if (stepObj.step) {
      const errorResponse = validateStep({
        step: stepObj.step,
        template: template?.[index].step,
        originalStep: getStepFromStage(stepObj.step.identifier, originalSteps),
        getString,
        viewType
      })
      if (!isEmpty(errorResponse)) {
        set(errors, `steps[${index}]`, errorResponse)
      }
    } else if (stepObj.parallel) {
      stepObj.parallel.forEach((stepParallel, indexP) => {
        if (stepParallel.step) {
          const errorResponse = validateStep({
            step: stepParallel.step,
            template: template?.[index]?.parallel?.[indexP]?.step,
            originalStep: getStepFromStage(stepParallel.step.identifier, originalSteps),
            getString,
            viewType
          })
          if (!isEmpty(errorResponse)) {
            set(errors, `steps[${index}].parallel[${indexP}]`, errorResponse)
          }
        }
      })
    } else if (stepObj.stepGroup) {
      const originalStepGroup = getStepFromStage(stepObj.stepGroup.identifier, originalSteps)
      if (stepObj.stepGroup.steps) {
        const errorResponse = validateSteps({
          steps: stepObj.stepGroup.steps,
          template: template?.[index]?.stepGroup?.steps,
          originalSteps: originalStepGroup?.stepGroup?.steps,
          getString,
          viewType
        })
        if (!isEmpty(errorResponse)) {
          set(errors, `steps[${index}].stepGroup.steps`, errorResponse)
        }
      }
    }
  })

  return errors
}

interface ValidateStageProps {
  stage: StageElementConfig
  template?: StageElementConfig
  viewType: StepViewType
  originalStage?: StageElementConfig
  getString?: UseStringsReturn['getString']
}

export const validateStage = ({
  stage,
  template,
  viewType,
  originalStage,
  getString
}: ValidateStageProps): FormikErrors<StageElementConfig> => {
  if (originalStage?.template) {
    const errors = validateStage({
      stage: stage.template?.templateInputs as StageElementConfig,
      template: template?.template?.templateInputs as StageElementConfig,
      viewType,
      originalStage: originalStage.template.templateInputs as StageElementConfig,
      getString
    })
    if (!isEmpty(errors)) {
      return set({}, 'template.templateInputs', errors)
    } else {
      return {}
    }
  } else {
    const errors = {}

    // Validation for infrastructure namespace
    // For CD spec is DeploymentStageConfig
    const stageConfig = stage.spec as DeploymentStageConfig | undefined
    const templateStageConfig = template?.spec as DeploymentStageConfig | undefined
    const originalStageConfig = originalStage?.spec as DeploymentStageConfig | undefined
    if (
      viewType !== StepViewType.InputSet && // no fields are required on InputSet creation
      isEmpty((stageConfig?.infrastructure as Infrastructure)?.spec?.namespace) &&
      getMultiTypeFromValue((templateStageConfig?.infrastructure as Infrastructure)?.spec?.namespace) ===
        MultiTypeInputType.RUNTIME
    ) {
      set(
        errors,
        'spec.infrastructure.spec.namespace',
        getString?.('fieldRequired', { field: getString?.('pipelineSteps.build.infraSpecifications.namespace') })
      )
    }
    if (stage.type === 'Deployment' && templateStageConfig?.serviceConfig?.serviceRef) {
      const step = factory.getStep(StepType.DeployService)
      const errorsResponse = step?.validateInputSet({
        data: stageConfig?.serviceConfig,
        template: templateStageConfig?.serviceConfig,
        getString,
        viewType
      })
      if (!isEmpty(errorsResponse)) {
        set(errors, 'spec.serviceConfig', errorsResponse)
      }
    }

    if (stage.type === 'Deployment' && (templateStageConfig as DeployStageConfig)?.environment) {
      const step = factory.getStep(StepType.DeployInfrastructure)
      const errorsResponse = step?.validateInputSet({
        data: stageConfig,
        template: templateStageConfig as DeployStageConfig,
        getString,
        viewType
      })

      if (!isEmpty(errorsResponse)) {
        set(errors, 'spec.environment', errorsResponse)
      }

      const infrastructureDefinitions = (stageConfig as DeployStageConfig).environment?.infrastructureDefinitions
      if (
        infrastructureDefinitions &&
        ((templateStageConfig as DeployStageConfig).environment?.infrastructureDefinitions as unknown as string) !==
          RUNTIME_INPUT_VALUE
      ) {
        infrastructureDefinitions.forEach((infrastructureDefinition: InfraStructureDefinitionYaml, index: number) => {
          const infrastructureStep = factory.getStep(infrastructureDefinition.inputs?.type as unknown as string)
          const infrastructureErrorsResponse = infrastructureStep?.validateInputSet({
            data: infrastructureDefinition.inputs?.spec,
            template: (templateStageConfig as DeployStageConfig).environment?.infrastructureDefinitions?.[index].inputs
              ?.spec,
            getString,
            viewType
          })

          if (!isEmpty(infrastructureErrorsResponse)) {
            set(
              errors,
              `spec.environment.infrastructureDefinitions[${index}].inputs.spec`,
              infrastructureErrorsResponse
            )
          }
        })
      }
    }

    if (stage.type === 'Deployment' && templateStageConfig?.infrastructure?.environmentRef) {
      const step = factory.getStep(StepType.DeployEnvironment)
      const errorsResponse = step?.validateInputSet({
        data: stageConfig?.infrastructure,
        template: templateStageConfig?.infrastructure,
        getString,
        viewType
      })
      if (!isEmpty(errorsResponse)) {
        set(errors, 'spec.infrastructure', errorsResponse)
      }
    }
    if (
      stageConfig?.infrastructure?.infrastructureDefinition?.spec &&
      originalStageConfig?.infrastructure?.infrastructureDefinition?.type
    ) {
      const step = factory.getStep(originalStageConfig.infrastructure.infrastructureDefinition.type)
      const errorsResponse = step?.validateInputSet({
        data: stageConfig?.infrastructure?.infrastructureDefinition?.spec,
        template: templateStageConfig?.infrastructure?.infrastructureDefinition?.spec,
        getString,
        viewType
      })
      if (!isEmpty(errorsResponse)) {
        set(errors, 'spec.infrastructure.infrastructureDefinition.spec', errorsResponse)
      }
    }
    // CI validation
    if (
      viewType !== StepViewType.InputSet &&
      isEmpty((stageConfig?.infrastructure as K8sDirectInfraYaml)?.spec?.connectorRef) &&
      (stageConfig?.infrastructure as K8sDirectInfraYaml)?.type === 'KubernetesDirect' &&
      getMultiTypeFromValue((templateStageConfig?.infrastructure as Infrastructure)?.spec?.connectorRef) ===
        MultiTypeInputType.RUNTIME
    ) {
      set(
        errors,
        'spec.infrastructure.spec.connectorRef',
        getString?.('fieldRequired', {
          field: getString?.('connectors.title.k8sCluster')
        })
      )
    }
    if (
      viewType !== StepViewType.InputSet &&
      isEmpty((stageConfig?.infrastructure as Infrastructure)?.spec?.spec?.poolName) &&
      (stageConfig?.infrastructure as K8sDirectInfraYaml)?.type === 'VM' &&
      getMultiTypeFromValue((templateStageConfig?.infrastructure as Infrastructure)?.spec?.spec?.poolName) ===
        MultiTypeInputType.RUNTIME
    ) {
      set(
        errors,
        'spec.infrastructure.spec.spec.poolName',
        getString?.('fieldRequired', {
          field: getString?.('pipeline.buildInfra.poolName')
        })
      )
    }

    if (stage?.variables) {
      const step = factory.getStep(StepType.CustomVariable)
      const errorsResponse: any = step?.validateInputSet({ data: stage, template, getString, viewType })

      if (!isEmpty(errorsResponse)) {
        set(errors, 'variables', errorsResponse?.variables)
      }
    }
    if (
      originalStageConfig?.serviceConfig?.serviceDefinition?.type === ServiceDeploymentType.Kubernetes ||
      originalStageConfig?.serviceConfig?.serviceDefinition?.type === ServiceDeploymentType.ServerlessAwsLambda
    ) {
      const step = factory.getStep(originalStageConfig?.serviceConfig?.serviceDefinition?.type)
      const errorsResponse = step?.validateInputSet({
        data: stageConfig?.serviceConfig?.serviceDefinition?.spec,
        template: templateStageConfig?.serviceConfig?.serviceDefinition?.spec,
        getString,
        viewType
      })

      if (!isEmpty(errorsResponse)) {
        set(errors, 'spec.serviceConfig.serviceDefinition.spec', errorsResponse)
      }

      if (originalStageConfig?.serviceConfig?.serviceDefinition?.spec?.variables) {
        const currentStep = factory.getStep(StepType.CustomVariable)
        const stepErrorsResponse = currentStep?.validateInputSet({
          data: stageConfig?.serviceConfig?.serviceDefinition?.spec,
          template: templateStageConfig?.serviceConfig?.serviceDefinition?.spec,
          getString,
          viewType
        })

        if (!isEmpty(stepErrorsResponse)) {
          set(errors, 'spec.serviceConfig.serviceDefinition.spec', stepErrorsResponse)
        }
      }
    }

    if (stageConfig?.execution?.steps) {
      const errorsResponse = validateSteps({
        steps: stageConfig.execution.steps as ExecutionWrapperConfig[],
        template: templateStageConfig?.execution?.steps,
        originalSteps: originalStageConfig?.execution?.steps,
        getString,
        viewType
      })
      if (!isEmpty(errorsResponse)) {
        set(errors, 'spec.execution', errorsResponse)
      }
    }
    if (stageConfig?.execution?.rollbackSteps) {
      const errorsResponse = validateSteps({
        steps: stageConfig.execution.rollbackSteps as ExecutionWrapperConfig[],
        template: templateStageConfig?.execution?.rollbackSteps,
        originalSteps: originalStageConfig?.execution?.rollbackSteps,
        getString,
        viewType
      })
      if (!isEmpty(errorsResponse)) {
        set(errors, 'spec.execution.rollbackSteps', errorsResponse)
      }
    }

    return errors
  }
}

interface ValidatePipelineProps {
  pipeline: PipelineInfoConfig
  template?: PipelineInfoConfig
  viewType: StepViewType
  originalPipeline?: PipelineInfoConfig
  resolvedPipeline?: PipelineInfoConfig
  getString?: UseStringsReturn['getString']
  path?: string
  viewTypeMetadata?: { [key: string]: boolean }
}

/**
 * Validation for CI Codebase
 */
export const validateCICodebase = ({
  pipeline,
  template,
  originalPipeline,
  resolvedPipeline, // used when originalPipeline is a template and we need to check clone codebase
  getString,
  viewTypeMetadata
}: ValidatePipelineProps): FormikErrors<PipelineInfoConfig> => {
  const errors = {}
  const requiresConnectorRuntimeInputValue =
    template?.properties?.ci?.codebase?.connectorRef && !pipeline?.properties?.ci?.codebase?.connectorRef

  const pipelineHasCloneCodebase = isCloneCodebaseEnabledAtLeastOneStage(resolvedPipeline || originalPipeline)
  const shouldValidateCICodebase =
    pipelineHasCloneCodebase &&
    (!requiresConnectorRuntimeInputValue ||
      (requiresConnectorRuntimeInputValue && !isEmpty(pipeline?.properties?.ci?.codebase?.connectorRef))) // ci codebase field is hidden until connector is selected
  const shouldValidate = !Object.keys(viewTypeMetadata || {}).includes('isTemplateBuilder')
  const isInputSetForm = viewTypeMetadata?.isInputSet // should not require any values
  if (
    shouldValidate &&
    shouldValidateCICodebase &&
    !isInputSetForm &&
    has(originalPipeline, 'properties') &&
    has(originalPipeline?.properties, 'ci') &&
    isEmpty(get(originalPipeline, 'properties.ci.codebase.build')) &&
    getString
  ) {
    set(errors, 'properties.ci.codebase', getString('fieldRequired', { field: getString('ciCodebase') }))
  }

  if (
    shouldValidateCICodebase &&
    getMultiTypeFromValue((template as PipelineInfoConfig)?.properties?.ci?.codebase?.build as unknown as string) ===
      MultiTypeInputType.RUNTIME
  ) {
    // connectorRef required to display build type
    if (
      isEmpty(pipeline?.properties?.ci?.codebase?.build?.type) &&
      !isInputSetForm &&
      (!requiresConnectorRuntimeInputValue ||
        (requiresConnectorRuntimeInputValue && pipeline?.properties?.ci?.codebase?.connectorRef)) &&
      pipelineHasCloneCodebase
    ) {
      set(
        errors,
        'properties.ci.codebase.build.type',
        getString?.('fieldRequired', { field: getString?.('pipeline.ciCodebase.ciCodebaseBuildType') })
      )
    }

    if (
      pipeline?.properties?.ci?.codebase?.build?.type === CodebaseTypes.branch &&
      isEmpty(pipeline?.properties?.ci?.codebase?.build?.spec?.branch) &&
      !isInputSetForm
    ) {
      set(
        errors,
        'properties.ci.codebase.build.spec.branch',
        getString?.('fieldRequired', { field: getString?.('gitBranch') })
      )
    }

    if (
      pipeline?.properties?.ci?.codebase?.build?.type === CodebaseTypes.tag &&
      isEmpty(pipeline?.properties?.ci?.codebase?.build?.spec?.tag) &&
      !isInputSetForm
    ) {
      set(errors, 'properties.ci.codebase.build.spec.tag', getString?.('fieldRequired', { field: getString('gitTag') }))
    }

    if (
      pipeline?.properties?.ci?.codebase?.build?.type === CodebaseTypes.PR &&
      isEmpty(pipeline?.properties?.ci?.codebase?.build?.spec?.number) &&
      !isInputSetForm
    ) {
      set(
        errors,
        'properties.ci.codebase.build.spec.number',
        getString?.('fieldRequired', { field: getString?.('pipeline.gitPullRequestNumber') })
      )
    }
  }

  if (shouldValidate) {
    if (requiresConnectorRuntimeInputValue && pipelineHasCloneCodebase && !isInputSetForm) {
      set(
        errors,
        'properties.ci.codebase.connectorRef',
        getString?.('fieldRequired', { field: getString?.('connector') })
      )
    }

    if (
      template?.properties?.ci?.codebase?.repoName &&
      pipeline?.properties?.ci?.codebase?.repoName?.trim() === '' &&
      !isInputSetForm
    ) {
      // connector with account url type will remove repoName requirement
      set(
        errors,
        'properties.ci.codebase.repoName',
        getString?.('fieldRequired', { field: getString?.('common.repositoryName') })
      )
    }

    if (template?.properties?.ci?.codebase?.depth) {
      const depth = pipeline?.properties?.ci?.codebase?.depth
      if (
        (depth || depth === ('' as any) || depth === 0) &&
        ((typeof depth === 'number' && depth < 1) ||
          typeof depth !== 'number' ||
          (typeof depth === 'string' && parseInt(depth) < 1))
      ) {
        set(errors, 'properties.ci.codebase.depth', getString?.('pipeline.ciCodebase.validation.optionalDepth'))
      }
    }

    if (template?.properties?.ci?.codebase?.sslVerify && pipelineHasCloneCodebase) {
      const sslVerify = pipeline?.properties?.ci?.codebase?.sslVerify
      if (sslVerify === ('' as any) || !isBoolean(sslVerify)) {
        set(errors, 'properties.ci.codebase.sslVerify', getString?.('pipeline.ciCodebase.validation.optionalSslVerify'))
      }
    }

    if (template?.properties?.ci?.codebase?.prCloneStrategy) {
      // error will appear in yaml view
      const prCloneStrategy = pipeline?.properties?.ci?.codebase?.prCloneStrategy
      const prCloneStrategyOptions = (getString && getPrCloneStrategyOptions(getString)) || []
      const prCloneStrategyOptionsValues = prCloneStrategyOptions.map(option => option.value)
      if (
        prCloneStrategy === ('' as any) ||
        (prCloneStrategy && !prCloneStrategyOptionsValues.some(value => value === prCloneStrategy))
      ) {
        set(
          errors,
          'properties.ci.codebase.prCloneStrategy',
          getString?.('pipeline.ciCodebase.validation.optionalPrCloneStrategy', {
            values: prCloneStrategyOptionsValues.join(', ')
          })
        )
      }
    }

    if (template?.properties?.ci?.codebase?.resources?.limits?.memory) {
      const memoryLimit = pipeline?.properties?.ci?.codebase?.resources?.limits?.memory
      const pattern = /^\d+(\.\d+)?$|^\d+(\.\d+)?(G|M|Gi|Mi|MiB)$|^$/
      if (
        memoryLimit === '' ||
        (memoryLimit && (!pattern.test(memoryLimit) || !isNaN(memoryLimit as unknown as number)))
      ) {
        set(
          errors,
          'properties.ci.codebase.resources.limits.memory',
          getString?.('pipeline.ciCodebase.validation.optionalLimitMemory')
        )
      }
    }

    if (template?.properties?.ci?.codebase?.resources?.limits?.cpu) {
      const cpuLimit = pipeline?.properties?.ci?.codebase?.resources?.limits?.cpu
      const pattern = /^\d+(\.\d+)?$|^\d+m$|^$/
      if (cpuLimit === '' || (cpuLimit && (!pattern.test(cpuLimit) || !isNaN(cpuLimit as unknown as number)))) {
        set(
          errors,
          'properties.ci.codebase.resources.limits.cpu',
          getString?.('pipeline.ciCodebase.validation.optionalLimitCPU')
        )
      }
    }
  }
  return errors
}

export const validatePipeline = ({
  pipeline,
  template,
  originalPipeline,
  resolvedPipeline,
  viewType,
  getString,
  path,
  viewTypeMetadata
}: ValidatePipelineProps): FormikErrors<PipelineInfoConfig> => {
  if (template?.template) {
    const errors = validatePipeline({
      pipeline: pipeline.template?.templateInputs as PipelineInfoConfig,
      template: template.template?.templateInputs as PipelineInfoConfig,
      viewType,
      originalPipeline: originalPipeline?.template?.templateInputs as PipelineInfoConfig,
      resolvedPipeline,
      getString,
      viewTypeMetadata
    })
    if (!isEmpty(errors)) {
      return set({}, 'template.templateInputs', errors)
    } else {
      return {}
    }
  } else {
    const errors = validateCICodebase({
      pipeline,
      template,
      originalPipeline,
      resolvedPipeline,
      viewType,
      getString,
      path,
      viewTypeMetadata
    })

    if (getMultiTypeFromValue(template?.timeout) === MultiTypeInputType.RUNTIME) {
      let timeoutSchema = getDurationValidationSchema({ minimum: '10s' })
      if (viewType === StepViewType.DeploymentForm) {
        timeoutSchema = timeoutSchema.required(getString?.('validation.timeout10SecMinimum'))
      }
      const timeout = Yup.object().shape({
        timeout: timeoutSchema
      })

      try {
        timeout.validateSync(pipeline)
      } catch (e) {
        /* istanbul ignore else */
        if (e instanceof Yup.ValidationError) {
          const err = yupToFormErrors(e)

          Object.assign(errors, err)
        }
      }
    }

    if (pipeline?.variables) {
      const step = factory.getStep(StepType.CustomVariable)
      const errorsResponse: any = step?.validateInputSet({ data: pipeline, template, getString, viewType })

      if (!isEmpty(errorsResponse)) {
        set(errors, 'variables', errorsResponse.variables)
      }
    }
    pipeline.stages?.forEach((stageObj, index) => {
      if (stageObj.stage) {
        const originalStage = getStageFromPipeline(stageObj.stage.identifier, originalPipeline)
        const errorsResponse = validateStage({
          stage: stageObj.stage as StageElementConfig,
          template: template?.stages?.[index]?.stage,
          originalStage: originalStage?.stage,
          getString,
          viewType
        })
        if (!isEmpty(errorsResponse)) {
          set(errors, `${isEmpty(path) ? '' : `${path}.`}stages[${index}].stage`, errorsResponse)
        }
      }
      if (stageObj.parallel) {
        stageObj.parallel.forEach((stageP, indexP: number) => {
          if (stageP.stage) {
            const originalStage = getStageFromPipeline(stageP.stage.identifier, originalPipeline)
            const errorsResponse = validateStage({
              stage: stageP.stage as StageElementConfig,
              template: template?.stages?.[index].parallel?.[indexP]?.stage,
              originalStage: originalStage?.stage,
              getString,
              viewType
            })
            if (!isEmpty(errorsResponse)) {
              set(
                errors,
                `${isEmpty(path) ? '' : `${path}.`}stages[${index}].parallel[${indexP}].stage`,
                errorsResponse
              )
            }
          }
        })
      }
    })

    return errors
  }
}

export const validateCICodebaseConfiguration = ({ pipeline, getString }: Partial<ValidatePipelineProps>): string => {
  const shouldValidateCICodebase = isCloneCodebaseEnabledAtLeastOneStage(pipeline)
  if (
    shouldValidateCICodebase &&
    !has(pipeline, 'properties') &&
    !has(pipeline?.properties, 'ci') &&
    isEmpty(get(pipeline, 'properties.ci.codebase.build')) &&
    getString
  ) {
    return getString?.('pipeline.runPipeline.ciCodebaseConfig')
  }
  return ''
}
