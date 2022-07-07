/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import {
  Accordion,
  Layout,
  Button,
  FormInput,
  Formik,
  StepProps,
  getMultiTypeFromValue,
  MultiTypeInputType,
  Text,
  ButtonVariation,
  getErrorInfoFromErrorObject
} from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import { FontVariation } from '@harness/design-system'
import { Form } from 'formik'
import * as Yup from 'yup'
import cx from 'classnames'
import { get, isEmpty } from 'lodash-es'
import { v4 as nameSpace, v5 as uuid } from 'uuid'
import { useStrings } from 'framework/strings'
import { ConnectorConfigDTO, ManifestConfig, ManifestConfigWrapper, useGetGCSBucketList } from 'services/cd-ng'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import type { AccountPathProps, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useToaster } from '@common/components'

import type { HelmWithGcsDataType } from '../../ManifestInterface'
import HelmAdvancedStepSection from '../HelmAdvancedStepSection'

import { helmVersions, ManifestDataType, ManifestIdentifierValidation } from '../../Manifesthelper'
import { handleCommandFlagsSubmitData } from '../ManifestUtils'
import DragnDropPaths from '../../DragnDropPaths'
import css from '../ManifestWizardSteps.module.scss'
import helmcss from '../HelmWithGIT/HelmWithGIT.module.scss'

interface HelmWithGcsPropType {
  stepName: string
  expressions: string[]
  allowableTypes: MultiTypeInputType[]
  initialValues: ManifestConfig
  handleSubmit: (data: ManifestConfigWrapper) => void
  manifestIdsList: Array<string>
  isReadonly?: boolean
  deploymentType?: string
}

function HelmWithGcs({
  stepName,
  prevStepData,
  expressions,
  allowableTypes,
  initialValues,
  handleSubmit,
  previousStep,
  manifestIdsList,
  isReadonly = false,
  deploymentType
}: StepProps<ConnectorConfigDTO> & HelmWithGcsPropType): React.ReactElement {
  const { getString } = useStrings()
  const { showError } = useToaster()
  const isActiveAdvancedStep: boolean = initialValues?.spec?.skipResourceVersioning || initialValues?.spec?.commandFlags
  const [selectedHelmVersion, setHelmVersion] = useState(initialValues?.spec?.helmVersion ?? 'V2')
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps & AccountPathProps>()

  const {
    data: bucketData,
    error,
    loading,
    refetch: refetchBuckets
  } = useGetGCSBucketList({
    lazy: true,
    debounce: 300
  })

  const bucketOptions = Object.keys(bucketData?.data || {}).map(item => ({
    label: item,
    value: item
  }))

  const onBucketNameFocus = (): void => {
    if (!bucketData?.data) {
      refetchBuckets({
        queryParams: {
          accountIdentifier: accountId,
          projectIdentifier,
          orgIdentifier,
          connectorRef: prevStepData?.connectorRef?.value
        }
      })
    }
  }

  const getInitialValues = (): HelmWithGcsDataType => {
    const specValues = get(initialValues, 'spec.store.spec', null)

    if (specValues) {
      return {
        ...specValues,
        identifier: initialValues.identifier,
        helmVersion: initialValues.spec?.helmVersion,
        chartVersion: initialValues.spec?.chartVersion,
        chartName: initialValues.spec?.chartName,
        skipResourceVersioning: initialValues?.spec?.skipResourceVersioning,
        valuesPaths:
          typeof initialValues?.spec?.valuesPaths === 'string'
            ? initialValues?.spec?.valuesPaths
            : initialValues?.spec?.valuesPaths?.map((path: string) => ({ path, uuid: uuid(path, nameSpace()) })),
        commandFlags: initialValues.spec?.commandFlags?.map((commandFlag: { commandType: string; flag: string }) => ({
          commandType: commandFlag.commandType,
          flag: commandFlag.flag
          // id: uuid(commandFlag, nameSpace())
        })) || [{ commandType: undefined, flag: undefined, id: uuid('', nameSpace()) }]
      }
    }
    return {
      identifier: '',
      helmVersion: 'V2',
      chartName: '',
      chartVersion: '',
      skipResourceVersioning: false,
      bucketName: '',
      folderPath: '',
      commandFlags: [{ commandType: undefined, flag: undefined, id: uuid('', nameSpace()) }]
    }
  }
  const submitFormData = (formData: HelmWithGcsDataType & { store?: string; connectorRef?: string }): void => {
    const manifestObj: ManifestConfigWrapper = {
      manifest: {
        identifier: formData.identifier,
        type: ManifestDataType.HelmChart,
        spec: {
          store: {
            type: formData?.store,
            spec: {
              connectorRef: formData?.connectorRef,
              bucketName: formData?.bucketName,
              folderPath: formData?.folderPath
            }
          },
          valuesPaths:
            typeof formData?.valuesPaths === 'string'
              ? formData?.valuesPaths
              : formData?.valuesPaths?.map((path: { path: string }) => path.path),
          chartName: formData?.chartName,
          chartVersion: formData?.chartVersion,
          helmVersion: formData?.helmVersion,
          skipResourceVersioning: formData?.skipResourceVersioning
        }
      }
    }

    handleCommandFlagsSubmitData(manifestObj, formData)
    handleSubmit(manifestObj)
  }
  return (
    <Layout.Vertical spacing="xxlarge" padding="small" className={css.manifestStore}>
      {error && showError(getErrorInfoFromErrorObject(error as any))}
      <Text font={{ variation: FontVariation.H3 }} margin={{ bottom: 'medium' }}>
        {stepName}
      </Text>
      <Formik
        initialValues={getInitialValues()}
        formName="helmWithGcs"
        validationSchema={Yup.object().shape({
          ...ManifestIdentifierValidation(manifestIdsList, initialValues?.identifier, getString('pipeline.uniqueName')),
          chartName: Yup.string().trim().required(getString('pipeline.manifestType.http.chartNameRequired')),
          helmVersion: Yup.string().trim().required(getString('pipeline.manifestType.helmVersionRequired')),
          bucketName: Yup.mixed().required(getString('pipeline.manifestType.bucketNameRequired')),
          valuesPaths: Yup.lazy((value): Yup.Schema<unknown> => {
            if (getMultiTypeFromValue(value as any) === MultiTypeInputType.FIXED) {
              return Yup.array().of(
                Yup.object().shape({
                  path: Yup.string().min(1).required(getString('pipeline.manifestType.pathRequired'))
                })
              )
            }
            return Yup.string().required(getString('pipeline.manifestType.pathRequired'))
          }),
          commandFlags: Yup.array().of(
            Yup.object().shape({
              flag: Yup.string().when('commandType', {
                is: val => !isEmpty(val?.value),
                then: Yup.string().required(getString('pipeline.manifestType.commandFlagRequired'))
              })
            })
          )
        })}
        onSubmit={formData => {
          submitFormData({
            ...prevStepData,
            ...formData,
            connectorRef: prevStepData?.connectorRef
              ? getMultiTypeFromValue(prevStepData?.connectorRef) !== MultiTypeInputType.FIXED
                ? prevStepData?.connectorRef
                : prevStepData?.connectorRef?.value
              : prevStepData?.identifier
              ? prevStepData?.identifier
              : ''
          })
        }}
      >
        {(formik: { setFieldValue: (a: string, b: string) => void; values: HelmWithGcsDataType }) => (
          <Form>
            <div className={helmcss.helmGitForm}>
              <Layout.Horizontal flex spacing="huge">
                <div className={helmcss.halfWidth}>
                  <FormInput.Text
                    name="identifier"
                    label={getString('pipeline.manifestType.manifestIdentifier')}
                    placeholder={getString('pipeline.manifestType.manifestPlaceholder')}
                  />
                </div>
                {getMultiTypeFromValue(prevStepData?.connectorRef) !== MultiTypeInputType.FIXED && (
                  <div
                    className={cx(helmcss.halfWidth, {
                      [helmcss.runtimeInput]:
                        getMultiTypeFromValue(formik.values?.bucketName) === MultiTypeInputType.RUNTIME
                    })}
                  >
                    <FormInput.MultiTextInput
                      label={getString('pipeline.manifestType.bucketName')}
                      placeholder={getString('pipeline.manifestType.bucketNamePlaceholder')}
                      name="bucketName"
                      multiTextInputProps={{ expressions, allowableTypes }}
                    />
                    {getMultiTypeFromValue(formik.values?.bucketName) === MultiTypeInputType.RUNTIME && (
                      <ConfigureOptions
                        style={{ alignSelf: 'center', marginBottom: 4 }}
                        value={formik.values?.bucketName as string}
                        type="String"
                        variableName="bucketName"
                        showRequiredField={false}
                        showDefaultField={false}
                        showAdvanced={true}
                        onChange={value => formik.setFieldValue('bucketName', value)}
                        isReadonly={isReadonly}
                      />
                    )}
                  </div>
                )}
                {getMultiTypeFromValue(prevStepData?.connectorRef) === MultiTypeInputType.FIXED && (
                  <div
                    className={cx(helmcss.halfWidth, {
                      [helmcss.runtimeInput]:
                        getMultiTypeFromValue(formik.values?.bucketName) === MultiTypeInputType.RUNTIME
                    })}
                  >
                    <FormInput.MultiTypeInput
                      selectItems={bucketOptions}
                      disabled={loading}
                      useValue
                      label={getString('pipeline.manifestType.bucketName')}
                      placeholder={getString('pipeline.manifestType.bucketNamePlaceholder')}
                      name="bucketName"
                      multiTypeInputProps={{
                        selectProps: {
                          items: bucketOptions,
                          allowCreatingNewItems: true
                        },
                        onFocus: onBucketNameFocus
                      }}
                    />
                    {getMultiTypeFromValue(formik.values?.bucketName) === MultiTypeInputType.RUNTIME && (
                      <ConfigureOptions
                        style={{ alignSelf: 'center', marginBottom: 4 }}
                        value={formik.values?.bucketName as string}
                        type="String"
                        variableName="bucketName"
                        showRequiredField={false}
                        showDefaultField={false}
                        showAdvanced={true}
                        onChange={value => formik.setFieldValue('bucketName', value)}
                        isReadonly={isReadonly}
                      />
                    )}
                  </div>
                )}
              </Layout.Horizontal>
              <Layout.Horizontal flex spacing="huge">
                <div
                  className={cx(helmcss.halfWidth, {
                    [helmcss.runtimeInput]:
                      getMultiTypeFromValue(formik.values?.folderPath) === MultiTypeInputType.RUNTIME
                  })}
                >
                  <FormInput.MultiTextInput
                    label={getString('chartPath')}
                    multiTextInputProps={{ expressions, allowableTypes }}
                    placeholder={getString('pipeline.manifestType.chartPathPlaceholder')}
                    name="folderPath"
                    isOptional={true}
                  />
                  {getMultiTypeFromValue(formik.values?.folderPath) === MultiTypeInputType.RUNTIME && (
                    <ConfigureOptions
                      style={{ alignSelf: 'center', marginBottom: 4 }}
                      value={formik.values?.folderPath as string}
                      type="String"
                      variableName="folderPath"
                      showRequiredField={false}
                      showDefaultField={false}
                      showAdvanced={true}
                      onChange={value => formik.setFieldValue('folderPath', value)}
                      isReadonly={isReadonly}
                    />
                  )}
                </div>

                <div
                  className={cx(helmcss.halfWidth, {
                    [helmcss.runtimeInput]:
                      getMultiTypeFromValue(formik.values?.chartName) === MultiTypeInputType.RUNTIME
                  })}
                >
                  <FormInput.MultiTextInput
                    name="chartName"
                    multiTextInputProps={{ expressions, allowableTypes }}
                    label={getString('pipeline.manifestType.http.chartName')}
                    placeholder={getString('pipeline.manifestType.http.chartNamePlaceHolder')}
                  />
                  {getMultiTypeFromValue(formik.values?.chartName) === MultiTypeInputType.RUNTIME && (
                    <ConfigureOptions
                      style={{ alignSelf: 'center', marginBottom: 4 }}
                      value={formik.values?.chartName as string}
                      type="String"
                      variableName="chartName"
                      showRequiredField={false}
                      showDefaultField={false}
                      showAdvanced={true}
                      onChange={value => formik.setFieldValue('chartName', value)}
                      isReadonly={isReadonly}
                    />
                  )}
                </div>
              </Layout.Horizontal>
              <Layout.Horizontal flex spacing="huge" margin={{ bottom: 'small' }}>
                <div
                  className={cx(helmcss.halfWidth, {
                    [helmcss.runtimeInput]:
                      getMultiTypeFromValue(formik.values?.chartVersion) === MultiTypeInputType.RUNTIME
                  })}
                >
                  <FormInput.MultiTextInput
                    name="chartVersion"
                    multiTextInputProps={{ expressions, allowableTypes }}
                    label={getString('pipeline.manifestType.http.chartVersion')}
                    placeholder={getString('pipeline.manifestType.http.chartVersionPlaceHolder')}
                    isOptional={true}
                  />
                  {getMultiTypeFromValue(formik.values?.chartVersion) === MultiTypeInputType.RUNTIME && (
                    <ConfigureOptions
                      style={{ alignSelf: 'center', marginBottom: 4 }}
                      value={formik.values?.chartVersion}
                      type="String"
                      variableName="chartVersion"
                      showRequiredField={false}
                      showDefaultField={false}
                      showAdvanced={true}
                      onChange={value => formik.setFieldValue('chartVersion', value)}
                      isReadonly={isReadonly}
                    />
                  )}
                </div>

                <div className={helmcss.halfWidth}>
                  <FormInput.Select
                    name="helmVersion"
                    label={getString('helmVersion')}
                    items={helmVersions}
                    onChange={value => {
                      if (value !== selectedHelmVersion) {
                        formik.setFieldValue('commandFlags', [
                          { commandType: undefined, flag: undefined, id: uuid('', nameSpace()) }
                        ] as any)
                        setHelmVersion(value)
                      }
                    }}
                  />
                </div>
              </Layout.Horizontal>
              <div className={helmcss.halfWidth}>
                <DragnDropPaths
                  formik={formik}
                  expressions={expressions}
                  allowableTypes={allowableTypes}
                  fieldPath="valuesPaths"
                  pathLabel={getString('pipeline.manifestType.valuesYamlPath')}
                  placeholder={getString('pipeline.manifestType.manifestPathPlaceholder')}
                  defaultValue={{ path: '', uuid: uuid('', nameSpace()) }}
                />
              </div>

              <Accordion
                activeId={isActiveAdvancedStep ? getString('advancedTitle') : ''}
                className={cx({
                  [helmcss.advancedStepOpen]: isActiveAdvancedStep
                })}
              >
                <Accordion.Panel
                  id={getString('advancedTitle')}
                  addDomId={true}
                  summary={getString('advancedTitle')}
                  details={
                    <HelmAdvancedStepSection
                      formik={formik}
                      expressions={expressions}
                      allowableTypes={allowableTypes}
                      helmVersion={formik.values?.helmVersion}
                      isReadonly={isReadonly}
                      deploymentType={deploymentType as string}
                      helmStore={prevStepData?.store ?? ''}
                    />
                  }
                />
              </Accordion>
            </div>

            <Layout.Horizontal spacing="medium" className={css.saveBtn}>
              <Button
                text={getString('back')}
                variation={ButtonVariation.SECONDARY}
                icon="chevron-left"
                onClick={() => previousStep?.(prevStepData)}
              />
              <Button
                variation={ButtonVariation.PRIMARY}
                type="submit"
                text={getString('submit')}
                rightIcon="chevron-right"
              />
            </Layout.Horizontal>
          </Form>
        )}
      </Formik>
    </Layout.Vertical>
  )
}

export default HelmWithGcs
