/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { defaultTo, get, isEmpty, isNil } from 'lodash-es'
import { connect, FormikProps } from 'formik'
import cx from 'classnames'
import { parse } from 'yaml'
import { Spinner } from '@blueprintjs/core'

import {
  ButtonSize,
  ButtonVariation,
  Container,
  Dialog,
  FormInput,
  getMultiTypeFromValue,
  Layout,
  MultiTypeInputType,
  SelectOption,
  useToaster
} from '@harness/uicore'
import { useModalHook } from '@harness/use-modal'

import { useStrings } from 'framework/strings'
import {
  InfrastructureResponse,
  InfrastructureResponseDTO,
  useGetInfrastructureInputs,
  useGetInfrastructureList
} from 'services/cd-ng'

import type { PipelinePathProps } from '@common/interfaces/RouteInterfaces'

import RbacButton from '@rbac/components/Button/Button'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'

import InfrastructureModal from '@cd/components/EnvironmentsV2/EnvironmentDetails/InfrastructureDefinition/InfrastructureModal'

import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'

import { useRunPipelineFormContext } from '@pipeline/context/RunPipelineFormContext'
import type { DeployStageConfig } from '@pipeline/utils/DeployStageInterface'
import { clearRuntimeInput } from '@pipeline/utils/runPipelineUtils'
import { isEditInfrastructure } from '../utils'

import css from './DeployInfrastructures.module.scss'

interface DeployInfrastructuresProps {
  formik?: FormikProps<DeployStageConfig>
  readonly?: boolean
  allowableTypes: MultiTypeInputType[]
  initialValues: DeployStageConfig
  environmentRef?: string
  path?: string
}

function DeployInfrastructures({
  initialValues,
  formik,
  readonly,
  allowableTypes,
  environmentRef,
  path
}: DeployInfrastructuresProps) {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<PipelinePathProps>()
  const { getString } = useStrings()
  const { showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()
  const { expressions } = useVariablesExpression()

  const environmentIdentifier = useMemo(() => {
    return defaultTo(environmentRef || formik?.values?.environment?.environmentRef, '')
  }, [formik?.values?.environment?.environmentRef])

  const { updateTemplate } = useRunPipelineFormContext()

  const {
    data: infrastructuresResponse,
    loading: infrastructuresLoading,
    error: infrastructuresError
  } = useGetInfrastructureList({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      environmentIdentifier
    }
  })

  const {
    data: infrastructureInputsResponse,
    loading: infrastructureInputsLoading,
    refetch: refetchInfrastructureInputs
  } = useGetInfrastructureInputs({
    lazy: true
  })

  const [infrastructures, setInfrastructures] = useState<InfrastructureResponseDTO[]>()
  const [selectedInfrastructure, setSelectedInfrastructure] = useState<string | undefined>()
  const [infrastructuresSelectOptions, setInfrastructuresSelectOptions] = useState<SelectOption[]>()
  const [infrastructureRefType, setInfrastructureRefType] = useState<MultiTypeInputType>(
    getMultiTypeFromValue(initialValues.infrastructureRef)
  )

  useEffect(() => {
    if (!infrastructureInputsLoading) {
      if (infrastructureInputsResponse?.data?.inputSetTemplateYaml) {
        const parsedInfrastructureDefinitionYaml = parse(
          defaultTo(infrastructureInputsResponse?.data?.inputSetTemplateYaml, '{}')
        )

        if (path) {
          formik?.setFieldValue(
            `${path}.infrastructureDefinitions[0]`,
            clearRuntimeInput(parsedInfrastructureDefinitionYaml.infrastructureDefinitions[0])
          )
          updateTemplate(
            parsedInfrastructureDefinitionYaml.infrastructureDefinitions[0],
            `${path}.infrastructureDefinitions[0]`
          )
        } else {
          formik?.setFieldValue('infrastructureInputs', parsedInfrastructureDefinitionYaml)
        }
      }
    } else {
      formik?.setFieldValue('infrastructureInputs', undefined)
    }
  }, [infrastructureInputsLoading])

  useEffect(() => {
    if (selectedInfrastructure) {
      const parsedInfraYaml = parse(defaultTo(selectedInfrastructure, '{}'))
      refetchInfrastructureInputs({
        queryParams: {
          accountIdentifier: accountId,
          orgIdentifier,
          projectIdentifier,
          environmentIdentifier,
          infraIdentifiers: [parsedInfraYaml?.infrastructureDefinition?.identifier]
        },
        queryParamStringifyOptions: {
          arrayFormat: 'comma'
        }
      })
    }
  }, [selectedInfrastructure])

  useEffect(() => {
    if (!infrastructuresLoading && !get(infrastructuresResponse, 'data.empty')) {
      setInfrastructures(
        defaultTo(
          get(infrastructuresResponse, 'data.content', [])?.map((infrastructureObj: InfrastructureResponse) => ({
            ...infrastructureObj.infrastructure
          })),
          []
        )
      )
    }
  }, [infrastructuresLoading, infrastructuresResponse])

  useEffect(() => {
    if (!isNil(infrastructures)) {
      setInfrastructuresSelectOptions(
        infrastructures.map(infrastructure => {
          return { label: defaultTo(infrastructure.name, ''), value: defaultTo(infrastructure.identifier, '') }
        })
      )
    }
  }, [infrastructures])

  useEffect(() => {
    if (
      !isEmpty(infrastructuresSelectOptions) &&
      !isNil(infrastructuresSelectOptions) &&
      initialValues.infrastructureRef
    ) {
      if (getMultiTypeFromValue(initialValues.infrastructureRef) === MultiTypeInputType.FIXED) {
        const existingInfrastructure = infrastructuresSelectOptions.find(
          infra => infra.value === initialValues.infrastructureRef
        )
        if (!existingInfrastructure) {
          if (!readonly) {
            formik?.setFieldValue(path ? `${path}.infrastructureDefinitions[0].identifier` : 'infrastructureRef', '')
          } else {
            const options = [...infrastructuresSelectOptions]
            options.push({
              label: initialValues.infrastructureRef,
              value: initialValues.infrastructureRef
            })
            setInfrastructuresSelectOptions(options)
          }
        } else {
          formik?.setFieldValue(
            path ? `${path}.infrastructureDefinitions[0].identifier` : 'infrastructureRef',
            existingInfrastructure.value
          )
          setSelectedInfrastructure(
            infrastructures?.filter(infra => infra.identifier === existingInfrastructure?.value)?.[0]?.yaml
          )
        }
      }
    }
  }, [infrastructuresSelectOptions])

  useEffect(() => {
    if (!isNil(infrastructuresError)) {
      showError(getRBACErrorMessage(infrastructuresError))
    }
  }, [infrastructuresError])

  const updateInfrastructuresList = (values: InfrastructureResponseDTO) => {
    const newInfrastructureList = [...defaultTo(infrastructures, [])]
    const existingIndex = newInfrastructureList.findIndex(item => item.identifier === values.identifier)
    if (existingIndex >= 0) {
      newInfrastructureList.splice(existingIndex, 1, values)
    } else {
      newInfrastructureList.unshift(values)
    }
    setInfrastructures(newInfrastructureList)
    setSelectedInfrastructure(newInfrastructureList[existingIndex >= 0 ? existingIndex : 0]?.yaml)
    formik?.setFieldValue('infrastructureRef', values.identifier)
    hideInfrastructuresModal()
  }

  const [showInfrastructuresModal, hideInfrastructuresModal] = useModalHook(
    () => (
      <Dialog
        isOpen
        isCloseButtonShown
        canEscapeKeyClose
        canOutsideClickClose
        enforceFocus={false}
        onClose={hideInfrastructuresModal}
        title={
          isEditInfrastructure(selectedInfrastructure)
            ? getString('cd.infrastructure.edit')
            : getString('cd.infrastructure.createNew')
        }
        className={cx('padded-dialog', css.dialogStyles)}
      >
        <InfrastructureModal
          hideModal={hideInfrastructuresModal}
          refetch={updateInfrastructuresList}
          envIdentifier={environmentIdentifier}
          infrastructureToEdit={selectedInfrastructure}
          setInfrastructureToEdit={setSelectedInfrastructure}
        />
      </Dialog>
    ),
    [environmentIdentifier, selectedInfrastructure, setSelectedInfrastructure]
  )

  return (
    <Layout.Horizontal
      className={css.formRow}
      spacing="medium"
      flex={{ alignItems: 'flex-start', justifyContent: 'flex-start' }}
    >
      <FormInput.MultiTypeInput
        label={getString('cd.pipelineSteps.environmentTab.specifyYourInfrastructure')}
        tooltipProps={{ dataTooltipId: 'specifyYourInfrastructure' }}
        name={path ? `${path}.infrastructureDefinitions[0].identifier` : 'infrastructureRef'}
        useValue
        disabled={readonly || (infrastructureRefType === MultiTypeInputType.FIXED && infrastructuresLoading)}
        placeholder={
          infrastructuresLoading
            ? getString('loading')
            : getString('cd.pipelineSteps.environmentTab.selectInfrastructure')
        }
        multiTypeInputProps={{
          onTypeChange: setInfrastructureRefType,
          width: 280,
          onChange: item => {
            setSelectedInfrastructure(
              infrastructures?.filter(infra => infra.identifier === (item as SelectOption)?.value)?.[0]?.yaml
            )
          },
          selectProps: {
            addClearBtn: !readonly,
            items: defaultTo(infrastructuresSelectOptions, [])
          },
          expressions,
          allowableTypes
        }}
        selectItems={defaultTo(infrastructuresSelectOptions, [])}
      />
      {infrastructureInputsLoading && (
        <Container margin={{ top: 'xlarge' }}>
          <Spinner size={20} />
        </Container>
      )}
      {!path && infrastructureRefType === MultiTypeInputType.FIXED && (
        <RbacButton
          margin={{ top: 'xlarge' }}
          size={ButtonSize.SMALL}
          variation={ButtonVariation.LINK}
          disabled={readonly}
          onClick={showInfrastructuresModal}
          permission={{
            resource: {
              resourceType: ResourceType.ENVIRONMENT
            },
            permission: PermissionIdentifier.EDIT_ENVIRONMENT
          }}
          text={
            isEditInfrastructure(selectedInfrastructure)
              ? getString('common.editName', { name: getString('infrastructureText') })
              : getString('common.plusNewName', { name: getString('infrastructureText') })
          }
          id={isEditInfrastructure(selectedInfrastructure) ? 'edit-infrastructure' : 'add-new-infrastructure'}
        />
      )}
    </Layout.Horizontal>
  )
}

export default connect(DeployInfrastructures)
