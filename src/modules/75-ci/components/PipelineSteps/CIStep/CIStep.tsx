/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { isEmpty } from 'lodash-es'
import { useParams } from 'react-router-dom'
import cx from 'classnames'
import type { FormikProps } from 'formik'
import { FormInput, Text, Container, MultiTypeInputType } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { MultiTypeTextField, MultiTypeTextProps } from '@common/components/MultiTypeText/MultiTypeText'
import MultiTypeList from '@common/components/MultiTypeList/MultiTypeList'
import { FormMultiTypeTextAreaField } from '@common/components'
import {
  useGitScope,
  shouldRenderRunTimeInputViewWithAllowedValues,
  getConnectorRefWidth
} from '@pipeline/utils/CIUtils'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import { useStrings } from 'framework/strings'
import type { StringsMap } from 'stringTypes'

import {
  renderConnectorAndRepoName,
  runtimeInputGearWidth,
  CodebaseRuntimeInputsInterface
} from '@pipeline/components/PipelineStudio/RightBar/RightBarUtils'
import { renderBuild } from '../GitCloneStep/GitCloneStepBase'
import {
  AllMultiTypeInputTypesForInputSet,
  AllMultiTypeInputTypesForStep,
  SupportedInputTypesForListItems,
  SupportedInputTypesForListTypeField,
  SupportedInputTypesForListTypeFieldInInputSetView
} from './StepUtils'
import { renderMultiTypeInputWithAllowedValues, renderMultiTypeListInputSet } from './CIStepOptionalConfig'
import css from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

interface CIStepProps {
  isNewStep?: boolean
  readonly?: boolean
  stepLabel?: string
  enableFields: {
    [key: string]: { [key: string]: any }
  }
  formik?: FormikProps<any>
  stepViewType: StepViewType
  path?: string
  isInputSetView?: boolean
  allowableTypes?: MultiTypeInputType[]
  template?: Record<string, any>
}

export const CIStep: React.FC<CIStepProps> = props => {
  const { isNewStep, readonly, stepLabel, enableFields, stepViewType, path, isInputSetView, formik, template } = props
  const { accountId, projectIdentifier, orgIdentifier } = useParams<{
    projectIdentifier: string
    orgIdentifier: string
    accountId: string
  }>()
  const { getString } = useStrings()
  const gitScope = useGitScope()
  const { expressions } = useVariablesExpression()
  const prefix = isEmpty(path) ? '' : `${path}.`

  const stepCss = stepViewType === StepViewType.DeploymentForm ? css.sm : css.lg

  const renderMultiTypeTextField = React.useCallback(
    ({
      name,
      tooltipId,
      labelKey,
      inputProps,
      fieldPath
    }: {
      name: string
      tooltipId: string
      labelKey: keyof StringsMap
      inputProps: MultiTypeTextProps['multiTextInputProps']
      fieldPath: string
    }) => {
      if (isInputSetView && shouldRenderRunTimeInputViewWithAllowedValues(fieldPath, template)) {
        return renderMultiTypeInputWithAllowedValues({
          name,
          tooltipId,
          labelKey,
          fieldPath,
          getString,
          readonly,
          expressions,
          template
        })
      }
      return (
        <MultiTypeTextField
          name={name}
          label={
            <Text
              className={css.inpLabel}
              color={Color.GREY_600}
              font={{ size: 'small', weight: 'semi-bold' }}
              tooltipProps={{
                dataTooltipId: tooltipId
              }}
            >
              {getString(labelKey)}
            </Text>
          }
          multiTextInputProps={inputProps}
        />
      )
    },
    [template, isInputSetView]
  )

  const renderMultiTypeList = React.useCallback(
    ({
      name,
      labelKey,
      allowedTypes,
      allowedTypesForEntries
    }: {
      name: string
      labelKey: keyof StringsMap
      allowedTypes: MultiTypeInputType[]
      allowedTypesForEntries: MultiTypeInputType[]
    }) => (
      <MultiTypeList
        name={name}
        multiTextInputProps={{ expressions, allowableTypes: allowedTypesForEntries }}
        multiTypeFieldSelectorProps={{
          label: (
            <Text
              className={css.inpLabel}
              color={Color.GREY_600}
              font={{ size: 'small', weight: 'semi-bold' }}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              {getString(labelKey)}
            </Text>
          ),
          allowedTypes
        }}
        disabled={readonly}
      />
    ),
    [expressions]
  )

  const renderLabel = React.useCallback(
    ({ labelKey, tooltipId }: { labelKey: keyof StringsMap; tooltipId?: string }) => {
      return (
        <Text
          className={css.inpLabel}
          color={Color.GREY_600}
          font={{ size: 'small', weight: 'semi-bold' }}
          style={{ display: 'flex', alignItems: 'center' }}
          tooltipProps={{ dataTooltipId: tooltipId ?? '' }}
        >
          {getString(labelKey)}
        </Text>
      )
    },
    []
  )

  return (
    <>
      {stepViewType !== StepViewType.Template && Object.prototype.hasOwnProperty.call(enableFields, 'name') ? (
        <Container className={cx(css.formGroup, stepCss, css.nameIdLabel)}>
          <FormInput.InputWithIdentifier
            inputName="name"
            idName="identifier"
            isIdentifierEditable={isNewStep && !readonly}
            inputGroupProps={{ disabled: readonly }}
            inputLabel={stepLabel ?? getString('pipelineSteps.stepNameLabel')}
          />
        </Container>
      ) : null}
      <Container className={cx(css.formGroup, stepCss)}>
        {Object.prototype.hasOwnProperty.call(enableFields, 'description') ? (
          isInputSetView && shouldRenderRunTimeInputViewWithAllowedValues('description', template) ? (
            renderMultiTypeInputWithAllowedValues({
              name: `${prefix}description`,
              labelKey: 'description',
              fieldPath: 'description',
              getString,
              readonly,
              expressions,
              template
            })
          ) : (
            <FormMultiTypeTextAreaField
              name={`${prefix}description`}
              label={
                <Text color={Color.GREY_600} font={{ size: 'small', weight: 'semi-bold' }}>
                  {getString('description')}
                </Text>
              }
              multiTypeTextArea={{
                expressions,
                allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep,
                disabled: readonly
              }}
            />
          )
        ) : null}
      </Container>
      {!enableFields['spec.connectorRef']?.shouldHide &&
      Object.prototype.hasOwnProperty.call(enableFields, 'spec.connectorRef') ? (
        isInputSetView && shouldRenderRunTimeInputViewWithAllowedValues('spec.connectorRef', template) ? (
          <Container className={cx(css.formGroup, stepCss, css.bottomMargin3)}>
            {renderMultiTypeInputWithAllowedValues({
              name: `${prefix}spec.connectorRef`,
              labelKey: enableFields['spec.connectorRef'].label.labelKey,
              tooltipId: enableFields['spec.connectorRef'].label?.tooltipId,
              fieldPath: 'spec.connectorRef',
              getString,
              readonly,
              expressions,
              template
            })}
          </Container>
        ) : (
          <Container className={css.bottomMargin3}>
            <FormMultiTypeConnectorField
              label={renderLabel(enableFields['spec.connectorRef'].label)}
              type={enableFields['spec.connectorRef'].type}
              width={getConnectorRefWidth(stepViewType)}
              name={`${prefix}spec.connectorRef`}
              placeholder={getString('select')}
              accountIdentifier={accountId}
              projectIdentifier={projectIdentifier}
              orgIdentifier={orgIdentifier}
              multiTypeProps={{
                expressions,
                allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep,
                disabled: readonly,
                ...enableFields['spec.connectorRef'].multiTypeProps
              }}
              gitScope={gitScope}
              setRefValue
            />
          </Container>
        )
      ) : null}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.connectorAndRepo') &&
        formik &&
        renderConnectorAndRepoName({
          values: formik.values,
          setFieldValue: formik.setFieldValue,
          connectorUrl: enableFields['spec.connectorAndRepo'].connectorUrl,
          connectionType: enableFields['spec.connectorAndRepo'].connectionType,
          connectorWidth: enableFields['spec.connectorAndRepo'].connectorWidth,
          setConnectionType: enableFields['spec.connectorAndRepo'].setConnectionType,
          setConnectorUrl: enableFields['spec.connectorAndRepo'].setConnectorUrl,
          getString,
          errors: formik.errors,
          loading: false,
          accountId,
          projectIdentifier,
          orgIdentifier,
          repoIdentifier: enableFields['spec.connectorAndRepo'].repoIdentifier,
          branch: enableFields['spec.connectorAndRepo'].branch,
          expressions,
          isReadonly: enableFields['spec.connectorAndRepo'].isReadonly,
          setCodebaseRuntimeInputs: enableFields['spec.connectorAndRepo'].setCodebaseRuntimeInputs,
          codebaseRuntimeInputs: enableFields['spec.connectorAndRepo'].codebaseRuntimeInputs,
          connectorAndRepoNamePath: enableFields['spec.connectorAndRepo'].connectorAndRepoNamePath,
          classnames: cx(css.formGroup, css.lg, css.bottomMargin5)
        })}

      {!enableFields['spec.connectorRef']?.shouldHide &&
      Object.prototype.hasOwnProperty.call(enableFields, 'spec.image') ? (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          {renderMultiTypeTextField({
            name: `${prefix}spec.image`,
            tooltipId: enableFields['spec.image'].tooltipId,
            labelKey: 'imageLabel',
            inputProps: enableFields['spec.image'].multiTextInputProps,
            fieldPath: 'spec.image'
          })}
        </Container>
      ) : null}

      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.build') &&
        formik &&
        renderBuild({
          expressions,
          readonly,
          getString,
          formik,
          setCodeBaseType: enableFields['spec.build'].setCodeBaseType,
          codeBaseType: enableFields['spec.build'].codeBaseType
        })}

      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.cloneDirectory') ? (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          {renderMultiTypeTextField({
            name: `${prefix}spec.cloneDirectory`,
            tooltipId: enableFields['spec.cloneDirectory'].tooltipId,
            labelKey: 'pipeline.gitCloneStep.cloneDirectory',
            inputProps: {
              multiTextInputProps: {
                expressions,
                allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep
              },
              disabled: readonly
            },
            fieldPath: 'spec.cloneDirectory'
          })}
        </Container>
      ) : null}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.target') ? (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          {renderMultiTypeTextField({
            name: `${prefix}spec.target`,
            tooltipId: enableFields['spec.target'].tooltipId,
            labelKey: 'pipelineSteps.targetLabel',
            inputProps: {
              multiTextInputProps: {
                expressions,
                allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep
              },
              disabled: readonly
            },
            fieldPath: 'spec.target'
          })}
        </Container>
      ) : null}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.repo') ? (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          {renderMultiTypeTextField({
            name: `${prefix}spec.repo`,
            tooltipId: 'dockerHubRepository',
            labelKey: 'connectors.docker.dockerRepository',
            inputProps: {
              multiTextInputProps: {
                expressions,
                allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep
              },
              disabled: readonly
            },
            fieldPath: 'spec.repo'
          })}
        </Container>
      ) : null}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.host') ? (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          {renderMultiTypeTextField({
            name: `${prefix}spec.host`,
            tooltipId: 'gcrHost',
            labelKey: 'pipelineSteps.hostLabel',
            inputProps: {
              placeholder: getString('pipelineSteps.hostPlaceholder'),
              multiTextInputProps: {
                expressions,
                allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep
              },
              disabled: readonly
            },
            fieldPath: 'spec.host'
          })}
        </Container>
      ) : null}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.projectID') ? (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          {renderMultiTypeTextField({
            name: `${prefix}spec.projectID`,
            tooltipId: 'gcrProjectID',
            labelKey: 'pipelineSteps.projectIDLabel',
            inputProps: {
              multiTextInputProps: {
                expressions,
                allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep
              },
              disabled: readonly
            },
            fieldPath: 'spec.projectID'
          })}
        </Container>
      ) : null}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.region') ? (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          {renderMultiTypeTextField({
            name: `${prefix}spec.region`,
            tooltipId: 'region',
            labelKey: 'regionLabel',
            inputProps: {
              placeholder: getString('pipelineSteps.regionPlaceholder'),
              multiTextInputProps: {
                expressions,
                allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep
              },
              disabled: readonly
            },
            fieldPath: 'spec.region'
          })}
        </Container>
      ) : null}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.bucket') ? (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          {renderMultiTypeTextField({
            name: `${prefix}spec.bucket`,
            tooltipId: enableFields['spec.bucket'].tooltipId,
            labelKey: 'pipelineSteps.bucketLabel',
            inputProps: {
              multiTextInputProps: {
                expressions,
                allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep
              },
              disabled: readonly
            },
            fieldPath: 'spec.bucket'
          })}
        </Container>
      ) : null}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.key') ? (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          {renderMultiTypeTextField({
            name: `${prefix}spec.key`,
            tooltipId: enableFields['spec.key'].tooltipId,
            labelKey: 'keyLabel',
            inputProps: {
              multiTextInputProps: {
                expressions,
                allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep
              },
              disabled: readonly
            },
            fieldPath: 'spec.key'
          })}
        </Container>
      ) : null}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.sourcePaths') ? (
        isInputSetView ? (
          <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
            {renderMultiTypeListInputSet({
              name: `${prefix}spec.sourcePaths`,
              tooltipId: 'sourcePaths',
              labelKey: 'pipelineSteps.sourcePathsLabel',
              allowedTypes: SupportedInputTypesForListTypeFieldInInputSetView,
              allowedTypesForEntries: SupportedInputTypesForListItems,
              expressions,
              getString,
              readonly,
              formik
            })}
          </Container>
        ) : (
          <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
            {renderMultiTypeList({
              name: `${prefix}spec.sourcePaths`,
              labelKey: 'pipelineSteps.sourcePathsLabel',
              allowedTypes: SupportedInputTypesForListTypeField,
              allowedTypesForEntries: SupportedInputTypesForListItems
            })}
          </Container>
        )
      ) : null}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.sourcePath') ? (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          {renderMultiTypeTextField({
            name: `${prefix}spec.sourcePath`,
            tooltipId: 'sourcePath',
            labelKey: 'pipelineSteps.sourcePathLabel',
            inputProps: {
              multiTextInputProps: {
                expressions,
                allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep
              },
              disabled: readonly
            },
            fieldPath: 'spec.sourcePath'
          })}
        </Container>
      ) : null}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.account') ? (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          {renderMultiTypeTextField({
            name: `${prefix}spec.account`,
            tooltipId: 'ecrAccount',
            labelKey: 'common.accountId',
            inputProps: {
              multiTextInputProps: {
                expressions,
                allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep
              },
              disabled: readonly
            },
            fieldPath: 'spec.account'
          })}
        </Container>
      ) : null}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.imageName') ? (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          {renderMultiTypeTextField({
            name: `${prefix}spec.imageName`,
            tooltipId: 'imageName',
            labelKey: 'imageNameLabel',
            inputProps: {
              multiTextInputProps: {
                expressions,
                allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep
              },
              disabled: readonly
            },
            fieldPath: 'spec.imageName'
          })}
        </Container>
      ) : null}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.tags') ? (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          {/* Corresponding input set view is handled in ArtifactStepCommon.tsx */}
          {!isInputSetView
            ? renderMultiTypeList({
                name: `${prefix}spec.tags`,
                labelKey: 'tagsLabel',
                allowedTypes: SupportedInputTypesForListTypeField,
                allowedTypesForEntries: SupportedInputTypesForListItems
              })
            : null}
        </Container>
      ) : null}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.depth') ? (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          {!isInputSetView
            ? renderMultiTypeList({
                name: `${prefix}spec.depth`,
                labelKey: 'pipeline.depth',
                allowedTypes: SupportedInputTypesForListTypeField,
                allowedTypesForEntries: SupportedInputTypesForListItems
              })
            : null}
        </Container>
      ) : null}
    </>
  )
}
