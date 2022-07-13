/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import { isEmpty, startCase } from 'lodash-es'
import cx from 'classnames'
import { Container, Layout, MultiTypeInputType, Text, FormInput, SelectOption } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import type { StringsMap } from 'stringTypes'
import { FormMultiTypeCheckboxField } from '@common/components/MultiTypeCheckbox/MultiTypeCheckbox'
import { MultiTypeTextField, MultiTypeTextProps } from '@common/components/MultiTypeText/MultiTypeText'
import MultiTypeMap from '@common/components/MultiTypeMap/MultiTypeMap'
import { MultiTypeMapInputSet } from '@common/components/MultiTypeMapInputSet/MultiTypeMapInputSet'
import MultiTypeList, { ConnectorReferenceProps } from '@common/components/MultiTypeList/MultiTypeList'
import { MultiTypeListInputSet } from '@common/components/MultiTypeListInputSet/MultiTypeListInputSet'
import {
  FormMultiTypeConnectorField,
  MultiTypeConnectorFieldProps
} from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import type { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import {
  getAllowedValuesFromTemplate,
  shouldRenderRunTimeInputViewWithAllowedValues,
  useGitScope
} from '@pipeline/utils/CIUtils'
import { ConnectorRefWidth, sslVerifyOptions } from '@pipeline/utils/constants'
import { MultiTypeSelectField } from '@common/components/MultiTypeSelect/MultiTypeSelect'
import { ArchiveFormatOptions } from '../../../constants/Constants'
import {
  AllMultiTypeInputTypesForInputSet,
  AllMultiTypeInputTypesForStep,
  SupportedInputTypesForListTypeField,
  SupportedInputTypesForOPVarsListItems,
  SupportedInputTypesForListItems,
  SupportedInputTypesForListTypeFieldInInputSetView
} from './StepUtils'
import css from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

export interface CIStepOptionalConfigProps {
  readonly?: boolean
  enableFields: {
    [key: string]: { [key: string]: any }
  }
  stepViewType: StepViewType
  path?: string
  formik?: any
  isInputSetView?: boolean
  allowableTypes?: MultiTypeInputType[]
  template?: Record<string, any>
  stepType?: StepType // See RunAndRunTestStepInputCommonFields
}

export const getOptionalSubLabel = (
  getString: (key: keyof StringsMap, vars?: Record<string, any> | undefined) => string,
  tooltip?: string
) => (
  <Text
    tooltipProps={tooltip ? { dataTooltipId: tooltip } : {}}
    className={css.inpLabel}
    color={Color.GREY_400}
    font={{ size: 'small', weight: 'semi-bold' }}
    style={{ textTransform: 'capitalize' }}
  >
    {getString?.('common.optionalLabel')}
  </Text>
)

export const renderMultiTypeListInputSet = ({
  name,
  tooltipId,
  labelKey,
  placeholderKey,
  withObjectStructure,
  keyName,
  allowedTypes,
  allowedTypesForEntries,
  expressions,
  getString,
  readonly,
  formik,
  showConnectorRef,
  connectorTypes,
  connectorRefRenderer,
  restrictToSingleEntry
}: {
  name: string
  tooltipId: string
  labelKey: keyof StringsMap
  placeholderKey?: keyof StringsMap
  withObjectStructure?: boolean
  keyName?: string
  allowedTypes: MultiTypeInputType[]
  allowedTypesForEntries: MultiTypeInputType[]
  expressions: string[]
  getString: (key: keyof StringsMap, vars?: Record<string, any> | undefined) => string
  readonly?: boolean
  formik?: any
  restrictToSingleEntry?: boolean
} & ConnectorReferenceProps) => (
  <MultiTypeListInputSet
    name={name}
    multiTextInputProps={{
      expressions,
      allowableTypes: allowedTypesForEntries
    }}
    multiTypeFieldSelectorProps={{
      label: (
        <Layout.Horizontal flex={{ justifyContent: 'flex-start', alignItems: 'baseline' }}>
          <Text
            style={{ display: 'flex', alignItems: 'center' }}
            className={css.inpLabel}
            color={Color.GREY_800}
            font={{ size: 'small', weight: 'semi-bold' }}
          >
            {getString(labelKey)}
          </Text>
          &nbsp;
          {getOptionalSubLabel(getString, tooltipId)}
        </Layout.Horizontal>
      ),
      allowedTypes: allowedTypes
    }}
    placeholder={placeholderKey ? getString(placeholderKey) : ''}
    disabled={readonly}
    formik={formik}
    withObjectStructure={withObjectStructure}
    keyName={keyName}
    showConnectorRef={showConnectorRef}
    connectorTypes={connectorTypes}
    connectorRefRenderer={connectorRefRenderer}
    restrictToSingleEntry={restrictToSingleEntry}
  />
)

export const renderMultiTypeInputWithAllowedValues = ({
  name,
  tooltipId,
  labelKey,
  fieldPath,
  template,
  expressions,
  readonly,
  getString,
  showOptionalSublabel
}: {
  name: string
  tooltipId?: string
  labelKey: keyof StringsMap
  fieldPath: string
  template?: Record<string, any>
  expressions: string[]
  readonly?: boolean
  getString: (key: keyof StringsMap, vars?: Record<string, any> | undefined) => string
  showOptionalSublabel?: boolean
}) => {
  if (!name) {
    return
  }
  if (template && fieldPath) {
    const items = getAllowedValuesFromTemplate(template, fieldPath)
    return (
      <FormInput.MultiTypeInput
        name={name}
        label={getString(labelKey).concat(showOptionalSublabel ? ` ${getString('titleOptional')}` : '')}
        useValue
        selectItems={items}
        multiTypeInputProps={{
          allowableTypes: AllMultiTypeInputTypesForInputSet,
          expressions,
          selectProps: { disabled: readonly, items }
        }}
        disabled={readonly}
        tooltipProps={{ dataTooltipId: tooltipId ?? '' }}
      />
    )
  }
}

export const CIStepOptionalConfig: React.FC<CIStepOptionalConfigProps> = props => {
  const { readonly, enableFields, stepViewType, path, formik, isInputSetView, template } = props
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const prefix = isEmpty(path) ? '' : `${path}.`
  const gitScope = useGitScope()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<{
    projectIdentifier: string
    orgIdentifier: string
    accountId: string
  }>()

  const stepCss = stepViewType === StepViewType.DeploymentForm ? css.sm : css.lg

  const renderMultiTypeMap = React.useCallback(
    ({
      fieldName,
      stringKey,
      tooltipId,
      allowableTypes,
      keyLabel,
      valueLabel,
      restrictToSingleEntry
    }: {
      fieldName: string
      stringKey: keyof StringsMap
      tooltipId?: string
      allowableTypes: MultiTypeInputType[]
      keyLabel?: keyof StringsMap
      valueLabel?: keyof StringsMap
      restrictToSingleEntry?: boolean
    }): React.ReactElement => (
      <Container className={cx(css.formGroup, css.bottomMargin5, css.lg)}>
        <MultiTypeMap
          name={fieldName}
          valueMultiTextInputProps={{ expressions, allowableTypes }}
          multiTypeFieldSelectorProps={{
            label: (
              <Layout.Horizontal flex={{ justifyContent: 'flex-start', alignItems: 'baseline' }}>
                <Text
                  style={{ display: 'flex', alignItems: 'center' }}
                  className={css.inpLabel}
                  color={Color.GREY_800}
                  font={{ size: 'small', weight: 'semi-bold' }}
                >
                  {getString(stringKey)}
                </Text>
                &nbsp;
                {getOptionalSubLabel(getString, tooltipId)}
              </Layout.Horizontal>
            )
          }}
          disabled={readonly}
          keyLabel={keyLabel ? getString(keyLabel) : ''}
          valueLabel={valueLabel ? getString(valueLabel) : ''}
          restrictToSingleEntry={restrictToSingleEntry}
        />
      </Container>
    ),
    [expressions]
  )

  const renderMultiTypeMapInputSet = React.useCallback(
    ({
      fieldName,
      stringKey,
      tooltipId,
      keyLabel,
      valueLabel,
      restrictToSingleEntry
    }: {
      fieldName: string
      stringKey: keyof StringsMap
      tooltipId?: string
      keyLabel?: keyof StringsMap
      valueLabel?: keyof StringsMap
      restrictToSingleEntry?: boolean
    }): React.ReactElement => (
      <Container className={cx(css.formGroup, css.bottomMargin5)}>
        <MultiTypeMapInputSet
          name={fieldName}
          valueMultiTextInputProps={{
            allowableTypes: [MultiTypeInputType.EXPRESSION, MultiTypeInputType.FIXED],
            expressions
          }}
          multiTypeFieldSelectorProps={{
            label: (
              <Layout.Horizontal flex={{ justifyContent: 'flex-start', alignItems: 'baseline' }}>
                <Text className={css.inpLabel} color={Color.GREY_600} font={{ size: 'small', weight: 'semi-bold' }}>
                  {getString(stringKey)}
                </Text>
                &nbsp;
                {getOptionalSubLabel(getString, tooltipId)}
              </Layout.Horizontal>
            ),
            allowedTypes: [MultiTypeInputType.FIXED]
          }}
          disabled={readonly}
          formik={formik}
          keyLabel={keyLabel ? getString(keyLabel) : ''}
          valueLabel={valueLabel ? getString(valueLabel) : ''}
          restrictToSingleEntry={restrictToSingleEntry}
        />
      </Container>
    ),
    [expressions, readonly, formik]
  )

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
          tooltipId: tooltipId,
          labelKey: labelKey,
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
            <Layout.Horizontal flex={{ justifyContent: 'flex-start', alignItems: 'baseline' }}>
              <Text
                margin={{ top: 'small' }}
                className={css.inpLabel}
                color={Color.GREY_600}
                font={{ size: 'small', weight: 'semi-bold' }}
              >
                {getString(labelKey)}
              </Text>
              &nbsp;
              {getOptionalSubLabel(getString, tooltipId)}
            </Layout.Horizontal>
          }
          multiTextInputProps={inputProps}
        />
      )
    },
    []
  )

  const renderMultiTypeCheckboxField = React.useCallback(
    ({
      name,
      tooltipId,
      labelKey,
      allowableTypes
    }: {
      name: string
      tooltipId: string
      labelKey: keyof StringsMap
      allowableTypes: MultiTypeInputType[]
    }) => (
      <FormMultiTypeCheckboxField
        name={name}
        label={getString(labelKey).concat(` (${startCase(getString('common.optionalLabel'))})`)}
        multiTypeTextbox={{
          expressions,
          allowableTypes,
          disabled: readonly
        }}
        tooltipProps={{ dataTooltipId: tooltipId }}
        disabled={readonly}
      />
    ),
    [expressions]
  )

  const renderMultiTypeList = React.useCallback(
    ({
      name,
      tooltipId,
      labelKey,
      placeholderKey,
      allowedTypes,
      allowedTypesForEntries,
      showConnectorRef,
      connectorTypes,
      connectorRefRenderer,
      restrictToSingleEntry
    }: {
      name: string
      tooltipId?: string
      labelKey: keyof StringsMap
      placeholderKey?: keyof StringsMap
      allowedTypes: MultiTypeInputType[]
      allowedTypesForEntries: MultiTypeInputType[]
      restrictToSingleEntry?: boolean
    } & ConnectorReferenceProps) => (
      <MultiTypeList
        name={name}
        placeholder={placeholderKey ? getString(placeholderKey) : ''}
        multiTextInputProps={{
          expressions,
          allowableTypes: allowedTypesForEntries
        }}
        multiTypeFieldSelectorProps={{
          label: (
            <Layout.Horizontal flex={{ justifyContent: 'flex-start', alignItems: 'baseline' }}>
              <Text
                style={{ display: 'flex', alignItems: 'center' }}
                className={css.inpLabel}
                color={Color.GREY_800}
                font={{ size: 'small', weight: 'semi-bold' }}
              >
                {getString(labelKey)}
              </Text>
              &nbsp;
              {getOptionalSubLabel(getString, tooltipId)}
            </Layout.Horizontal>
          ),
          allowedTypes: allowedTypes
        }}
        disabled={readonly}
        showConnectorRef={showConnectorRef}
        connectorTypes={connectorTypes}
        connectorRefRenderer={connectorRefRenderer}
        restrictToSingleEntry={restrictToSingleEntry}
      />
    ),
    [expressions]
  )

  const renderConnectorRef = React.useCallback(
    ({
      name,
      connectorTypes,
      label
    }: {
      name: string
      connectorTypes?: ConnectorReferenceProps['connectorTypes']
      label?: MultiTypeConnectorFieldProps['label']
    }): JSX.Element => {
      return (
        <FormMultiTypeConnectorField
          label={label ?? ''}
          type={connectorTypes}
          width={ConnectorRefWidth.InputSetView}
          name={name}
          placeholder={getString('select')}
          accountIdentifier={accountId}
          projectIdentifier={projectIdentifier}
          orgIdentifier={orgIdentifier}
          multiTypeProps={{
            expressions,
            allowableTypes: [MultiTypeInputType.FIXED],
            disabled: readonly
          }}
          gitScope={gitScope}
          setRefValue
        />
      )
    },
    [gitScope, readonly, expressions, accountId, projectIdentifier, orgIdentifier]
  )

  return (
    <>
      {/* Tag is not an optional configuration but due to some weird error, it's being placed here for time being till real reason is figured out.*/}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.tags') ? (
        <Container className={cx(css.formGroup, css.bottomMargin5, css.md)}>
          <MultiTypeListInputSet
            name={`${prefix}spec.tags`}
            multiTextInputProps={{
              allowableTypes: [MultiTypeInputType.EXPRESSION, MultiTypeInputType.FIXED],
              expressions
            }}
            multiTypeFieldSelectorProps={{
              label: (
                <Text
                  className={css.inpLabel}
                  color={Color.GREY_600}
                  font={{ size: 'small', weight: 'semi-bold' }}
                  tooltipProps={{ dataTooltipId: 'tags' }}
                >
                  {getString('tagsLabel')}
                </Text>
              ),
              allowedTypes: [MultiTypeInputType.FIXED]
            }}
            disabled={readonly}
            formik={formik}
          />
        </Container>
      ) : null}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.baseImageConnectorRefs') && (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          {isInputSetView
            ? renderMultiTypeListInputSet({
                name: `${prefix}spec.baseImageConnectorRefs`,
                tooltipId: 'baseImageConnectorRefs',
                labelKey: 'ci.baseConnectorImage',
                allowedTypes: SupportedInputTypesForListTypeFieldInInputSetView,
                allowedTypesForEntries: SupportedInputTypesForListItems,
                expressions,
                getString,
                readonly,
                formik,
                showConnectorRef: true,
                connectorTypes: enableFields['spec.baseImageConnectorRefs'].type,
                connectorRefRenderer: renderConnectorRef,
                restrictToSingleEntry: true
              })
            : renderMultiTypeList({
                name: `${prefix}spec.baseImageConnectorRefs`,
                tooltipId: 'baseImageConnectorRefs',
                labelKey: 'ci.baseConnectorImage',
                allowedTypes: SupportedInputTypesForListTypeField,
                allowedTypesForEntries: SupportedInputTypesForListItems,
                showConnectorRef: true,
                connectorTypes: enableFields['spec.baseImageConnectorRefs'].type,
                connectorRefRenderer: renderConnectorRef,
                restrictToSingleEntry: true
              })}
        </Container>
      )}
      {!enableFields['spec.privileged']?.shouldHide &&
      Object.prototype.hasOwnProperty.call(enableFields, 'spec.privileged') ? (
        <div className={cx(css.formGroup, css.sm)}>
          {renderMultiTypeCheckboxField({
            name: `${prefix}spec.privileged`,
            tooltipId: 'privileged',
            labelKey: 'pipeline.buildInfra.privileged',
            allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep
          })}
        </div>
      ) : null}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.settings')
        ? isInputSetView
          ? renderMultiTypeMapInputSet({
              fieldName: `${prefix}spec.settings`,
              stringKey: 'settingsLabel',
              tooltipId: 'pluginSettings'
            })
          : renderMultiTypeMap({
              fieldName: `${prefix}spec.settings`,
              stringKey: 'settingsLabel',
              allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep
            })
        : null}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.reportPaths') && (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          {isInputSetView
            ? renderMultiTypeListInputSet({
                name: `${prefix}spec.reports.spec.paths`,
                tooltipId: 'reportPaths',
                labelKey: 'pipelineSteps.reportPathsLabel',
                allowedTypes: SupportedInputTypesForListTypeFieldInInputSetView,
                allowedTypesForEntries: SupportedInputTypesForListItems,
                placeholderKey: 'pipelineSteps.reportPathsPlaceholder',
                expressions,
                getString,
                readonly,
                formik
              })
            : renderMultiTypeList({
                name: `${prefix}spec.reportPaths`,
                placeholderKey: 'pipelineSteps.reportPathsPlaceholder',
                labelKey: 'pipelineSteps.reportPathsLabel',
                allowedTypes: SupportedInputTypesForListTypeField,
                allowedTypesForEntries: SupportedInputTypesForListItems
              })}
        </Container>
      )}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.outputVariables') && (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          {isInputSetView
            ? renderMultiTypeListInputSet({
                name: `${prefix}spec.outputVariables`,
                tooltipId: 'outputVariables',
                labelKey: 'pipelineSteps.outputVariablesLabel',
                allowedTypes: SupportedInputTypesForListTypeFieldInInputSetView,
                allowedTypesForEntries: SupportedInputTypesForOPVarsListItems,
                expressions,
                getString,
                readonly,
                formik,
                withObjectStructure: true,
                keyName: 'name'
              })
            : renderMultiTypeList({
                name: `${prefix}spec.outputVariables`,
                labelKey: 'pipelineSteps.outputVariablesLabel',
                allowedTypes: SupportedInputTypesForListTypeField,
                allowedTypesForEntries: SupportedInputTypesForOPVarsListItems
              })}
        </Container>
      )}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.envVariables')
        ? isInputSetView
          ? renderMultiTypeMapInputSet({ fieldName: `${prefix}spec.envVariables`, stringKey: 'environmentVariables' })
          : renderMultiTypeMap({
              fieldName: `${prefix}spec.envVariables`,
              stringKey: 'environmentVariables',
              allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep
            })
        : null}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.entrypoint') ? (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          {isInputSetView
            ? renderMultiTypeListInputSet({
                name: `${prefix}spec.entrypoint`,
                tooltipId: 'dependencyEntryPoint',
                labelKey: 'entryPointLabel',
                allowedTypes: SupportedInputTypesForListTypeFieldInInputSetView,
                allowedTypesForEntries: SupportedInputTypesForListItems,
                expressions,
                getString,
                readonly,
                formik
              })
            : renderMultiTypeList({
                name: `${prefix}spec.entrypoint`,
                labelKey: 'entryPointLabel',
                tooltipId: 'dependencyEntryPoint',
                allowedTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : SupportedInputTypesForListTypeField,
                allowedTypesForEntries: SupportedInputTypesForListItems
              })}
        </Container>
      ) : null}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.args') ? (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          {isInputSetView
            ? renderMultiTypeListInputSet({
                name: `${prefix}spec.args`,
                tooltipId: 'dependencyArgs',
                labelKey: 'argsLabel',
                allowedTypes: SupportedInputTypesForListTypeFieldInInputSetView,
                allowedTypesForEntries: SupportedInputTypesForListItems,
                expressions,
                getString,
                readonly,
                formik
              })
            : renderMultiTypeList({
                name: `${prefix}spec.args`,
                labelKey: 'argsLabel',
                tooltipId: 'dependencyArgs',
                allowedTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : SupportedInputTypesForListTypeField,
                allowedTypesForEntries: SupportedInputTypesForListItems
              })}
        </Container>
      ) : null}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.portBindings')
        ? isInputSetView
          ? renderMultiTypeMapInputSet({
              fieldName: `${prefix}spec.portBindings`,
              stringKey: 'ci.portBindings',
              tooltipId: 'portBindings',
              keyLabel: 'ci.hostPort',
              valueLabel: 'ci.containerPort',
              restrictToSingleEntry: true
            })
          : renderMultiTypeMap({
              fieldName: `${prefix}spec.portBindings`,
              stringKey: 'ci.portBindings',
              tooltipId: 'portBindings',
              allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep,
              keyLabel: 'ci.hostPort',
              valueLabel: 'ci.containerPort',
              restrictToSingleEntry: true
            })
        : null}
      {!enableFields['spec.optimize']?.shouldHide &&
      Object.prototype.hasOwnProperty.call(enableFields, 'spec.optimize') ? (
        <div className={cx(css.formGroup, css.sm, css.bottomMargin5)}>
          {renderMultiTypeCheckboxField({
            name: `${prefix}spec.optimize`,
            tooltipId: 'optimize',
            labelKey: 'ci.optimize',
            allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep
          })}
        </div>
      ) : null}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.dockerfile') ? (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          {renderMultiTypeTextField({
            name: `${prefix}spec.dockerfile`,
            tooltipId: 'dockerfile',
            labelKey: 'pipelineSteps.dockerfileLabel',
            inputProps: {
              multiTextInputProps: {
                expressions,
                allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep
              },
              disabled: readonly
            },
            fieldPath: 'spec.dockerfile'
          })}
        </Container>
      ) : null}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.context') ? (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          {renderMultiTypeTextField({
            name: `${prefix}spec.context`,
            tooltipId: 'context',
            labelKey: 'pipelineSteps.contextLabel',
            inputProps: {
              multiTextInputProps: {
                expressions,
                allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep
              },
              disabled: readonly
            },
            fieldPath: 'spec.context'
          })}
        </Container>
      ) : null}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.labels')
        ? isInputSetView
          ? renderMultiTypeMapInputSet({ fieldName: `${prefix}spec.labels`, stringKey: 'pipelineSteps.labelsLabel' })
          : renderMultiTypeMap({
              fieldName: `${prefix}spec.labels`,
              stringKey: 'pipelineSteps.labelsLabel',
              allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep
            })
        : null}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.buildArgs')
        ? isInputSetView
          ? renderMultiTypeMapInputSet({
              fieldName: `${prefix}spec.buildArgs`,
              stringKey: 'pipelineSteps.buildArgsLabel'
            })
          : renderMultiTypeMap({
              fieldName: `${prefix}spec.buildArgs`,
              stringKey: 'pipelineSteps.buildArgsLabel',
              allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep
            })
        : null}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.endpoint') ? (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          {renderMultiTypeTextField({
            name: `${prefix}spec.endpoint`,
            tooltipId: 'endpoint',
            labelKey: 'pipelineSteps.endpointLabel',
            inputProps: {
              placeholder: getString('pipelineSteps.endpointPlaceholder'),
              multiTextInputProps: {
                expressions,
                allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep
              },
              disabled: readonly
            },
            fieldPath: 'spec.endpoint'
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
              placeholder: getString('pipelineSteps.artifactsTargetPlaceholder'),
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
      {!enableFields['spec.remoteCacheImage']?.shouldHide &&
      Object.prototype.hasOwnProperty.call(enableFields, 'spec.remoteCacheImage') ? (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          {renderMultiTypeTextField({
            name: `${prefix}spec.remoteCacheImage`,
            tooltipId: 'gcrRemoteCache',
            labelKey: 'ci.remoteCacheImage.label',
            inputProps: {
              multiTextInputProps: {
                expressions,
                allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep
              },
              disabled: readonly
            },
            fieldPath: 'spec.remoteCacheImage'
          })}
        </Container>
      ) : null}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.archiveFormat') ? (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          <MultiTypeSelectField
            name={`${prefix}spec.archiveFormat`}
            label={
              <Layout.Horizontal flex={{ justifyContent: 'flex-start', alignItems: 'baseline' }}>
                <Text
                  margin={{ top: 'small' }}
                  className={css.inpLabel}
                  color={Color.GREY_600}
                  font={{ size: 'small', weight: 'semi-bold' }}
                >
                  {getString('archiveFormat')}
                </Text>
                &nbsp;
                {getOptionalSubLabel(getString, 'archiveFormat')}
              </Layout.Horizontal>
            }
            multiTypeInputProps={{
              selectItems: ArchiveFormatOptions,
              multiTypeInputProps: {
                expressions,
                allowableTypes: isInputSetView
                  ? AllMultiTypeInputTypesForInputSet
                  : [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]
              },
              disabled: readonly
            }}
            disabled={readonly}
          />
        </Container>
      ) : null}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.override') ? (
        <div className={cx(css.formGroup, css.sm, css.bottomMargin5)}>
          {renderMultiTypeCheckboxField({
            name: `${prefix}spec.override`,
            tooltipId: 'saveCacheOverride',
            labelKey: 'override',
            allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep
          })}
        </div>
      ) : null}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.pathStyle') ? (
        <div className={cx(css.formGroup, css.sm)}>
          {renderMultiTypeCheckboxField({
            name: `${prefix}spec.pathStyle`,
            tooltipId: 'pathStyle',
            labelKey: 'pathStyle',
            allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep
          })}
        </div>
      ) : null}
      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.failIfKeyNotFound') ? (
        <div className={cx(css.formGroup, css.sm, css.bottomMargin5)}>
          {renderMultiTypeCheckboxField({
            name: `${prefix}spec.failIfKeyNotFound`,
            tooltipId: 'failIfKeyNotFound',
            labelKey: 'failIfKeyNotFound',
            allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep
          })}
        </div>
      ) : null}
      {!enableFields['spec.remoteCacheRepo']?.shouldHide &&
      Object.prototype.hasOwnProperty.call(enableFields, 'spec.remoteCacheRepo') ? (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          {renderMultiTypeTextField({
            name: `${prefix}spec.remoteCacheRepo`,
            tooltipId: 'dockerHubRemoteCache',
            labelKey: 'ci.remoteCacheRepository.label',
            inputProps: {
              multiTextInputProps: {
                expressions,
                allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep
              },
              disabled: readonly
            },
            fieldPath: 'spec.remoteCacheRepo'
          })}
        </Container>
      ) : null}

      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.depth') ? (
        <div className={cx(css.formGroup, css.lg, css.bottomMargin5)}>
          {renderMultiTypeTextField({
            name: `${prefix}spec.depth`,
            labelKey: 'pipeline.depth',
            tooltipId: 'depth',
            inputProps: {
              multiTextInputProps: {
                expressions,
                allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep
              },
              disabled: readonly
            },
            fieldPath: 'spec.depth'

            // allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep
          })}
        </div>
      ) : null}

      {Object.prototype.hasOwnProperty.call(enableFields, 'spec.sslVerify') ? (
        <Container className={cx(css.formGroup, stepCss, css.bottomMargin5)}>
          <MultiTypeSelectField
            name={`${prefix}spec.sslVerify`}
            label={
              <Layout.Horizontal flex={{ justifyContent: 'flex-start', alignItems: 'baseline' }}>
                <Text
                  margin={{ top: 'small' }}
                  className={css.inpLabel}
                  color={Color.GREY_600}
                  font={{ size: 'small', weight: 'semi-bold' }}
                >
                  {getString('pipeline.sslVerify')}
                </Text>
                &nbsp;
                {getOptionalSubLabel(getString, 'sslVerify')}
              </Layout.Horizontal>
            }
            multiTypeInputProps={{
              selectItems: sslVerifyOptions as unknown as SelectOption[],
              multiTypeInputProps: {
                expressions,
                selectProps: {
                  addClearBtn: true,
                  items: sslVerifyOptions as unknown as SelectOption[]
                },
                allowableTypes: isInputSetView ? AllMultiTypeInputTypesForInputSet : AllMultiTypeInputTypesForStep
              },
              disabled: readonly
            }}
            useValue
            disabled={readonly}
          />
        </Container>
      ) : null}
    </>
  )
}
