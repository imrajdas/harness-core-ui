/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  Button,
  ButtonVariation,
  Formik,
  FormInput,
  Layout,
  MultiTypeInputType,
  StepProps,
  Text
} from '@harness/uicore'
import { FontVariation } from '@harness/design-system'
import { FieldArray, Form } from 'formik'
import * as Yup from 'yup'
import { defaultTo, get } from 'lodash-es'
import { v4 as nameSpace, v5 as uuid } from 'uuid'
import { useStrings } from 'framework/strings'
import type { ConnectorConfigDTO, ManifestConfig, ManifestConfigWrapper } from 'services/cd-ng'
import FileStoreSelectField from '@filestore/components/FileStoreSelectField/FileStoreSelectField'
import MultiTypeFieldSelector from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import { ManifestDataType, ManifestIdentifierValidation, ManifestStoreMap } from '../../Manifesthelper'
import type { HarnessFileStoreDataType, HarnessFileStoreFormData, ManifestTypes } from '../../ManifestInterface'
import css from '../K8sValuesManifest/ManifestDetails.module.scss'

interface HarnessFileStorePropType {
  stepName: string
  allowableTypes: MultiTypeInputType[]
  initialValues: ManifestConfig
  selectedManifest: ManifestTypes | null
  handleSubmit: (data: ManifestConfigWrapper) => void
  manifestIdsList: Array<string>
  isReadonly?: boolean
}

const showValuesPaths = (selectedManifest: ManifestTypes): boolean => {
  return [
    ManifestDataType.K8sManifest,
    ManifestDataType.HelmChart,
    ManifestDataType.OpenshiftTemplate,
    ManifestDataType.Kustomize
  ].includes(selectedManifest)
}

function HarnessFileStore({
  stepName,
  selectedManifest,
  allowableTypes,
  initialValues,
  handleSubmit,
  prevStepData,
  previousStep,
  manifestIdsList
}: StepProps<ConnectorConfigDTO> & HarnessFileStorePropType): React.ReactElement {
  const { getString } = useStrings()

  const getInitialValues = (): HarnessFileStoreDataType => {
    const specValues = get(initialValues, 'spec.store.spec', null)
    const valuesPaths = get(initialValues, 'spec.valuesPaths')
    if (specValues) {
      return {
        ...specValues,
        identifier: initialValues.identifier,
        valuesPaths:
          typeof valuesPaths === 'string'
            ? valuesPaths
            : defaultTo(valuesPaths, []).map((path: string) => ({ uuid: uuid(path, nameSpace()) }))
      }
    }
    return {
      identifier: '',
      files: [''],
      valuesPaths: [{ uuid: uuid('', nameSpace()) }]
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }

  const submitFormData = (formData: HarnessFileStoreFormData & { store?: string; connectorRef?: string }): void => {
    /* istanbul ignore else */
    if (formData) {
      const manifestObj: ManifestConfigWrapper = {
        manifest: {
          identifier: formData.identifier,
          type: selectedManifest as ManifestTypes,
          spec: {
            store: {
              type: ManifestStoreMap.Harness,
              spec: {
                files:
                  typeof formData.files === 'string'
                    ? formData.files
                    : defaultTo(formData.files, []).map((file: any) => `${file.scope}:${file.path}`)
              }
            },
            valuesPaths:
              typeof formData.valuesPaths === 'string'
                ? formData.valuesPaths
                : defaultTo(formData.valuesPaths, []).map((valueObj: any) => `${valueObj.scope}:${valueObj.path}`)
          }
        }
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
          ...ManifestIdentifierValidation(manifestIdsList, initialValues?.identifier, getString('pipeline.uniqueName'))
        })}
        onSubmit={formData => {
          submitFormData({
            ...prevStepData,
            ...formData
          } as unknown as HarnessFileStoreFormData)
        }}
      >
        {(formik: { setFieldValue: (a: string, b: string) => void; values: HarnessFileStoreDataType }) => {
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
                      defaultValueToReset={[{ path: '', scope: 'account' }]}
                      allowedTypes={allowableTypes.filter(allowedType => allowedType !== MultiTypeInputType.EXPRESSION)}
                      name="files"
                      label={getString('resourcePage.fileStore')}
                    >
                      <FieldArray
                        name="files"
                        render={({ push, remove }) => (
                          <Layout.Vertical>
                            {defaultTo(get(formik, 'values.files'), []).map((file: string, index: number) => (
                              <Layout.Horizontal key={file} margin={{ top: 'medium' }}>
                                <FileStoreSelectField name={`files[${index}]`} />
                                {index !== 0 && (
                                  /* istanbul ignore next */ <Button
                                    minimal
                                    icon="main-trash"
                                    onClick={() => remove(index)}
                                  />
                                )}
                              </Layout.Horizontal>
                            ))}
                            <span>
                              <Button
                                minimal
                                text={getString('add')}
                                variation={ButtonVariation.PRIMARY}
                                onClick={() => push({})}
                              />
                            </span>
                          </Layout.Vertical>
                        )}
                      />
                    </MultiTypeFieldSelector>
                  </div>
                  {showValuesPaths(selectedManifest as ManifestTypes) && (
                    <div className={css.halfWidth}>
                      <MultiTypeFieldSelector
                        defaultValueToReset={['']}
                        allowedTypes={allowableTypes.filter(
                          allowedType => allowedType !== MultiTypeInputType.EXPRESSION
                        )}
                        name="valuesPaths"
                        label={getString('pipeline.manifestType.valuesYamlPath')}
                      >
                        <FieldArray
                          name="valuesPaths"
                          render={({ push, remove }) => (
                            <Layout.Vertical>
                              {defaultTo(get(formik, 'values.valuesPaths'), []).map((paths: string, index: number) => (
                                <Layout.Horizontal key={paths} margin={{ top: 'medium' }}>
                                  <FileStoreSelectField name={`valuesPaths[${index}]`} />

                                  {index !== 0 && (
                                    /* istanbul ignore next */ <Button
                                      minimal
                                      icon="main-trash"
                                      onClick={() => remove(index)}
                                    />
                                  )}
                                </Layout.Horizontal>
                              ))}
                              <span>
                                <Button
                                  minimal
                                  text={getString('add')}
                                  variation={ButtonVariation.PRIMARY}
                                  onClick={() => push('')}
                                />
                              </span>
                            </Layout.Vertical>
                          )}
                        />
                      </MultiTypeFieldSelector>
                    </div>
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

export default HarnessFileStore
