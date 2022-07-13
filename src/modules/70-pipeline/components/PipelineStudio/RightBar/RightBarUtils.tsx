/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */
import React, { SetStateAction, Dispatch } from 'react'
import * as Yup from 'yup'

import { TextInput, Text, MultiTypeInputType, Container, getMultiTypeFromValue } from '@wings-software/uicore'
import { set } from 'lodash-es'
import { FontVariation } from '@harness/design-system'
import type { UseStringsReturn } from 'framework/strings'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import { MultiTypeTextField } from '@common/components/MultiTypeText/MultiTypeText'
import { ConnectorRefWidth } from '@pipeline/utils/constants'
import {
  generateSchemaForLimitCPU,
  generateSchemaForLimitMemory
} from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'
import {
  handleCIConnectorRefOnChange,
  ConnectionType,
  ConnectorRefInterface
} from '@pipeline/components/PipelineInputSetForm/CICodebaseInputSetForm'
import { isRuntimeInput } from '@pipeline/utils/CIUtils'
import { Connectors } from '@connectors/constants'
import css from './RightBar.module.scss'

const onlyPositiveIntegerKeyRef = 'pipeline.onlyPositiveInteger'
export interface CodebaseRuntimeInputsInterface {
  connectorRef?: boolean
  repoName?: boolean
}

const getConnectorWidth = ({
  connectorWidth,
  connectorRef
}: {
  connectorWidth?: number
  connectorRef?: string
}): number | undefined => {
  if (connectorWidth) {
    return !isRuntimeInput(connectorRef) ? ConnectorRefWidth.EditStageView : ConnectorRefWidth.EditStageViewInputSet
  }
  return (!isRuntimeInput(connectorRef) && ConnectorRefWidth.RightBarView) || undefined
}

export const renderConnectorAndRepoName = ({
  values,
  setFieldValue,
  connectorUrl,
  connectionType,
  setConnectionType,
  setConnectorUrl,
  getString,
  errors,
  loading,
  accountId,
  projectIdentifier,
  orgIdentifier,
  repoIdentifier,
  branch,
  expressions,
  isReadonly,
  setCodebaseRuntimeInputs,
  codebaseRuntimeInputs,
  connectorWidth
}: {
  values: { [key: string]: any }
  setFieldValue: (field: string, value: any) => void
  connectorUrl: string
  connectionType: string
  setConnectionType: Dispatch<SetStateAction<string>>
  setConnectorUrl: Dispatch<SetStateAction<string>>
  getString: UseStringsReturn['getString']
  errors: { [key: string]: any }
  loading: boolean
  accountId: string
  projectIdentifier: string
  orgIdentifier: string
  repoIdentifier?: string
  branch?: string
  expressions: string[]
  isReadonly: boolean
  setCodebaseRuntimeInputs: Dispatch<SetStateAction<CodebaseRuntimeInputsInterface>>
  codebaseRuntimeInputs: CodebaseRuntimeInputsInterface
  connectorWidth?: number
}): JSX.Element => (
  <>
    <Container className={css.bottomMargin3}>
      <FormMultiTypeConnectorField
        name="connectorRef"
        type={[
          Connectors.GIT,
          Connectors.GITHUB,
          Connectors.GITLAB,
          Connectors.BITBUCKET,
          Connectors.AWS_CODECOMMIT,
          Connectors.AZURE_REPO
        ]}
        label={getString('connector')}
        width={getConnectorWidth({ connectorWidth, connectorRef: values.connectorRef })}
        error={errors?.connectorRef}
        placeholder={loading ? getString('loading') : getString('connectors.selectConnector')}
        accountIdentifier={accountId}
        projectIdentifier={projectIdentifier}
        orgIdentifier={orgIdentifier}
        gitScope={{ repo: repoIdentifier || '', branch, getDefaultFromOtherRepo: true }}
        multiTypeProps={{
          expressions,
          disabled: isReadonly,
          allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME] // BE does not support expressions
        }}
        onChange={(value, _valueType, connectorRefType) => {
          // add coverage once connector select available in jest tests
          /* istanbul ignore next */
          handleCIConnectorRefOnChange({
            value: value as ConnectorRefInterface,
            connectorRefType,
            setConnectionType,
            setConnectorUrl,
            setFieldValue
          })
          /* istanbul ignore next */
          setCodebaseRuntimeInputs({
            ...codebaseRuntimeInputs,
            connectorRef: isRuntimeInput(value),
            repoName: connectorRefType === MultiTypeInputType.RUNTIME
          })
        }}
      />
    </Container>

    {!isRuntimeInput(values.connectorRef) && connectionType === ConnectionType.Repo ? (
      <>
        <Text font={{ variation: FontVariation.FORM_LABEL }} margin={{ bottom: 'xsmall' }}>
          {getString('common.repositoryName')}
        </Text>
        <TextInput name="repoName" value={connectorUrl} style={{ flexGrow: 1 }} disabled />
      </>
    ) : (
      <>
        <Container className={css.bottomMargin3}>
          <MultiTypeTextField
            key={`connector-runtimeinput-${codebaseRuntimeInputs.connectorRef}`} // handle reload RepoName from ConnectorRef as Runtime to Fixed
            label={
              <Text
                font={{ variation: FontVariation.FORM_LABEL }}
                margin={{ bottom: 'xsmall' }}
                tooltipProps={{ dataTooltipId: 'rightBarForm_repoName' }}
              >
                {getString('common.repositoryName')}
              </Text>
            }
            name="repoName"
            multiTextInputProps={{
              multiTextInputProps: {
                expressions,
                allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME]
              },
              disabled: isReadonly || (isRuntimeInput(values.connectorRef) && isRuntimeInput(values.repoName)) // connector is a runtime input
            }}
          />
        </Container>
        {!isRuntimeInput(values.connectorRef) && !isRuntimeInput(values.repoName) && connectorUrl?.length > 0 ? (
          <div className={css.predefinedValue}>
            <Text lineClamp={1} width={connectorWidth ? connectorWidth : '460px'}>
              {(connectorUrl[connectorUrl.length - 1] === '/' ? connectorUrl : connectorUrl + '/') +
                (values.repoName ? values.repoName : '')}
            </Text>
          </div>
        ) : null}
      </>
    )}
  </>
)

export const validateCIForm = ({
  values,
  getString
}: {
  values: { [key: string]: any }
  getString: UseStringsReturn['getString']
}): { [key: string]: any } => {
  const errors = {}
  if (getMultiTypeFromValue(values.depth) === MultiTypeInputType.FIXED) {
    try {
      Yup.number()
        .notRequired()
        .integer(getString(onlyPositiveIntegerKeyRef))
        .positive(getString(onlyPositiveIntegerKeyRef))
        .typeError(getString(onlyPositiveIntegerKeyRef))
        .validateSync(values.depth === '' ? undefined : values.depth)
    } catch (error) {
      set(errors, 'depth', error.message)
    }
  }
  try {
    generateSchemaForLimitMemory({ getString }).validateSync(values.memoryLimit)
  } catch (error) {
    set(errors, 'memoryLimit', error.message)
  }
  try {
    generateSchemaForLimitCPU({ getString }).validateSync(values.cpuLimit)
  } catch (error) {
    set(errors, 'cpuLimit', error.message)
  }
  return errors
}
