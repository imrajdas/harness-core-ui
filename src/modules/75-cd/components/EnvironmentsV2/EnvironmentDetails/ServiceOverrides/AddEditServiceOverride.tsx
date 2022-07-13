/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { FormikProps } from 'formik'
import { defaultTo, get, isEmpty, isEqual } from 'lodash-es'
import { parse } from 'yaml'

import {
  Button,
  Formik,
  Layout,
  FormInput,
  ButtonVariation,
  SelectOption,
  Text,
  ButtonSize,
  Container,
  VisualYamlToggle,
  VisualYamlSelectedView as SelectedView,
  useToaster,
  getMultiTypeFromValue
} from '@harness/uicore'

import { useStrings } from 'framework/strings'
import {
  NGServiceConfig,
  NGServiceOverrideConfig,
  NGVariable,
  ResponsePageServiceOverrideResponseDTO,
  ResponsePageServiceResponse,
  ServiceOverrideResponseDTO,
  useUpsertServiceOverride
} from 'services/cd-ng'

import YAMLBuilder from '@common/components/YAMLBuilder/YamlBuilder'
import { yamlParse, yamlStringify } from '@common/utils/YamlHelperMethods'
import type { YamlBuilderHandlerBinding, YamlBuilderProps } from '@common/interfaces/YAMLBuilderProps'
import type { EnvironmentPathProps, PipelinePathProps } from '@common/interfaces/RouteInterfaces'

import useRBACError from '@rbac/utils/useRBACError/useRBACError'

import MultiTypeSecretInput from '@secrets/components/MutiTypeSecretInput/MultiTypeSecretInput'

import type { AllNGVariables } from '@pipeline/utils/types'

import { getVariableTypeOptions, VariableType } from './ServiceOverridesUtils'

export interface VariableState {
  variable: AllNGVariables
  serviceRef: string
}

interface VariableOverride {
  name?: string
  type?: 'String' | 'Number' | 'Secret'
  value?: string
}

interface AddEditServiceOverrideFormProps {
  serviceRef?: string
  environmentRef?: string
  variableOverride?: VariableOverride
  variables?: VariableOverride[]
}

export interface AddEditServiceOverrideProps {
  selectedVariable: VariableState | null
  services: ResponsePageServiceResponse | null
  serviceOverrides?: ResponsePageServiceOverrideResponseDTO | null
  closeModal: (updateServiceOverride?: boolean) => void
}

const yamlBuilderReadOnlyModeProps: YamlBuilderProps = {
  fileName: `serviceOverrides.yaml`,
  entityType: 'Service',
  width: '100%',
  height: 350,
  showSnippetSection: false,
  yamlSanityConfig: {
    removeEmptyString: false,
    removeEmptyObject: false,
    removeEmptyArray: false
  }
}

export default function AddEditServiceOverride({
  selectedVariable,
  services,
  closeModal,
  serviceOverrides
}: AddEditServiceOverrideProps): React.ReactElement {
  const { accountId, orgIdentifier, projectIdentifier, environmentIdentifier } = useParams<
    PipelinePathProps & EnvironmentPathProps
  >()
  const { getString } = useStrings()
  const { showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()

  const formikRef = useRef<FormikProps<AddEditServiceOverrideFormProps>>()

  const [selectedView, setSelectedView] = useState<SelectedView>(SelectedView.VISUAL)
  const [yamlHandler, setYamlHandler] = useState<YamlBuilderHandlerBinding | undefined>()
  const [isModified, setIsModified] = useState<boolean>(false)

  const [servicesOptions, setServicesOptions] = useState<SelectOption[]>([])
  const [serviceVariables, setServiceVariables] = useState<NGVariable[]>([])
  const [variablesOptions, setVariablesOptions] = useState<SelectOption[]>([])

  useEffect(() => {
    if (services) {
      if (selectedVariable?.serviceRef?.length) {
        const serviceToBeSelected = services?.data?.content?.filter(
          serviceObject => serviceObject.service?.identifier === selectedVariable.serviceRef
        )?.[0]

        const serviceAvailable = {
          label: defaultTo(serviceToBeSelected?.service?.name, ''),
          value: defaultTo(serviceToBeSelected?.service?.identifier, '')
        }

        setServicesOptions([serviceAvailable])
        formikRef.current?.setFieldValue('serviceRef', serviceAvailable.value)
        handleServiceChange(serviceAvailable, Boolean(selectedVariable.variable.value))
      } else {
        setServicesOptions(
          defaultTo(
            services.data?.content?.map(item => {
              try {
                return {
                  label: defaultTo(item.service?.name, ''),
                  value: defaultTo(item.service?.identifier, '')
                }
              } catch (e: any) {
                return {
                  label: defaultTo(item?.service?.name, ''),
                  value: ''
                }
              }
            }),
            []
          )
        )
      }
    }
  }, [selectedVariable?.serviceRef])

  const handleServiceChange = (item: SelectOption, isEdit: boolean) => {
    const serviceSelected = services?.data?.content?.find(serviceObj => serviceObj.service?.identifier === item.value)

    if (serviceSelected) {
      const parsedServiceYaml = defaultTo(
        yamlParse(defaultTo(serviceSelected?.service?.yaml, '{}')),
        ''
      ) as NGServiceConfig
      const serviceVars = defaultTo(parsedServiceYaml?.service?.serviceDefinition?.spec?.variables, [])
      setServiceVariables(serviceVars)
      if (isEdit) {
        setVariablesOptions([
          {
            label: defaultTo(selectedVariable?.variable?.name, ''),
            value: defaultTo(selectedVariable?.variable?.name, '')
          }
        ])
      } else {
        setVariablesOptions(
          defaultTo(
            serviceVars?.map(variable => ({
              label: defaultTo(variable.name, ''),
              value: defaultTo(variable.name, '')
            })),
            []
          )
        )
      }
    }
  }

  const handleVariableChange = (item: SelectOption) => {
    const variableSelected = serviceVariables?.find(serviceVariable => serviceVariable.name === item.value)
    if (variableSelected) {
      formikRef.current?.setFieldValue('variableOverride', {
        name: variableSelected?.name,
        value: (variableSelected as AllNGVariables)?.value,
        type: variableSelected?.type
      })
    } else {
      formikRef.current?.setFieldValue('variableOverride', {
        name: item.value,
        value: item.value,
        type: 'String'
      })
      setServiceVariables([
        ...serviceVariables,
        {
          name: item.label,
          value: item.value,
          type: 'String'
        } as NGVariable
      ])
      setVariablesOptions([...variablesOptions, { label: item.label, value: item.value }])
    }
  }

  const validate = (values: AddEditServiceOverrideFormProps) => {
    const { name, type, value } = defaultTo(formikRef.current?.values.variableOverride, {})
    const { variableOverride: { name: newName, type: newType, value: newValue } = {} } = values

    if ((name === newName && type === newType && value === newValue) || isEmpty(newName) || isEmpty(newValue)) {
      setIsModified(false)
    } else {
      setIsModified(true)
    }
  }

  const handleModeSwitch = useCallback(
    /* istanbul ignore next */ (view: SelectedView) => {
      if (view === SelectedView.VISUAL) {
        const yaml = defaultTo(yamlHandler?.getLatestYaml(), '{}')
        const yamlVisual = (parse(yaml) as NGServiceOverrideConfig).serviceOverrides

        if (yamlVisual) {
          formikRef.current?.setValues({
            ...yamlVisual,
            variables: null,
            variableOverride: yamlVisual.variables?.[defaultTo(yamlVisual.variables?.length, 1) - 1]
          } as any)
        }
      } else {
        if (!formikRef.current?.values?.serviceRef) {
          showError('Please select a service first')
          return
        }
      }

      setSelectedView(view)
    },
    [yamlHandler?.getLatestYaml]
  )

  const formVariableOverrideObject = (serviceOverride?: ServiceOverrideResponseDTO, variableOverride?: NGVariable) => {
    const parsedYaml = parse(defaultTo(serviceOverride?.yaml, '{}')) as NGServiceOverrideConfig
    const otherVariables = defaultTo(
      parsedYaml.serviceOverrides?.variables
        ?.map(override => ({ name: get(override, 'name'), type: get(override, 'type'), value: get(override, 'value') }))

        ?.filter(override => {
          return override.name !== variableOverride?.name
        }),
      []
    )

    return [...otherVariables, variableOverride]
  }

  const { mutate: upsertServiceOverride, loading: upsertServiceOverrideLoading } = useUpsertServiceOverride({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const onSubmit = async (values: AddEditServiceOverrideFormProps) => {
    try {
      const response = await upsertServiceOverride({
        environmentRef: environmentIdentifier,
        serviceRef: values.serviceRef,
        orgIdentifier,
        projectIdentifier,
        yaml: yamlStringify({
          serviceOverrides: {
            environmentRef: environmentIdentifier,
            serviceRef: values.serviceRef,
            variables:
              values.variables ||
              formVariableOverrideObject(
                serviceOverrides?.data?.content?.filter(
                  serviceOverride => serviceOverride.serviceRef === values.serviceRef
                )?.[0],
                values.variableOverride
              )
          }
        } as NGServiceOverrideConfig)
      })

      if (response.status === 'SUCCESS') {
        closeModal(true)
      } else {
        throw response
      }
    } catch (e: any) {
      showError(getRBACErrorMessage(e))
    }
  }

  const existingJSON = useMemo(() => {
    return {
      serviceOverrides: {
        environmentRef: environmentIdentifier,
        serviceRef: formikRef.current?.values.serviceRef,
        variables: formVariableOverrideObject(
          serviceOverrides?.data?.content?.filter(
            serviceOverride => serviceOverride.serviceRef === formikRef.current?.values.serviceRef
          )?.[0],
          formikRef.current?.values.variableOverride
        )
      }
    }
  }, [formikRef.current, environmentIdentifier, serviceOverrides?.data?.content])

  const handleYamlChange = useCallback((): void => {
    const parsedYaml = parse(defaultTo(yamlHandler?.getLatestYaml(), '{}'))
    const anyVariableEmpty = parsedYaml.serviceOverrides.variables?.find(
      (serviceVariable: any) => isEmpty(serviceVariable.name) || isEmpty(serviceVariable.value)
    )
    if (isEqual(existingJSON, parsedYaml) || anyVariableEmpty) {
      setIsModified(false)
    } else {
      setIsModified(true)
    }
  }, [yamlHandler])

  return (
    <Formik<AddEditServiceOverrideFormProps>
      formName={'addEditServiceOverrideForm'}
      initialValues={{
        serviceRef: selectedVariable?.serviceRef,
        environmentRef: environmentIdentifier,
        variableOverride: {
          name: selectedVariable?.variable.name,
          type: selectedVariable?.variable.type,
          value: selectedVariable?.variable.value as string
        }
      }}
      onSubmit={
        /* istanbul ignore next */ values => {
          onSubmit?.({
            ...values
          })
        }
      }
      validate={validate}
    >
      {formikProps => {
        formikRef.current = formikProps
        return (
          <Container margin={{ left: 'small', right: 'small' }}>
            <Layout.Horizontal
              flex={{ justifyContent: 'flex-start' }}
              padding={{ top: 'medium', bottom: 'medium' }}
              width={'320px'}
            >
              <VisualYamlToggle
                selectedView={selectedView}
                onChange={nextMode => {
                  handleModeSwitch(nextMode)
                }}
              />
            </Layout.Horizontal>
            {selectedView === SelectedView.VISUAL ? (
              <Container>
                <FormInput.Select
                  name="serviceRef"
                  items={servicesOptions}
                  label={getString('service')}
                  placeholder={getString('common.selectName', { name: getString('service') })}
                  onChange={item => handleServiceChange(item, false)}
                />
                <Text>{getString('cd.overrideType')}</Text>
                <Button
                  disabled
                  size={ButtonSize.SMALL}
                  variation={ButtonVariation.SECONDARY}
                  margin={{ top: 'small', bottom: 'medium' }}
                >
                  {getString('variableLabel')}
                </Button>
                <FormInput.Select
                  name="variableOverride.name"
                  selectProps={{
                    allowCreatingNewItems: true
                  }}
                  items={variablesOptions}
                  label={getString('variableNameLabel')}
                  placeholder={getString('common.selectName', { name: getString('variableLabel') })}
                  onChange={handleVariableChange}
                />
                <FormInput.Select
                  name="variableOverride.type"
                  items={getVariableTypeOptions(getString)}
                  label={getString('typeLabel')}
                  placeholder={getString('common.selectName', { name: getString('service') })}
                />
                {formikProps.values.variableOverride?.type === VariableType.Secret ? (
                  <MultiTypeSecretInput
                    name={`variableOverride.value`}
                    label={getString('cd.overrideValue')}
                    isMultiType
                  />
                ) : (
                  <FormInput.MultiTextInput
                    className="variableInput"
                    name={`variableOverride.value`}
                    label={getString('cd.overrideValue')}
                    multiTextInputProps={{
                      defaultValueToReset: '',
                      textProps: {
                        type: formikProps.values.variableOverride?.type === VariableType.Number ? 'number' : 'text'
                      },
                      multitypeInputValue: getMultiTypeFromValue(formikProps.values.variableOverride?.value)
                    }}
                  />
                )}
              </Container>
            ) : (
              <YAMLBuilder
                {...yamlBuilderReadOnlyModeProps}
                existingJSON={existingJSON}
                bind={setYamlHandler}
                showSnippetSection={false}
                onChange={handleYamlChange}
              />
            )}

            <Layout.Horizontal spacing="medium" padding={{ top: 'medium' }}>
              <Button
                variation={ButtonVariation.PRIMARY}
                text={getString('save')}
                onClick={
                  /* istanbul ignore next */ () => {
                    if (selectedView === SelectedView.YAML) {
                      const latestYaml = defaultTo(yamlHandler?.getLatestYaml(), /* istanbul ignore next */ '')
                      onSubmit(parse(latestYaml)?.serviceOverrides)
                    } else {
                      formikProps.submitForm()
                    }
                  }
                }
                data-testid="addVariableSave"
                disabled={!isModified || upsertServiceOverrideLoading}
              />
              <Button
                variation={ButtonVariation.TERTIARY}
                text={getString('cancel')}
                onClick={() => closeModal()}
                data-testid="addVariableCancel"
                disabled={upsertServiceOverrideLoading}
              />
            </Layout.Horizontal>
          </Container>
        )
      }}
    </Formik>
  )
}
