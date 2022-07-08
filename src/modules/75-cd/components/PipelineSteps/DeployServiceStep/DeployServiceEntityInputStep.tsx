/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  ButtonSize,
  ButtonVariation,
  Dialog,
  getMultiTypeFromValue,
  Layout,
  MultiTypeInputType,
  useToaster
} from '@harness/uicore'
import { defaultTo, get, isEmpty } from 'lodash-es'
import type { FormikContextType, FormikValues } from 'formik'
import { connect } from 'formik'
import { useModalHook } from '@harness/use-modal'
import type { IDialogProps } from '@blueprintjs/core'
import { useStrings } from 'framework/strings'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import {
  ServiceDefinition,
  ServiceResponseDTO,
  ServiceYaml,
  useGetRuntimeInputsServiceEntity,
  useGetServiceAccessList,
  useGetServiceV2
} from 'services/cd-ng'
import type { PipelineType } from '@common/interfaces/RouteInterfaces'
import { yamlParse } from '@common/utils/YamlHelperMethods'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import RbacButton from '@rbac/components/Button/Button'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { useRunPipelineFormContext } from '@pipeline/context/RunPipelineFormContext'
import type { ServiceInputsConfig } from '@pipeline/utils/DeployStageInterface'
import ServiceEntityEditModal from '@cd/components/Services/ServiceEntityEditModal/ServiceEntityEditModal'
import { clearRuntimeInput } from '@pipeline/utils/runPipelineUtils'
import ExperimentalInput from '../K8sServiceSpec/K8sServiceSpecForms/ExperimentalInput'
import { isEditService } from './DeployServiceUtils'
import type { DeployServiceProps } from './DeployServiceInterface'
import css from './DeployServiceStep.module.scss'

function DeployServiceEntityInputStep({
  initialValues,
  inputSetData,
  formik,
  allowableTypes,
  customStepProps
}: DeployServiceProps & { formik?: FormikContextType<unknown> }): React.ReactElement | null {
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const { showError, clear } = useToaster()
  const { getRBACErrorMessage } = useRBACError()
  const { template: getTemplate, updateTemplate } = useRunPipelineFormContext()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<
    PipelineType<{
      orgIdentifier: string
      projectIdentifier: string
      pipelineIdentifier: string
      accountId: string
    }>
  >()

  const queryParams = useMemo(
    () => ({
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    }),
    [accountId, orgIdentifier, projectIdentifier]
  )
  const {
    data: serviceResponse,
    error,
    loading: serviceListLoading,
    refetch: refetchServiceList
  } = useGetServiceAccessList({
    queryParams: {
      ...queryParams,
      type: customStepProps?.deploymentType as ServiceDefinition['type'],
      gitOpsEnabled: defaultTo(customStepProps?.gitOpsEnabled, false)
    }
  })

  const { data: serviceInputsResponse, refetch: refetchServiceInputs } = useGetRuntimeInputsServiceEntity({
    serviceIdentifier: '',
    queryParams,
    lazy: true
  })

  const {
    data: selectedServiceResponse,
    refetch: refetchServiceData,
    loading: serviceDataLoading
  } = useGetServiceV2({
    serviceIdentifier: '',
    queryParams,
    lazy: true
  })

  const services = serviceResponse?.data?.map(service => ({
    label: service.service?.name || '',
    value: service.service?.identifier || ''
  }))

  useEffect(() => {
    if (initialValues.serviceRef && inputSetData?.path) {
      const serviceInputsTemplate = getTemplate(`${inputSetData?.path}.serviceInputs`)
      const serviceInputsFormikValue = get(formik?.values, `${inputSetData?.path}.serviceInputs`)
      if (
        typeof serviceInputsTemplate === 'string' &&
        getMultiTypeFromValue(serviceInputsTemplate) === MultiTypeInputType.RUNTIME &&
        !isEmpty(serviceInputsFormikValue)
      ) {
        refetchServiceInputs({
          pathParams: {
            serviceIdentifier: initialValues.serviceRef
          },
          queryParams
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (serviceInputsResponse?.data) {
      const serviceInputsData = serviceInputsResponse?.data?.inputSetTemplateYaml
      if (serviceInputsData) {
        const serviceInputSetResponse = yamlParse<ServiceInputsConfig>(defaultTo(serviceInputsData, ''))
        if (serviceInputSetResponse) {
          updateTemplate(serviceInputSetResponse?.serviceInputs, `${inputSetData?.path}.serviceInputs`)

          const serviceInputsFormikValue = get(formik?.values, `${inputSetData?.path}.serviceInputs`)
          if (isEmpty(serviceInputsFormikValue)) {
            formik?.setFieldValue(
              `${inputSetData?.path}.serviceInputs`,
              clearRuntimeInput(serviceInputSetResponse?.serviceInputs)
            )
          }
        }
      } else {
        updateTemplate({}, `${inputSetData?.path}.serviceInputs`)
        formik?.setFieldValue(`${inputSetData?.path}`, { serviceRef: initialValues.serviceRef })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceInputsResponse?.data])

  const onServiceEntityUpdate = (newServiceInfo: ServiceYaml): void => {
    refetchServiceList()
    formik?.setFieldValue(
      `${isEmpty(inputSetData?.path) ? '' : `${inputSetData?.path}.`}serviceRef`,
      newServiceInfo.identifier
    )
    hideModal()
  }

  const editService = (values: FormikValues): void => {
    refetchServiceData({
      pathParams: {
        serviceIdentifier: values.serviceRef
      },
      queryParams
    })
    showModal()
  }

  const DIALOG_PROPS: IDialogProps = {
    isOpen: true,
    usePortal: true,
    autoFocus: true,
    canEscapeKeyClose: false,
    canOutsideClickClose: false,
    enforceFocus: false,
    className: css.editServiceDialog,
    style: { width: 1114 }
  }

  const [showModal, hideModal] = useModalHook(
    () => (
      <Dialog onClose={onClose} title={getString('editService')} {...DIALOG_PROPS}>
        <ServiceEntityEditModal
          serviceResponse={selectedServiceResponse?.data?.service as ServiceResponseDTO}
          isLoading={serviceDataLoading}
          onCloseModal={hideModal}
          onServiceCreate={onServiceEntityUpdate}
          isServiceCreateModalView={false}
        />
      </Dialog>
    ),
    [selectedServiceResponse, serviceDataLoading]
  )
  const onClose = useCallback(() => {
    hideModal()
  }, [hideModal])

  if (!services?.length) {
    return null
  }
  if (error?.message) {
    clear()
    showError(getRBACErrorMessage(error), undefined, 'cd.svc.list.error')
  }

  return (
    <>
      {getMultiTypeFromValue(inputSetData?.template?.serviceRef) === MultiTypeInputType.RUNTIME && (
        <Layout.Horizontal spacing="medium" style={{ alignItems: 'center' }}>
          <ExperimentalInput
            tooltipProps={{ dataTooltipId: 'specifyYourService' }}
            label={getString('cd.pipelineSteps.serviceTab.specifyYourService')}
            name={`${isEmpty(inputSetData?.path) ? '' : `${inputSetData?.path}.`}serviceRef`}
            placeholder={getString('cd.pipelineSteps.serviceTab.selectService')}
            selectItems={services}
            useValue
            multiTypeInputProps={{
              expressions,
              allowableTypes: allowableTypes,
              selectProps: {
                addClearBtn: true && !inputSetData?.readonly,
                items: services
              },
              onChange: (value: any) => {
                if (isEmpty(value?.value)) {
                  formik?.setFieldValue(
                    `${isEmpty(inputSetData?.path) ? '' : `${inputSetData?.path}.`}serviceInputs`,
                    {}
                  )
                  updateTemplate({}, `${inputSetData?.path}.serviceInputs`)
                } else {
                  refetchServiceInputs({
                    pathParams: {
                      serviceIdentifier: value.value
                    },
                    queryParams
                  })
                }
              }
            }}
            disabled={inputSetData?.readonly}
            className={css.inputWidth}
            formik={formik}
          />
          {getMultiTypeFromValue(initialValues.serviceRef) === MultiTypeInputType.FIXED && (
            <>
              {isEditService(initialValues) && !serviceListLoading && (
                <RbacButton
                  size={ButtonSize.SMALL}
                  text={getString('editService')}
                  variation={ButtonVariation.LINK}
                  id="edit-service"
                  disabled={inputSetData?.readonly}
                  permission={{
                    permission: PermissionIdentifier.EDIT_SERVICE,
                    resource: {
                      resourceType: ResourceType.SERVICE,
                      resourceIdentifier: services[0]?.value as string
                    },
                    options: {
                      skipCondition: ({ resourceIdentifier }) => !resourceIdentifier
                    }
                  }}
                  onClick={() => editService(initialValues)}
                />
              )}
            </>
          )}
        </Layout.Horizontal>
      )}
    </>
  )
}

export const DeployServiceEntityInputStepFormik = connect(DeployServiceEntityInputStep)
