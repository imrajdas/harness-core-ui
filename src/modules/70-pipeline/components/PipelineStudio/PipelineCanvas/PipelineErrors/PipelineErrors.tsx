/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { get } from 'lodash-es'
import { Classes, Dialog } from '@blueprintjs/core'
import cx from 'classnames'
import { Text } from '@harness/uicore'
import { Color } from '@harness/design-system'
import type { YamlSchemaErrorDTO, NodeErrorInfo } from 'services/pipeline-ng'
import type { StringsMap } from 'stringTypes'
import { useStrings } from 'framework/strings'
import stepFactory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
import { stageTypeToIconMap } from '@pipeline/components/PipelineInputSetForm/PipelineInputSetForm'
import { DeployTabs } from '@pipeline/components/PipelineStudio/CommonUtils/DeployStageSetupShellUtils'
import PipelineErrorCard from './PipelineErrorCard'
import css from './PipelineErrors.module.scss'

type gotoViewWithDetails = (args: { stageId?: string; stepId?: string; sectionId?: string }) => void

export interface PropsInterface {
  errors: YamlSchemaErrorDTO[]
  gotoViewWithDetails: gotoViewWithDetails
  onClose: () => void
}

interface StageErrorsType {
  stageErrors: YamlSchemaErrorDTO[]
  errorsByStep: Record<string, YamlSchemaErrorDTO[]>
  stepIds: string[]
}

const isPipelineError = (item: YamlSchemaErrorDTO): boolean => !item.stageInfo && !item.stepInfo
const isStageError = (item: YamlSchemaErrorDTO): boolean => !!item.stageInfo && !item.stepInfo
const isStepError = (item: YamlSchemaErrorDTO): boolean => !!item.stageInfo && !!item.stepInfo
const getNameFromItem = (item: NodeErrorInfo = {}) => item.name || item.identifier || item.fqn
const getIdentifierFromItem = (item?: NodeErrorInfo) => item?.identifier || ''

const SECTION_KEY_MAP = {
  serviceConfig: DeployTabs.SERVICE,
  infrastructure: DeployTabs.INFRASTRUCTURE,
  execution: DeployTabs.EXECUTION,
  failureStrategies: DeployTabs.ADVANCED
}
type sectionKeys = 'serviceConfig' | 'infrastructure' | 'execution' | 'failureStrategies'

/**
 * examples
 * message1 = '$.pipeline.stages[0].stage.spec.infrastructure.useFromStage: is missing but it is required' - infrastructure
 * message2 = '$.pipeline.stages[0].stage.spec.infrastructure: is missing but it is required' - infrastructure
 * message3 = '$.pipeline is missing but it is required' - undefined
 * message4 = '$.pipeline.stages[0].stage.spec: is missing but it is required' - undefined
 * */
const getSectionId = (message = '') => {
  const sectionKey = message.split('.spec.')[1]?.split(':')[0]?.split('.')[0] || ''
  return sectionKey ? SECTION_KEY_MAP[sectionKey as sectionKeys] || '' : ''
}

const addToErrorsByStage = (errorsByStage: Record<string, YamlSchemaErrorDTO[]>, item: YamlSchemaErrorDTO) => {
  const identifier = getIdentifierFromItem(item.stageInfo)
  return [...(errorsByStage[identifier] || []), item]
}

const getAdaptedErrors = (schemaErrors: YamlSchemaErrorDTO[]) =>
  schemaErrors.reduce(
    (
      accum: {
        stageIds: string[]
        errorsByStage: Record<string, YamlSchemaErrorDTO[]>
        pipelineErrors: Array<YamlSchemaErrorDTO>
      },
      item: YamlSchemaErrorDTO
    ) => {
      const errorsByStage = accum.errorsByStage
      if (isPipelineError(item)) {
        accum.pipelineErrors.push(item)
      } else {
        const identifier = getIdentifierFromItem(item.stageInfo)
        if (errorsByStage[identifier]) {
          errorsByStage[identifier] = addToErrorsByStage(errorsByStage, item)
        } else {
          errorsByStage[identifier] = [item]
          accum.stageIds.push(identifier)
        }
      }
      return accum
    },
    { stageIds: [], errorsByStage: {}, pipelineErrors: [] }
  )

const getAdaptedErrorsForStep = (
  stageIds: string[],
  errorsByStage: Record<string, YamlSchemaErrorDTO[]>
): Record<string, StageErrorsType> => {
  const updatedErrorsByStage: Record<string, StageErrorsType> = {}

  stageIds.forEach((stepId: string) => {
    updatedErrorsByStage[stepId] = errorsByStage[stepId]?.reduce(
      (accum: StageErrorsType, item: YamlSchemaErrorDTO) => {
        const { stageErrors, errorsByStep, stepIds } = accum
        if (isStageError(item)) {
          stageErrors.push(item)
        } else if (isStepError(item)) {
          const identifier = getIdentifierFromItem(item.stepInfo)
          if (errorsByStep[identifier]) {
            // push to existing object
            errorsByStep[identifier].push(item)
          } else {
            errorsByStep[identifier] = [item]
            stepIds.push(identifier)
          }
        }
        return accum
      },
      { stageErrors: [], errorsByStep: {}, stepIds: [] }
    )
  })
  return updatedErrorsByStage
}

function StageErrorCard({
  errors,
  gotoViewWithDetails
}: {
  errors: YamlSchemaErrorDTO[]
  gotoViewWithDetails: gotoViewWithDetails
}): React.ReactElement | null {
  const { getString } = useStrings()
  if (errors.length === 0) {
    return null
  }
  return (
    <PipelineErrorCard
      errors={errors.map(err => err?.message).filter(e => e) as string[]}
      icon={stageTypeToIconMap[errors[0].stageInfo?.type || '']}
      onClick={() => {
        gotoViewWithDetails({
          stageId: errors[0].stageInfo?.identifier,
          sectionId: getSectionId(errors[0].messageWithFQN)
        })
      }}
      buttonText={getString('pipeline.errorFramework.fixStage')}
    />
  )
}

function StepErrorCard({
  stepIds,
  errorsByStep,
  gotoViewWithDetails
}: {
  stepIds: string[]
  errorsByStep: Record<string, YamlSchemaErrorDTO[]>
  gotoViewWithDetails: gotoViewWithDetails
}): React.ReactElement | null {
  const { getString } = useStrings()
  if (stepIds.length === 0) {
    return null
  }
  const renderStepError = (stepId: string): React.ReactElement => {
    const stepErrors = errorsByStep[stepId] || []
    const stepName = getNameFromItem(stepErrors[0]?.stepInfo)
    const stepTitle = `${getString('pipeline.execution.stepTitlePrefix')} ${stepName}`
    return (
      <PipelineErrorCard
        key={stepId || stepName}
        title={stepTitle}
        errors={stepErrors.map(err => err.message).filter(e => e) as string[]}
        icon={stepFactory.getStepIcon(get(stepErrors[0], 'stepInfo.type', ''))}
        onClick={() => {
          gotoViewWithDetails({
            stageId: stepErrors[0]?.stageInfo?.identifier || '',
            stepId: stepErrors[0]?.stepInfo?.identifier || ''
          })
        }}
        buttonText={getString('pipeline.errorFramework.fixStep')}
      />
    )
  }
  return <>{stepIds.map(renderStepError)}</>
}

function StageErrors({
  errors,
  gotoViewWithDetails
}: {
  errors: StageErrorsType
  gotoViewWithDetails: gotoViewWithDetails
}): React.ReactElement {
  const { stepIds, errorsByStep, stageErrors } = errors
  const { getString } = useStrings()
  const stageInfo = stageErrors.length ? stageErrors[0].stageInfo : errorsByStep[stepIds[0]]?.[0]?.stageInfo
  const stageName = stageInfo ? getNameFromItem(stageInfo) : ''

  return (
    <>
      <Text color={Color.BLACK} font={{ weight: 'semi-bold', size: 'normal' }} margin={{ bottom: 'medium' }}>
        {getString('pipeline.execution.stageTitlePrefix')} {stageName}
      </Text>
      <StageErrorCard gotoViewWithDetails={gotoViewWithDetails} errors={stageErrors} />
      <StepErrorCard gotoViewWithDetails={gotoViewWithDetails} errorsByStep={errorsByStep} stepIds={stepIds} />
    </>
  )
}

function PipelineError({
  errors,
  gotoViewWithDetails
}: {
  errors: Array<YamlSchemaErrorDTO>
  gotoViewWithDetails: gotoViewWithDetails
}): React.ReactElement | null {
  const { getString } = useStrings()
  if (errors.length === 0) {
    return null
  }

  return (
    <>
      <Text color={Color.BLACK} font={{ weight: 'semi-bold', size: 'normal' }} margin={{ bottom: 'medium' }}>
        {getString('common.pipeline')}
      </Text>
      <PipelineErrorCard
        errors={errors.map(e => e.message).filter(e => e) as string[]}
        icon="pipeline"
        onClick={() => gotoViewWithDetails({})}
        buttonText={getString('pipeline.errorFramework.fixErrors')}
      />
    </>
  )
}

export const getFieldsLabel = (
  pipelineErrors: Array<YamlSchemaErrorDTO>,
  stageIds: string[],
  updatedErrorsByStage: Record<string, StageErrorsType>,
  getString: (str: keyof StringsMap, vars?: Record<string, any> | undefined) => string
) => {
  let str = ''

  const hasPipelineErrors = pipelineErrors.length
  // if only pipeline errors
  if (hasPipelineErrors && stageIds.length === 0) {
    str = getString('pipeline.errorFramework.header12')
  } else {
    const hasStageErrors = stageIds.some((stageId: string) => updatedErrorsByStage[stageId].stageErrors.length)
    const hasStepErrors = stageIds.some(
      (stageId: string) => Object.keys(updatedErrorsByStage[stageId]?.errorsByStep || {}).length
    )
    const errorInSingleStage = stageIds.length === 1
    if (hasPipelineErrors) {
      let stringToAppend = ''
      if (hasStageErrors && hasStepErrors) {
        stringToAppend = errorInSingleStage
          ? getString('pipeline.errorFramework.header1')
          : getString('pipeline.errorFramework.header2')
      } else if (hasStageErrors) {
        stringToAppend = errorInSingleStage
          ? getString('pipeline.errorFramework.header3')
          : getString('pipeline.errorFramework.header4')
      } else {
        stringToAppend = getString('pipeline.errorFramework.header5')
      }
      str = getString('pipeline.errorFramework.header6', { stringToAppend })
    } else {
      if (hasStageErrors && hasStepErrors) {
        str = errorInSingleStage
          ? getString('pipeline.errorFramework.header7')
          : getString('pipeline.errorFramework.header8')
      } else if (hasStageErrors) {
        str = errorInSingleStage
          ? getString('pipeline.errorFramework.header9')
          : getString('pipeline.errorFramework.header10')
      } else {
        str = getString('pipeline.errorFramework.header11')
      }
    }
  }
  return str || getString('pipeline.errorFramework.header12')
}

function PipelineErrorContent({
  stageIds,
  pipelineErrors,
  gotoViewWithDetails,
  updatedErrorsByStage
}: {
  stageIds: string[]
  pipelineErrors: Array<YamlSchemaErrorDTO>
  gotoViewWithDetails: gotoViewWithDetails
  updatedErrorsByStage: Record<string, StageErrorsType>
}) {
  return (
    <div className={css.pipelineErrorList}>
      <PipelineError errors={pipelineErrors} gotoViewWithDetails={gotoViewWithDetails} />
      {stageIds.map((stageId: string) => {
        return (
          <StageErrors key={stageId} gotoViewWithDetails={gotoViewWithDetails} errors={updatedErrorsByStage[stageId]} />
        )
      })}
    </div>
  )
}

function PipelineErrors({
  errors: schemaErrors,
  gotoViewWithDetails,
  onClose
}: PropsInterface): React.ReactElement | null {
  const { getString } = useStrings()
  if (!schemaErrors || !schemaErrors.length) {
    return null
  }
  const { stageIds, errorsByStage, pipelineErrors } = getAdaptedErrors(schemaErrors)
  const updatedErrorsByStage = getAdaptedErrorsForStep(stageIds, errorsByStage)

  return (
    <Dialog
      isOpen={true}
      enforceFocus={false}
      canEscapeKeyClose={false}
      canOutsideClickClose={false}
      onClose={onClose}
      title={
        <Text
          font={{ size: 'medium', weight: 'bold' }}
          color={Color.BLACK}
          icon="warning-icon"
          iconProps={{ size: 20, padding: { right: 'small' } }}
        >
          {getString('pipeline.errorFramework.pipelineErrorsTitle', {
            fields: getFieldsLabel(pipelineErrors, stageIds, updatedErrorsByStage, getString)
          })}
        </Text>
      }
      isCloseButtonShown
      className={cx(css.errorDialog, Classes.DIALOG)}
    >
      <PipelineErrorContent
        stageIds={stageIds}
        pipelineErrors={pipelineErrors}
        gotoViewWithDetails={gotoViewWithDetails}
        updatedErrorsByStage={updatedErrorsByStage}
      />
    </Dialog>
  )
}

export default PipelineErrors
