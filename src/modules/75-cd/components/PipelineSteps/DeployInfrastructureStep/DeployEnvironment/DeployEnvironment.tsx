/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { defaultTo, get, isEmpty, isNil, set } from 'lodash-es'
import { parse } from 'yaml'
import { connect, FormikProps } from 'formik'
import { Spinner } from '@blueprintjs/core'
import produce from 'immer'

import {
  ButtonSize,
  ButtonVariation,
  Container,
  Dialog,
  FormInput,
  getMultiTypeFromValue,
  Layout,
  MultiTypeInputType,
  RUNTIME_INPUT_VALUE,
  SelectOption,
  useToaster
} from '@harness/uicore'
import { useModalHook } from '@harness/use-modal'

import { useStrings } from 'framework/strings'
import {
  EnvironmentResponse,
  EnvironmentResponseDTO,
  EnvironmentYamlV2,
  useGetEnvironmentInputs,
  useGetEnvironmentListV2,
  useGetServiceOverrideInputs
} from 'services/cd-ng'

import type { PipelinePathProps } from '@common/interfaces/RouteInterfaces'

import RbacButton from '@rbac/components/Button/Button'

import { useMutateAsGet } from '@common/hooks'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'

import type { DeployStageConfig } from '@pipeline/utils/DeployStageInterface'
import { clearRuntimeInput } from '@pipeline/utils/runPipelineUtils'
import { useRunPipelineFormContext } from '@pipeline/context/RunPipelineFormContext'
import AddEditEnvironmentModal from '../AddEditEnvironmentModal'
import { isEditEnvironment } from '../utils'

import css from '../DeployInfrastructureStep.module.scss'

interface DeployEnvironmentProps {
  initialValues: DeployStageConfig
  formik?: FormikProps<DeployStageConfig>
  readonly?: boolean
  allowableTypes: MultiTypeInputType[]
  serviceRef?: string
  path?: string
}

function DeployEnvironment({
  initialValues,
  readonly,
  formik,
  allowableTypes,
  serviceRef,
  path
}: DeployEnvironmentProps) {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<PipelinePathProps>()
  const { getString } = useStrings()
  const { showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()

  const {
    data: environmentsResponse,
    loading: environmentsLoading,
    error: environmentsError
  } = useMutateAsGet(useGetEnvironmentListV2, {
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    },
    body: {
      filterType: 'Environment'
    }
  })

  const {
    data: environmentInputsResponse,
    loading: environmentInputsLoading,
    refetch: refetchEnvironmentInputs
  } = useGetEnvironmentInputs({
    lazy: true
  })

  const {
    data: serviceOverrideInputsResponse,
    loading: serviceOverrideInputsLoading,
    refetch: refetchServiceOverrideInputs
  } = useGetServiceOverrideInputs({
    lazy: true
  })

  const [environments, setEnvironments] = useState<EnvironmentResponseDTO[]>()
  const [selectedEnvironment, setSelectedEnvironment] = useState<EnvironmentResponseDTO>()
  const [environmentsSelectOptions, setEnvironmentsSelectOptions] = useState<SelectOption[]>()
  const [environmentRefType, setEnvironmentRefType] = useState<MultiTypeInputType>(
    getMultiTypeFromValue(initialValues.environment?.environmentRef)
  )
  const { template: getTemplate, updateTemplate } = useRunPipelineFormContext()

  useEffect(() => {
    if (
      !environmentInputsLoading &&
      !serviceOverrideInputsLoading &&
      (environmentInputsResponse?.data?.inputSetTemplateYaml ||
        serviceOverrideInputsResponse?.data?.inputSetTemplateYaml)
    ) {
      const parsedEnvironmentYaml = parse(defaultTo(environmentInputsResponse?.data?.inputSetTemplateYaml, '{}'))
      const parsedServiceOverridesYaml = parse(
        defaultTo(serviceOverrideInputsResponse?.data?.inputSetTemplateYaml, '{}')
      )

      if (path) {
        const values = { ...formik?.values }
        set(
          values,
          `${path}.environmentInputs`,
          parsedEnvironmentYaml.environmentInputs
            ? {
                ...clearRuntimeInput(parsedEnvironmentYaml.environmentInputs)
              }
            : undefined
        )
        set(
          values,
          `${path}.serviceOverrideInputs`,
          parsedServiceOverridesYaml.serviceOverrideInputs
            ? {
                ...clearRuntimeInput(parsedServiceOverridesYaml.serviceOverrideInputs)
              }
            : undefined
        )
        formik?.setValues({ ...values })

        updateTemplate(
          {
            environmentRef: RUNTIME_INPUT_VALUE,
            ...(parsedEnvironmentYaml?.environmentInputs && {
              environmentInputs: parsedEnvironmentYaml?.environmentInputs
            }),
            ...(parsedServiceOverridesYaml?.serviceOverrideInputs && {
              serviceOverrideInputs: parsedServiceOverridesYaml?.serviceOverrideInputs
            })
          },
          path
        )
      } else {
        formik?.setValues({
          ...formik.values,
          environment: {
            ...formik.values.environment,
            ...parsedEnvironmentYaml,
            ...parsedServiceOverridesYaml
          }
        } as DeployStageConfig)
      }
    } else if (
      !environmentInputsLoading &&
      !serviceOverrideInputsLoading &&
      !environmentInputsResponse?.data?.inputSetTemplateYaml &&
      !serviceOverrideInputsResponse?.data?.inputSetTemplateYaml &&
      path
    ) {
      const updatedTemplate = produce(getTemplate(path), (draft: EnvironmentYamlV2) => {
        if (draft) {
          delete draft.environmentInputs
          delete draft.serviceOverrideInputs
        }
      })
      const environmentValues = get(formik?.values, `${path}`)
      if (environmentValues) {
        delete environmentValues.environmentInputs
        delete environmentValues.serviceOverrideInputs
        formik?.setFieldValue(path, {
          ...environmentValues
        })
        updateTemplate(updatedTemplate, path)
      }
    }
  }, [environmentInputsLoading, serviceOverrideInputsLoading])

  useEffect(() => {
    if (selectedEnvironment?.identifier) {
      const queryParams = {
        accountIdentifier: accountId,
        orgIdentifier,
        projectIdentifier,
        environmentIdentifier: selectedEnvironment?.identifier
      }
      refetchEnvironmentInputs({
        queryParams
      })
      if (!isNil(serviceRef) && !isEmpty(serviceRef)) {
        refetchServiceOverrideInputs({
          queryParams: {
            ...queryParams,
            serviceIdentifier: serviceRef
          }
        })
      }
    }
  }, [selectedEnvironment])

  useEffect(() => {
    if (!environmentsLoading && !get(environmentsResponse, 'data.empty')) {
      setEnvironments(
        defaultTo(
          get(environmentsResponse, 'data.content', [])?.map((environmentObj: EnvironmentResponse) => ({
            ...environmentObj.environment
          })),
          []
        )
      )
    }
  }, [environmentsLoading, environmentsResponse])

  useEffect(() => {
    if (!isNil(environments)) {
      setEnvironmentsSelectOptions(
        environments.map(environment => {
          return { label: defaultTo(environment.name, ''), value: defaultTo(environment.identifier, '') }
        })
      )
    }
  }, [environments])

  useEffect(() => {
    if (
      !isEmpty(environmentsSelectOptions) &&
      !isNil(environmentsSelectOptions) &&
      initialValues.environment?.environmentRef
    ) {
      if (getMultiTypeFromValue(initialValues.environment?.environmentRef) === MultiTypeInputType.FIXED) {
        const existingEnvironment = environmentsSelectOptions.find(
          env => env.value === initialValues.environment?.environmentRef
        )
        if (!existingEnvironment) {
          if (!readonly) {
            formik?.setFieldValue('environment.environmentRef', '')
          } else {
            const options = [...environmentsSelectOptions]
            options.push({
              label: initialValues.environment.environmentRef,
              value: initialValues.environment.environmentRef
            })
            setEnvironmentsSelectOptions(options)
          }
        } else {
          formik?.setFieldValue('environment.environmentRef', existingEnvironment?.value)
          setSelectedEnvironment(
            environments?.find(environment => environment.identifier === existingEnvironment?.value)
          )
        }
      }
    }
  }, [environmentsSelectOptions])

  useEffect(() => {
    if (!isNil(environmentsError)) {
      showError(getRBACErrorMessage(environmentsError))
    }
  }, [environmentsError])

  const updateEnvironmentsList = (values: EnvironmentResponseDTO) => {
    const newEnvironmentsList = [...defaultTo(environments, [])]
    const existingIndex = newEnvironmentsList.findIndex(item => item.identifier === values.identifier)
    if (existingIndex >= 0) {
      newEnvironmentsList.splice(existingIndex, 1, values)
    } else {
      newEnvironmentsList.unshift(values)
    }
    setEnvironments(newEnvironmentsList)
    setSelectedEnvironment(newEnvironmentsList?.find(environment => environment.identifier === values?.identifier))
    formik?.setFieldValue('environment.environmentRef', values.identifier)
    hideEnvironmentModal()
  }

  const [showEnvironmentModal, hideEnvironmentModal] = useModalHook(() => {
    const environmentValues = parse(defaultTo(selectedEnvironment?.yaml, '{}'))
    return (
      <Dialog
        isOpen={true}
        enforceFocus={false}
        onClose={hideEnvironmentModal}
        title={isEditEnvironment(selectedEnvironment) ? getString('editEnvironment') : getString('newEnvironment')}
        className={css.dialogStyles}
      >
        <AddEditEnvironmentModal
          data={{
            ...environmentValues
          }}
          onCreateOrUpdate={updateEnvironmentsList}
          closeModal={hideEnvironmentModal}
          isEdit={Boolean(selectedEnvironment)}
        />
      </Dialog>
    )
  }, [environments, updateEnvironmentsList])

  return (
    <Layout.Horizontal
      className={css.formRow}
      spacing="medium"
      flex={{ alignItems: 'flex-start', justifyContent: 'flex-start' }}
    >
      <FormInput.MultiTypeInput
        label={getString('cd.pipelineSteps.environmentTab.specifyYourEnvironment')}
        tooltipProps={{ dataTooltipId: 'specifyYourEnvironment' }}
        name={path ? `${path}.environmentRef` : 'environment.environmentRef'}
        useValue
        disabled={readonly || (environmentRefType === MultiTypeInputType.FIXED && environmentsLoading)}
        placeholder={
          environmentsLoading ? getString('loading') : getString('cd.pipelineSteps.environmentTab.selectEnvironment')
        }
        multiTypeInputProps={{
          onTypeChange: setEnvironmentRefType,
          width: 280,
          onChange: item => {
            setSelectedEnvironment(
              environments?.find(environment => environment.identifier === (item as SelectOption)?.value)
            )
          },
          selectProps: {
            addClearBtn: !readonly,
            items: defaultTo(environmentsSelectOptions, [])
          },
          allowableTypes
        }}
        selectItems={defaultTo(environmentsSelectOptions, [])}
      />
      {(environmentInputsLoading || serviceOverrideInputsLoading) && (
        <Container margin={{ top: 'xlarge' }}>
          <Spinner size={20} />
        </Container>
      )}
      {!path && environmentRefType === MultiTypeInputType.FIXED && (
        <RbacButton
          margin={{ top: 'xlarge' }}
          size={ButtonSize.SMALL}
          variation={ButtonVariation.LINK}
          disabled={readonly}
          onClick={showEnvironmentModal}
          permission={{
            resource: {
              resourceType: ResourceType.ENVIRONMENT
            },
            permission: PermissionIdentifier.EDIT_ENVIRONMENT
          }}
          text={
            isEditEnvironment(selectedEnvironment)
              ? getString('common.editName', { name: getString('environment') })
              : getString('common.plusNewName', { name: getString('environment') })
          }
          id={isEditEnvironment(selectedEnvironment) ? 'edit-environment' : 'add-new-environment'}
        />
      )}
    </Layout.Horizontal>
  )
}

export default connect(DeployEnvironment)
