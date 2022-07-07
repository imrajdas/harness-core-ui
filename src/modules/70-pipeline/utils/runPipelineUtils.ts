/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { cloneDeep, defaultTo, set } from 'lodash-es'
import type { SelectOption } from '@wings-software/uicore'

import { getStageFromPipeline } from '@pipeline/components/PipelineStudio/PipelineContext/helpers'
import type { AllNGVariables, Pipeline } from '@pipeline/utils/types'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import type { FeaturesProps } from 'framework/featureStore/featureStoreUtil'
import type { UseStringsReturn } from 'framework/strings'
import type {
  InputSetErrorResponse,
  PipelineInfoConfig,
  StageElementConfig,
  StageElementWrapperConfig
} from 'services/pipeline-ng'
import {
  INPUT_EXPRESSION_REGEX_STRING,
  isExecionInput
} from '@common/components/ConfigureOptions/ConfigureOptionsUtils'

export interface MergeStageProps {
  stage: StageElementWrapperConfig
  inputSetPortion: Pipeline
  allValues: Pipeline
  shouldUseDefaultValues: boolean
}

/**
 * Loops over the pipeline and clears all the runtime inputs i.e. <+input>
 * expect for execution time inputs i.e. <+input>.executionInput()
 */
export function clearRuntimeInput<T = PipelineInfoConfig>(template: T, shouldAlsoClearRuntimeInputs?: boolean): T {
  const INPUT_EXPRESSION_REGEX = new RegExp(`"${INPUT_EXPRESSION_REGEX_STRING}"`, 'g')
  return JSON.parse(
    JSON.stringify(template || {}).replace(
      new RegExp(`"${INPUT_EXPRESSION_REGEX.source.slice(1).slice(0, -1)}"`, 'g'),
      value => {
        return isExecionInput(value) && !shouldAlsoClearRuntimeInputs ? value : '""'
      }
    )
  )
}

function mergeStage(props: MergeStageProps): StageElementWrapperConfig {
  const { stage, inputSetPortion, allValues, shouldUseDefaultValues } = props
  const stageIdToBeMatched = defaultTo(stage.stage?.identifier, '')
  const matchedStageInInputSet = getStageFromPipeline(stageIdToBeMatched, inputSetPortion.pipeline)
  const matchedStageInAllValues = getStageFromPipeline(stageIdToBeMatched, allValues.pipeline)

  if (matchedStageInInputSet.stage) {
    const variables = stage.stage?.template
      ? (stage.stage.template.templateInputs as StageElementConfig).variables
      : stage?.stage?.variables
    const inputSetVariables = matchedStageInInputSet.stage?.stage?.template
      ? (matchedStageInInputSet.stage.stage.template.templateInputs as StageElementConfig).variables
      : matchedStageInInputSet.stage?.stage?.variables
    let updatedStageVars = []
    if (variables && inputSetVariables) {
      updatedStageVars = getMergedVariables({
        variables: defaultTo(variables, []) as AllNGVariables[],
        inputSetVariables: defaultTo(inputSetVariables, []) as AllNGVariables[],
        allVariables: defaultTo(matchedStageInAllValues.stage?.stage?.variables, []) as AllNGVariables[],
        shouldUseDefaultValues
      })
      set(
        matchedStageInInputSet,
        matchedStageInInputSet.stage.stage?.template
          ? 'stage.stage.template.templateInputs.variables'
          : 'stage.stage.variables',
        updatedStageVars
      )
    }
    return matchedStageInInputSet.stage
  }

  return stage
}

export interface MergeTemplateWithInputSetDataProps {
  templatePipeline: Pipeline
  /**
   * Input set to merged. In case of no input sets,
   * just pass all values in place of input sets
   */
  inputSetPortion: Pipeline
  allValues: Pipeline
  shouldUseDefaultValues: boolean
}

export const mergeTemplateWithInputSetData = (props: MergeTemplateWithInputSetDataProps): Pipeline => {
  const { templatePipeline, inputSetPortion, allValues, shouldUseDefaultValues } = props
  // Replace all the matching stages in parsedTemplate with the stages received in input set portion
  const stages = templatePipeline.pipeline.template
    ? (templatePipeline.pipeline.template.templateInputs as PipelineInfoConfig)?.stages
    : templatePipeline.pipeline.stages
  const mergedStages = stages?.map(stage => {
    if (stage.parallel) {
      /*
      This stage is parallel. Now loop over all the children stages, and check if any of them match in input set portion
      We update all the parallel stages with the ones matching in the input set portion
      and then finally return the new 'updatedParallelStages' object
      */
      const updatedParallelStages = stage.parallel.map(parallelStage =>
        mergeStage({ stage: parallelStage, inputSetPortion, allValues, shouldUseDefaultValues })
      )
      // Finally setting the updatedParallelStages in the original object, so that the 'mergedStages' will have the updated values
      stage.parallel = updatedParallelStages
      return stage
    }

    /*
    This block will be executed if there are no parallel stages.
    Simply loop over the stages and keep matching and replacing
    */
    return mergeStage({ stage, inputSetPortion, allValues, shouldUseDefaultValues })
  })

  const toBeUpdated = cloneDeep(templatePipeline)
  if (toBeUpdated.pipeline.template) {
    if (Array.isArray(mergedStages)) {
      set(toBeUpdated, 'pipeline.template.templateInputs.stages', mergedStages)
    }

    if ((inputSetPortion.pipeline?.template?.templateInputs as PipelineInfoConfig).properties?.ci) {
      set(
        toBeUpdated,
        'pipeline.template.templateInputs.properties.ci',
        (inputSetPortion.pipeline?.template?.templateInputs as PipelineInfoConfig).properties?.ci
      )
    }
    if ((inputSetPortion.pipeline?.template?.templateInputs as PipelineInfoConfig).variables) {
      set(
        toBeUpdated,
        'pipeline.template.templateInputs.variables',
        getMergedVariables({
          variables: defaultTo(
            (toBeUpdated.pipeline?.template?.templateInputs as PipelineInfoConfig)?.variables,
            []
          ) as AllNGVariables[],
          inputSetVariables: defaultTo(
            (inputSetPortion.pipeline?.template?.templateInputs as PipelineInfoConfig)?.variables,
            []
          ) as AllNGVariables[],
          allVariables: defaultTo(allValues.pipeline?.variables, []) as AllNGVariables[],
          shouldUseDefaultValues
        })
      )
    }
  } else {
    if (Array.isArray(mergedStages)) {
      toBeUpdated.pipeline.stages = mergedStages
    }

    if (inputSetPortion.pipeline?.properties?.ci) {
      if (!toBeUpdated.pipeline.properties) {
        toBeUpdated.pipeline.properties = {}
      }
      toBeUpdated.pipeline.properties.ci = inputSetPortion.pipeline.properties.ci
    }

    /*
    Below portion adds variables to the pipeline.
    If your input sets has variables, use them.
    Eventually in run pipeline form -
    If input sets are selected, we will supply the variables from 'toBeUpdated' pipleine
    This is why 'toBeUpdated' pipeline should have the variables
    */

    if (inputSetPortion.pipeline.variables) {
      // If we have variables saved in input set, pick them and update

      toBeUpdated.pipeline.variables = getMergedVariables({
        variables: defaultTo(toBeUpdated.pipeline.variables, []) as AllNGVariables[],
        inputSetVariables: defaultTo(inputSetPortion.pipeline.variables, []) as AllNGVariables[],
        allVariables: defaultTo(allValues.pipeline.variables, []) as AllNGVariables[],
        shouldUseDefaultValues
      })
    }
  }
  return toBeUpdated
}

// Used in Input Set form and save as input set call in run pipeline
export const getFormattedErrors = (apiErrorMap?: { [key: string]: InputSetErrorResponse }): Record<string, any> => {
  const toReturn: Record<string, any> = {}
  if (apiErrorMap) {
    const apiErrorKeys = Object.keys(apiErrorMap)
    apiErrorKeys.forEach(apiErrorKey => {
      const errorsForKey = apiErrorMap[apiErrorKey].errors || []
      if (errorsForKey[0].fieldName) {
        toReturn[errorsForKey[0].fieldName] = `${errorsForKey[0].fieldName}: ${errorsForKey[0].message}`
      }
    })
  }
  return toReturn
}

export const getOverlayErrors = (invalidReferences: Record<string, string>): Record<string, any> => {
  const toReturn: Record<string, any> = {}
  if (invalidReferences) {
    Object.keys(invalidReferences).forEach(invalidReferenceKey => {
      toReturn[invalidReferenceKey] = `${invalidReferenceKey}: ${invalidReferences[invalidReferenceKey]}`
    })
  }

  return toReturn
}

export interface GetMergedVariablesProps {
  variables: AllNGVariables[]
  inputSetVariables: AllNGVariables[]
  allVariables: AllNGVariables[]
  shouldUseDefaultValues: boolean
}

export const getMergedVariables = (props: GetMergedVariablesProps): AllNGVariables[] => {
  const { inputSetVariables, variables, allVariables, shouldUseDefaultValues } = props
  // create a map of input set variables values for easier lookup
  // we use "name" of the varibale as the key
  const inputSetVariablesMap: Record<string, AllNGVariables> = inputSetVariables.reduce(
    (acc, curr) => ({ ...acc, [defaultTo(curr.name, '')]: curr }),
    {}
  )
  const allVariablesMap: Record<string, AllNGVariables> = allVariables.reduce(
    (acc, curr) => ({ ...acc, [defaultTo(curr.name, '')]: curr }),
    {}
  )

  // loop over existing variables and update their values from input sets
  const finalVariables: AllNGVariables[] = variables.map((variable): AllNGVariables => {
    const { name = '', type } = variable

    // if a variable with same name exists in input set variables
    if (name in inputSetVariablesMap) {
      // copy the variable data
      const varFromInpuSet: AllNGVariables = { ...inputSetVariablesMap[name] }
      const varFromAllVars: AllNGVariables = allVariablesMap[name]

      // remove the variable from input set variables
      delete inputSetVariablesMap[name]

      // use new value if the type of varibale is same else use the current value
      let value = varFromInpuSet.type === type ? varFromInpuSet.value : variable.value

      // fallback to default value, if the flag is true, the value is empty and
      // the variable has a default value defined in pipeline
      if (shouldUseDefaultValues && !value && typeof varFromAllVars?.default !== 'undefined') {
        value = varFromAllVars.default
      }

      return {
        ...variable,
        value
      } as AllNGVariables
    }

    // else return original varibale
    return variable
  })

  const remainingVariables = Object.values(inputSetVariablesMap)

  // append the remaining input set variables to existing variables
  return finalVariables.concat(...remainingVariables)
}

export const getRbacButtonModules = (module?: string): string[] => {
  const rbacButtonModules = []
  if (module?.includes('cd')) {
    rbacButtonModules.push('cd')
  }
  if (module?.includes('ci')) {
    rbacButtonModules.push('ci')
  }
  return rbacButtonModules
}
/*
  Get features restriction to pass to 'run/ retry' pipeline button based on the modules the pipeline supports
*/
export const getFeaturePropsForRunPipelineButton = ({
  modules,
  getString
}: {
  modules?: string[]
  getString: UseStringsReturn['getString']
}): FeaturesProps | undefined => {
  if (!modules || !modules?.length) {
    return undefined
  }
  const featureIdentifiers: FeatureIdentifier[] = []
  const additionalFeaturesProps: { warningMessage?: string } = {}
  if (modules.includes('cd')) {
    featureIdentifiers.push(FeatureIdentifier.DEPLOYMENTS_PER_MONTH)
  }
  if (modules.includes('ci')) {
    featureIdentifiers.push(FeatureIdentifier.BUILDS)
    additionalFeaturesProps.warningMessage = getString('pipeline.featureRestriction.unlimitedBuildsRequiredPlan')
  }
  return {
    featuresRequest: {
      featureNames: featureIdentifiers
    },
    ...additionalFeaturesProps
  }
}

export interface SelectedStageData {
  stageIdentifier?: string
  stagesRequired?: string[]
  stageName?: string
  message?: string
}
export interface StageSelectionData {
  selectedStages: SelectedStageData[]
  allStagesSelected: boolean
  selectedStageItems: SelectOption[]
}

export const POLL_INTERVAL = 1 /* sec */ * 1000 /* ms */

export const ALL_STAGE_VALUE = 'all'

export const getAllStageData = (getString: UseStringsReturn['getString']): SelectedStageData => ({
  stageIdentifier: ALL_STAGE_VALUE,
  stagesRequired: [],
  stageName: getString('pipeline.allStages')
})

export const getAllStageItem = (getString: UseStringsReturn['getString']): SelectOption => ({
  label: getString('pipeline.allStages'),
  value: ALL_STAGE_VALUE
})

export function getStageIdentifierFromStageData(selectedStageData: StageSelectionData): string[] {
  return selectedStageData.allStagesSelected
    ? []
    : selectedStageData.selectedStageItems.map(stageData => stageData.value as string)
}
