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
  getMultiTypeFromValue,
  MultiTypeInputType,
  Text,
  StepProps,
  ButtonVariation
} from '@wings-software/uicore'
import cx from 'classnames'
import { FontVariation } from '@harness/design-system'
import { Form } from 'formik'
import { v4 as nameSpace, v5 as uuid } from 'uuid'
import * as Yup from 'yup'

import { get, set, isEmpty } from 'lodash-es'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import { FormMultiTypeCheckboxField } from '@common/components'

import { useStrings } from 'framework/strings'
import type { ConnectorConfigDTO, ManifestConfig, ManifestConfigWrapper } from 'services/cd-ng'
import type { K8sValuesManifestDataType, ManifestTypes } from '../../ManifestInterface'
import {
  gitFetchTypeList,
  GitFetchTypes,
  GitRepoName,
  ManifestDataType,
  ManifestIdentifierValidation,
  ManifestStoreMap
} from '../../Manifesthelper'
import GitRepositoryName from '../GitRepositoryName/GitRepositoryName'
import DragnDropPaths from '../../DragnDropPaths'

import { getRepositoryName } from '../ManifestUtils'
import css from './ManifestDetails.module.scss'

interface K8sValuesManifestPropType {
  stepName: string
  expressions: string[]
  allowableTypes: MultiTypeInputType[]
  initialValues: ManifestConfig
  selectedManifest: ManifestTypes | null
  handleSubmit: (data: ManifestConfigWrapper) => void
  manifestIdsList: Array<string>
  isReadonly?: boolean
}

const showAdvancedSection = (selectedManifest: ManifestTypes | null): boolean => {
  return selectedManifest === ManifestDataType.K8sManifest
}

function K8sValuesManifest({
  stepName,
  selectedManifest,
  expressions,
  allowableTypes,
  initialValues,
  handleSubmit,
  prevStepData,
  previousStep,
  manifestIdsList,
  isReadonly = false
}: StepProps<ConnectorConfigDTO> & K8sValuesManifestPropType): React.ReactElement {
  const { getString } = useStrings()
  const isActiveAdvancedStep: boolean = initialValues?.spec?.skipResourceVersioning

  const gitConnectionType: string = prevStepData?.store === ManifestStoreMap.Git ? 'connectionType' : 'type'
  const connectionType =
    prevStepData?.connectorRef?.connector?.spec?.[gitConnectionType] === GitRepoName.Repo ||
    prevStepData?.urlType === GitRepoName.Repo
      ? GitRepoName.Repo
      : GitRepoName.Account

  const accountUrl =
    connectionType === GitRepoName.Account
      ? prevStepData?.connectorRef
        ? prevStepData?.connectorRef?.connector?.spec?.url
        : prevStepData?.url
      : null

  const getInitialValues = (): K8sValuesManifestDataType => {
    const specValues = get(initialValues, 'spec.store.spec', null)

    if (specValues) {
      return {
        ...specValues,
        identifier: initialValues.identifier,
        skipResourceVersioning: initialValues?.spec?.skipResourceVersioning,
        repoName: getRepositoryName(prevStepData, initialValues),
        paths:
          typeof specValues.paths === 'string'
            ? specValues.paths
            : specValues.paths?.map((path: string) => ({ path, uuid: uuid(path, nameSpace()) })),
        valuesPaths:
          typeof initialValues?.spec?.valuesPaths === 'string'
            ? initialValues?.spec?.valuesPaths
            : initialValues?.spec?.valuesPaths?.map((path: string) => ({ path, uuid: uuid(path, nameSpace()) }))
      }
    }
    return {
      identifier: '',
      branch: undefined,
      commitId: undefined,
      gitFetchType: 'Branch',
      paths: [{ path: '', uuid: uuid('', nameSpace()) }],
      skipResourceVersioning: false,
      repoName: getRepositoryName(prevStepData, initialValues)
    }
  }

  const submitFormData = (formData: K8sValuesManifestDataType & { store?: string; connectorRef?: string }): void => {
    const manifestObj: ManifestConfigWrapper = {
      manifest: {
        identifier: formData.identifier,
        type: selectedManifest as ManifestTypes,
        spec: {
          store: {
            type: formData?.store,
            spec: {
              connectorRef: formData?.connectorRef,
              gitFetchType: formData?.gitFetchType,
              paths:
                typeof formData?.paths === 'string'
                  ? formData?.paths
                  : formData?.paths?.map((path: { path: string }) => path.path)
            }
          },
          valuesPaths:
            typeof formData?.valuesPaths === 'string'
              ? formData?.valuesPaths
              : formData?.valuesPaths?.map((path: { path: string }) => path.path)
        }
      }
    }
    if (connectionType === GitRepoName.Account) {
      set(manifestObj, 'manifest.spec.store.spec.repoName', formData?.repoName)
    }

    if (manifestObj?.manifest?.spec?.store) {
      if (formData?.gitFetchType === 'Branch') {
        set(manifestObj, 'manifest.spec.store.spec.branch', formData?.branch)
      } else if (formData?.gitFetchType === 'Commit') {
        set(manifestObj, 'manifest.spec.store.spec.commitId', formData?.commitId)
      }
    }

    if (selectedManifest === ManifestDataType.K8sManifest) {
      set(manifestObj, 'manifest.spec.skipResourceVersioning', formData?.skipResourceVersioning)
    }
    handleSubmit(manifestObj)
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
          branch: Yup.string().when('gitFetchType', {
            is: 'Branch',
            then: Yup.string().trim().required(getString('validation.branchName'))
          }),
          commitId: Yup.string().when('gitFetchType', {
            is: 'Commit',
            then: Yup.string().trim().required(getString('validation.commitId'))
          }),
          paths: Yup.lazy((value): Yup.Schema<unknown> => {
            if (getMultiTypeFromValue(value as any) === MultiTypeInputType.FIXED) {
              return Yup.array().of(
                Yup.object().shape({
                  path: Yup.string().min(1).required(getString('pipeline.manifestType.pathRequired'))
                })
              )
            }
            return Yup.string().required(getString('pipeline.manifestType.pathRequired'))
          }),
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
          repoName: Yup.string().test('repoName', getString('common.validation.repositoryName'), value => {
            if (
              connectionType === GitRepoName.Repo ||
              getMultiTypeFromValue(prevStepData?.connectorRef) !== MultiTypeInputType.FIXED
            ) {
              return true
            }
            return !isEmpty(value) && value?.length > 0
          })
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
        {(formik: { setFieldValue: (a: string, b: string) => void; values: K8sValuesManifestDataType }) => {
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

                  {!!(connectionType === GitRepoName.Account && accountUrl) && (
                    <GitRepositoryName
                      accountUrl={accountUrl}
                      expressions={expressions}
                      allowableTypes={allowableTypes}
                      fieldValue={formik.values?.repoName}
                      changeFieldValue={(value: string) => formik.setFieldValue('repoName', value)}
                      isReadonly={isReadonly}
                    />
                  )}
                  <Layout.Horizontal spacing="huge" margin={{ top: 'small', bottom: 'small' }}>
                    <div className={css.halfWidth}>
                      <FormInput.Select
                        name="gitFetchType"
                        label={getString('pipeline.manifestType.gitFetchTypeLabel')}
                        items={gitFetchTypeList}
                      />
                    </div>

                    {formik.values?.gitFetchType === GitFetchTypes.Branch && (
                      <div
                        className={cx(css.halfWidth, {
                          [css.runtimeInput]:
                            getMultiTypeFromValue(formik.values?.branch) === MultiTypeInputType.RUNTIME
                        })}
                      >
                        <FormInput.MultiTextInput
                          multiTextInputProps={{ expressions, allowableTypes }}
                          label={getString('pipelineSteps.deploy.inputSet.branch')}
                          placeholder={getString('pipeline.manifestType.branchPlaceholder')}
                          name="branch"
                        />

                        {getMultiTypeFromValue(formik.values?.branch) === MultiTypeInputType.RUNTIME && (
                          <ConfigureOptions
                            value={formik.values?.branch as string}
                            type="String"
                            variableName="branch"
                            showRequiredField={false}
                            showDefaultField={false}
                            showAdvanced={true}
                            onChange={value => formik.setFieldValue('branch', value)}
                            isReadonly={isReadonly}
                          />
                        )}
                      </div>
                    )}

                    {formik.values?.gitFetchType === GitFetchTypes.Commit && (
                      <div
                        className={cx(css.halfWidth, {
                          [css.runtimeInput]:
                            getMultiTypeFromValue(formik.values?.commitId) === MultiTypeInputType.RUNTIME
                        })}
                      >
                        <FormInput.MultiTextInput
                          multiTextInputProps={{ expressions, allowableTypes }}
                          label={getString('pipeline.manifestType.commitId')}
                          placeholder={getString('pipeline.manifestType.commitPlaceholder')}
                          name="commitId"
                        />

                        {getMultiTypeFromValue(formik.values?.commitId) === MultiTypeInputType.RUNTIME && (
                          <ConfigureOptions
                            value={formik.values?.commitId as string}
                            type="String"
                            variableName="commitId"
                            showRequiredField={false}
                            showDefaultField={false}
                            showAdvanced={true}
                            onChange={value => formik.setFieldValue('commitId', value)}
                            isReadonly={isReadonly}
                          />
                        )}
                      </div>
                    )}
                  </Layout.Horizontal>
                  <div className={css.halfWidth}>
                    <DragnDropPaths
                      formik={formik}
                      expressions={expressions}
                      allowableTypes={allowableTypes}
                      fieldPath="paths"
                      pathLabel={getString('fileFolderPathText')}
                      placeholder={getString('pipeline.manifestType.manifestPathPlaceholder')}
                      defaultValue={{ path: '', uuid: uuid('', nameSpace()) }}
                    />
                    {selectedManifest === ManifestDataType.K8sManifest && (
                      <DragnDropPaths
                        formik={formik}
                        expressions={expressions}
                        allowableTypes={allowableTypes}
                        fieldPath="valuesPaths"
                        pathLabel={getString('pipeline.manifestType.valuesYamlPath')}
                        placeholder={getString('pipeline.manifestType.manifestPathPlaceholder')}
                        defaultValue={{ path: '', uuid: uuid('', nameSpace()) }}
                      />
                    )}
                  </div>

                  {showAdvancedSection(selectedManifest) && (
                    <Accordion
                      activeId={isActiveAdvancedStep ? getString('advancedTitle') : ''}
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
                            {getMultiTypeFromValue(formik.values?.skipResourceVersioning) ===
                              MultiTypeInputType.RUNTIME && (
                              <ConfigureOptions
                                value={(formik.values?.skipResourceVersioning || '') as string}
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

export default K8sValuesManifest
