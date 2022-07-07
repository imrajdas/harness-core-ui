/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
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
  ButtonVariation
} from '@wings-software/uicore'
import { Form } from 'formik'
import * as Yup from 'yup'
import { FontVariation } from '@harness/design-system'
import cx from 'classnames'
import { get, isEmpty } from 'lodash-es'
import { v4 as nameSpace, v5 as uuid } from 'uuid'
import { useStrings } from 'framework/strings'
import type { ConnectorConfigDTO, ManifestConfig, ManifestConfigWrapper } from 'services/cd-ng'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'

import type { HelmWithOCIDataType } from '../../ManifestInterface'
import HelmAdvancedStepSection from '../HelmAdvancedStepSection'

import { ManifestDataType, ManifestIdentifierValidation } from '../../Manifesthelper'
import { handleCommandFlagsSubmitData } from '../ManifestUtils'
import DragnDropPaths from '../../DragnDropPaths'
import css from '../ManifestWizardSteps.module.scss'
import helmcss from '../HelmWithGIT/HelmWithGIT.module.scss'

interface HelmWithOCIPropType {
  stepName: string
  expressions: string[]
  allowableTypes: MultiTypeInputType[]
  initialValues: ManifestConfig
  handleSubmit: (data: ManifestConfigWrapper) => void
  manifestIdsList: Array<string>
  isReadonly?: boolean
  deploymentType?: string
}

function HelmWithOCI({
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
}: StepProps<ConnectorConfigDTO> & HelmWithOCIPropType): React.ReactElement {
  const { getString } = useStrings()
  const isActiveAdvancedStep: boolean = initialValues?.spec?.skipResourceVersioning || initialValues?.spec?.commandFlags

  const getInitialValues = (): HelmWithOCIDataType => {
    const specValues = get(initialValues, 'spec.store.spec.config.spec', null)

    if (specValues) {
      return {
        ...specValues,
        identifier: initialValues.identifier,
        helmVersion: initialValues.spec?.helmVersion,
        basePath: initialValues.spec?.store?.spec?.basePath,
        chartName: initialValues.spec?.chartName,
        chartVersion: initialValues.spec?.chartVersion,
        skipResourceVersioning: initialValues?.spec?.skipResourceVersioning,
        valuesPaths:
          /* istanbul ignore next */
          typeof initialValues?.spec?.valuesPaths === 'string'
            ? initialValues?.spec?.valuesPaths
            : initialValues?.spec?.valuesPaths?.map((path: string) => ({ path, uuid: uuid(path, nameSpace()) })),
        commandFlags: initialValues.spec?.commandFlags?.map((commandFlag: { commandType: string; flag: string }) => ({
          commandType: commandFlag.commandType,
          flag: commandFlag.flag
        })) || [{ commandType: undefined, flag: undefined, id: uuid('', nameSpace()) }]
      }
    }
    return {
      identifier: '',
      helmVersion: 'V380',
      basePath: '',
      chartName: '',
      chartVersion: '',
      skipResourceVersioning: false,
      commandFlags: [{ commandType: undefined, flag: undefined, id: uuid('', nameSpace()) }]
    }
  }

  const submitFormData = (formData: HelmWithOCIDataType & { store?: string; connectorRef?: string }): void => {
    const manifestObj: ManifestConfigWrapper = {
      manifest: {
        identifier: formData.identifier,
        type: ManifestDataType.HelmChart,
        spec: {
          store: {
            type: formData?.store,
            spec: {
              config: {
                type: 'Generic',
                spec: {
                  connectorRef: formData?.connectorRef
                }
              },
              basePath: formData?.basePath
            }
          },
          chartName: formData?.chartName,
          chartVersion: formData?.chartVersion,
          helmVersion: 'V380',
          skipResourceVersioning: formData?.skipResourceVersioning,
          valuesPaths:
            /* istanbul ignore next */
            typeof formData?.valuesPaths === 'string'
              ? formData?.valuesPaths
              : formData?.valuesPaths?.map((path: { path: string }) => path.path)
        }
      }
    }

    handleCommandFlagsSubmitData(manifestObj, formData)
    handleSubmit(manifestObj)
  }

  return (
    <Layout.Vertical spacing="xxlarge" padding="small" className={css.manifestStore}>
      <Text font={{ variation: FontVariation.H3 }} margin={{ bottom: 'medium' }}>
        {stepName}
      </Text>
      <Formik
        initialValues={getInitialValues()}
        formName="HelmWithOCI"
        validationSchema={Yup.object().shape({
          basePath: Yup.string().trim().required(getString('pipeline.manifestType.oci.basePathRequired')),
          chartVersion: Yup.string()
            .trim()
            .lowercase()
            .notOneOf(['latest'], getString('pipeline.manifestType.oci.chartVersionValidation')),
          chartName: Yup.string().trim().required(getString('pipeline.manifestType.http.chartNameRequired')),
          helmVersion: Yup.string().trim().required(getString('pipeline.manifestType.helmVersionRequired')),
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
          ),
          ...ManifestIdentifierValidation(
            manifestIdsList,
            initialValues?.identifier,
            getString('pipeline.uniqueIdentifier')
          )
        })}
        onSubmit={formData => {
          submitFormData({
            ...prevStepData,
            ...formData,
            connectorRef: /* istanbul ignore next */ prevStepData?.connectorRef
              ? getMultiTypeFromValue(prevStepData?.connectorRef) !== MultiTypeInputType.FIXED
                ? prevStepData?.connectorRef
                : prevStepData?.connectorRef?.value
              : prevStepData?.identifier
              ? prevStepData?.identifier
              : ''
          })
        }}
      >
        {(formik: { setFieldValue: (a: string, b: string) => void; values: HelmWithOCIDataType }) => (
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
                <div
                  className={cx(helmcss.halfWidth, {
                    [helmcss.runtimeInput]:
                      getMultiTypeFromValue(formik.values?.basePath) === MultiTypeInputType.RUNTIME
                  })}
                >
                  <FormInput.MultiTextInput
                    name="basePath"
                    multiTextInputProps={{ expressions, allowableTypes }}
                    label={getString('pipeline.manifestType.basePath')}
                    placeholder={getString('pipeline.manifestType.basePathPlaceholder')}
                  />
                  {getMultiTypeFromValue(formik.values?.basePath) === MultiTypeInputType.RUNTIME && (
                    <ConfigureOptions
                      value={formik.values?.basePath as string}
                      type="String"
                      variableName="basePath"
                      showRequiredField={false}
                      showDefaultField={false}
                      showAdvanced={true}
                      onChange={/* istanbul ignore next */ value => formik.setFieldValue('basePath', value)}
                      isReadonly={isReadonly}
                    />
                  )}
                </div>
              </Layout.Horizontal>

              <Layout.Horizontal flex spacing="huge" margin={{ bottom: 'small' }}>
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
                      value={formik.values?.chartName as string}
                      type="String"
                      variableName="chartName"
                      showRequiredField={false}
                      showDefaultField={false}
                      showAdvanced={true}
                      onChange={/* istanbul ignore next */ value => formik.setFieldValue('chartName', value)}
                      isReadonly={isReadonly}
                    />
                  )}
                </div>
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
                      value={formik.values?.chartVersion}
                      type="String"
                      variableName="chartVersion"
                      showRequiredField={false}
                      showDefaultField={false}
                      showAdvanced={true}
                      onChange={/* istanbul ignore next */ value => formik.setFieldValue('chartVersion', value)}
                      isReadonly={isReadonly}
                    />
                  )}
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
                icon="chevron-left"
                variation={ButtonVariation.SECONDARY}
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

export default HelmWithOCI
