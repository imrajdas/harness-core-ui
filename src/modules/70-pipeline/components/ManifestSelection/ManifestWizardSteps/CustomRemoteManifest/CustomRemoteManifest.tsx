/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  Accordion,
  Button,
  ButtonVariation,
  Formik,
  FormInput,
  getMultiTypeFromValue,
  Layout,
  MultiTypeInputType,
  StepProps,
  Text
} from '@harness/uicore'
import { useParams } from 'react-router-dom'
import { FontVariation } from '@harness/design-system'
import { Form } from 'formik'
import * as Yup from 'yup'
import { defaultTo, get, set } from 'lodash-es'
import { v4 as nameSpace, v5 as uuid } from 'uuid'
import { useStrings } from 'framework/strings'
import type { ConnectorConfigDTO, ManifestConfig, ManifestConfigWrapper } from 'services/cd-ng'
import { FormMultiTypeCheckboxField } from '@common/components'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import MultiTypeFieldSelector from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import { MonacoTextField } from '@common/components/MonacoTextField/MonacoTextField'
import MultiTypeDelegateSelector from '@common/components/MultiTypeDelegateSelector/MultiTypeDelegateSelector'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import type { CustomManifestManifestDataType, ManifestTypes } from '../../ManifestInterface'
import { ManifestDataType, ManifestIdentifierValidation } from '../../Manifesthelper'
import DragnDropPaths from '../../DragnDropPaths'
import css from '../K8sValuesManifest/ManifestDetails.module.scss'

interface CustomRemoteManifestPropType {
  stepName: string
  expressions: string[]
  allowableTypes: MultiTypeInputType[]
  initialValues: ManifestConfig
  selectedManifest: ManifestTypes | null
  handleSubmit: (data: ManifestConfigWrapper) => void
  manifestIdsList: Array<string>
  isReadonly?: boolean
}

const showValuesPaths = (selectedManifest: ManifestTypes): boolean => {
  return [ManifestDataType.K8sManifest, ManifestDataType.HelmChart].includes(selectedManifest)
}
const showParamsPaths = (selectedManifest: ManifestTypes): boolean => {
  return selectedManifest === ManifestDataType.OpenshiftTemplate
}
const showSkipResourceVersion = (selectedManifest: ManifestTypes): boolean => {
  return [ManifestDataType.K8sManifest, ManifestDataType.HelmChart, ManifestDataType.OpenshiftTemplate].includes(
    selectedManifest
  )
}
type PathsInterface = { path: string; uuid: string }

function CustomRemoteManifest({
  stepName,
  selectedManifest,
  expressions,
  allowableTypes,
  initialValues,
  handleSubmit,
  prevStepData,
  previousStep,
  manifestIdsList,
  isReadonly
}: StepProps<ConnectorConfigDTO> & CustomRemoteManifestPropType): React.ReactElement {
  const { getString } = useStrings()
  const { projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()

  const getInitialValues = (): CustomManifestManifestDataType => {
    const specValues = get(initialValues, 'spec.store.spec', null)
    const valuesPaths = get(initialValues, 'spec.valuesPaths')
    const paramsPaths = get(initialValues, 'spec.paramsPaths')
    if (specValues) {
      return {
        ...specValues,
        identifier: initialValues.identifier,
        skipResourceVersioning: get(initialValues, 'spec.skipResourceVersioning'),
        valuesPaths:
          typeof valuesPaths === 'string'
            ? valuesPaths
            : defaultTo(valuesPaths, []).map((path: string) => ({ path, uuid: uuid(path, nameSpace()) })),
        paramsPaths:
          typeof paramsPaths === 'string'
            ? paramsPaths
            : defaultTo(paramsPaths, []).map((path: string) => ({ path, uuid: uuid(path, nameSpace()) }))
      }
    }
    return {
      identifier: '',
      filePath: '',
      extractionScript: '',
      skipResourceVersioning: false,
      valuesPaths: [{ path: '', uuid: uuid('', nameSpace()) } as PathsInterface],
      paramsPaths: [{ path: '', uuid: uuid('', nameSpace()) } as PathsInterface],
      delegateSelectors: []
    }
  }

  const submitFormData = (
    formData: CustomManifestManifestDataType & { store?: string; connectorRef?: string }
  ): void => {
    /* istanbul ignore else */
    if (formData) {
      const manifestObj: ManifestConfigWrapper = {
        manifest: {
          identifier: formData.identifier,
          type: selectedManifest as ManifestTypes,
          spec: {
            store: {
              type: formData.store,
              spec: {
                filePath: formData.filePath,
                extractionScript: formData.extractionScript,
                delegateSelectors: formData.delegateSelectors
              }
            }
          }
        }
      }
      if (showSkipResourceVersion(selectedManifest as ManifestTypes)) {
        set(manifestObj, 'manifest.spec.skipResourceVersioning', formData?.skipResourceVersioning)
      }
      if (showValuesPaths(selectedManifest as ManifestTypes)) {
        set(
          manifestObj,
          'manifest.spec.valuesPaths',
          typeof formData.valuesPaths === 'string'
            ? formData.valuesPaths
            : defaultTo(formData.valuesPaths as Array<{ path: string }>, []).map((path: { path: string }) => path.path)
        )
      }
      if (showParamsPaths(selectedManifest as ManifestTypes)) {
        set(
          manifestObj,
          'manifest.spec.paramsPaths',
          typeof formData.paramsPaths === 'string'
            ? formData.paramsPaths
            : defaultTo(formData.paramsPaths as Array<{ path: string }>, []).map((path: { path: string }) => path.path)
        )
      }

      handleSubmit(manifestObj)
    }
  }

  return (
    <Layout.Vertical height={'inherit'} spacing="medium" className={css.optionsViewContainer}>
      <Text font={{ variation: FontVariation.H3 }} margin={{ bottom: 'medium' }}>
        {stepName}
      </Text>

      <Formik
        initialValues={getInitialValues()}
        formName="manifestDetails"
        validationSchema={Yup.object().shape({
          ...ManifestIdentifierValidation(manifestIdsList, initialValues?.identifier, getString('pipeline.uniqueName')),
          paths: Yup.lazy((value): Yup.Schema<unknown> => {
            if (getMultiTypeFromValue(value as any) === MultiTypeInputType.FIXED) {
              return Yup.array().of(
                Yup.object().shape({
                  path: Yup.string().min(1).required(getString('pipeline.manifestType.pathRequired'))
                })
              )
            }
            return Yup.string().required(getString('pipeline.manifestType.pathRequired'))
          })
        })}
        onSubmit={formData => {
          submitFormData({
            ...prevStepData,
            ...formData
          })
        }}
      >
        {(formik: { setFieldValue: (a: string, b: string) => void; values: CustomManifestManifestDataType }) => {
          return (
            <Form>
              <Layout.Vertical
                flex={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
                className={css.manifestForm}
              >
                <div className={css.manifestStepWidth}>
                  <div className={css.halfWidth}>
                    <FormInput.Text
                      name="identifier"
                      label={getString('pipeline.manifestType.manifestIdentifier')}
                      placeholder={getString('pipeline.manifestType.manifestPlaceholder')}
                    />
                  </div>
                  <div className={css.halfWidth}>
                    <MultiTypeFieldSelector
                      name={'extractionScript'}
                      label={getString('pipeline.manifestType.customRemoteExtractionScript')}
                      allowedTypes={allowableTypes}
                      style={{ width: 450 }}
                      skipRenderValueInExpressionLabel
                      expressionRender={() => (
                        /* istanbul ignore next */
                        <MonacoTextField
                          name={'extractionScript'}
                          expressions={expressions}
                          height={80}
                          fullScreenAllowed
                          fullScreenTitle={getString('pipeline.manifestType.customRemoteExtractionScript')}
                        />
                      )}
                    >
                      <MonacoTextField
                        name={'extractionScript'}
                        expressions={expressions}
                        height={80}
                        fullScreenAllowed
                        fullScreenTitle={getString('pipeline.manifestType.customRemoteExtractionScript')}
                      />
                    </MultiTypeFieldSelector>
                  </div>
                  <div className={css.halfWidth}>
                    <FormInput.MultiTextInput
                      multiTextInputProps={{ expressions, allowableTypes }}
                      label={getString('pipeline.manifestType.customRemoteExtractedFileLocation')}
                      placeholder={getString('pipeline.manifestType.customRemoteExtractedFileLocationPlaceholder')}
                      name="filePath"
                    />

                    {getMultiTypeFromValue(get(formik, 'values.filePath')) === MultiTypeInputType.RUNTIME && (
                      <ConfigureOptions
                        value={get(formik, 'values.filePath') as string}
                        type="String"
                        variableName="filePath"
                        showRequiredField={false}
                        showDefaultField={false}
                        showAdvanced={true}
                        onChange={/* istanbul ignore next */ value => formik.setFieldValue('filePath', value)}
                        isReadonly={isReadonly}
                      />
                    )}
                  </div>
                  <div className={css.halfWidth}>
                    <MultiTypeDelegateSelector
                      expressions={expressions}
                      name="delegateSelectors"
                      inputProps={{ projectIdentifier, orgIdentifier }}
                      allowableTypes={allowableTypes}
                      disabled={isReadonly}
                    />
                  </div>
                  {showValuesPaths(selectedManifest as ManifestTypes) && (
                    <div className={css.halfWidth}>
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
                  )}
                  {showParamsPaths(selectedManifest as ManifestTypes) && (
                    <div className={css.halfWidth}>
                      <DragnDropPaths
                        formik={formik}
                        expressions={expressions}
                        allowableTypes={allowableTypes}
                        fieldPath="paramsPaths"
                        pathLabel={getString('pipeline.manifestType.paramsYamlPath')}
                        placeholder={getString('pipeline.manifestType.manifestPathPlaceholder')}
                        defaultValue={{ path: '', uuid: uuid('', nameSpace()) }}
                      />
                    </div>
                  )}
                  {showSkipResourceVersion(selectedManifest as ManifestTypes) && (
                    <Accordion
                      activeId={get(initialValues, 'spec.skipResourceVersioning') ? getString('advancedTitle') : ''}
                      className={css.advancedStepOpen}
                    >
                      <Accordion.Panel
                        id={getString('advancedTitle')}
                        addDomId={true}
                        summary={getString('advancedTitle')}
                        details={
                          <Layout.Horizontal
                            width={'50%'}
                            flex={{ justifyContent: 'flex-start', alignItems: 'center' }}
                            margin={{ bottom: 'huge' }}
                          >
                            <FormMultiTypeCheckboxField
                              name="skipResourceVersioning"
                              label={getString('skipResourceVersion')}
                              multiTypeTextbox={{ expressions, allowableTypes }}
                              className={css.checkbox}
                            />
                            {getMultiTypeFromValue(get(formik, 'values.skipResourceVersioning')) ===
                              MultiTypeInputType.RUNTIME && (
                              <ConfigureOptions
                                value={get(formik, 'values.skipResourceVersioning', '') as string}
                                type="String"
                                variableName="skipResourceVersioning"
                                showRequiredField={false}
                                showDefaultField={false}
                                showAdvanced={true}
                                onChange={value => formik.setFieldValue('skipResourceVersioning', value)}
                                style={{ alignSelf: 'center', marginTop: 11 }}
                                className={css.addmarginTop}
                                isReadonly={isReadonly}
                              />
                            )}
                          </Layout.Horizontal>
                        }
                      />
                    </Accordion>
                  )}
                </div>

                <Layout.Horizontal spacing="medium" className={css.saveBtn}>
                  <Button
                    variation={ButtonVariation.SECONDARY}
                    text={getString('back')}
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
              </Layout.Vertical>
            </Form>
          )
        }}
      </Formik>
    </Layout.Vertical>
  )
}

export default CustomRemoteManifest
