/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useMemo } from 'react'
import { Form, FormikValues } from 'formik'
import { useParams } from 'react-router-dom'
import { defaultTo, get, isNil, memoize, merge } from 'lodash-es'
import * as Yup from 'yup'
import { Menu } from '@blueprintjs/core'

import {
  Button,
  ButtonVariation,
  FontVariation,
  Formik,
  FormInput,
  getMultiTypeFromValue,
  Layout,
  MultiTypeInputType,
  StepProps,
  Text
} from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { BucketResponse, ConnectorConfigDTO, useGetV2BucketListForS3 } from 'services/cd-ng'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import useRBACError, { RBACError } from '@rbac/utils/useRBACError/useRBACError'
import {
  AmazonS3ArtifactProps,
  AmazonS3InitialValuesType,
  TagTypes
} from '@pipeline/components/ArtifactsSelection/ArtifactInterface'
import {
  ArtifactIdentifierValidation,
  ModalViewFor,
  tagOptions
} from '@pipeline/components/ArtifactsSelection/ArtifactHelper'
import {
  defaultArtifactInitialValues,
  getConnectorIdValue
} from '@pipeline/components/ArtifactsSelection/ArtifactUtils'
import SideCarArtifactIdentifier from '../SideCarArtifactIdentifier'
import css from '../../ArtifactConnector.module.scss'

export function AmazonS3(props: StepProps<ConnectorConfigDTO> & AmazonS3ArtifactProps): React.ReactElement {
  const {
    context,
    handleSubmit,
    expressions,
    allowableTypes,
    prevStepData,
    initialValues,
    previousStep,
    artifactIdentifiers,
    isReadonly = false,
    selectedArtifact
  } = props

  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()

  const { getString } = useStrings()
  const { getRBACErrorMessage } = useRBACError()

  const {
    data: bucketData,
    error,
    loading,
    refetch: refetchBuckets
  } = useGetV2BucketListForS3({
    lazy: true,
    debounce: 300
  })

  const fetchBuckets = (): void => {
    refetchBuckets({
      queryParams: {
        accountIdentifier: accountId,
        orgIdentifier,
        projectIdentifier,
        connectorRef: prevStepData?.connectorId?.value ?? prevStepData?.connectorId
      }
    })
  }

  const selectItems = useMemo(() => {
    return bucketData?.data?.map((bucket: BucketResponse) => ({
      value: defaultTo(bucket.bucketName, ''),
      label: defaultTo(bucket.bucketName, '')
    }))
  }, [bucketData?.data])

  const getBuckets = (): { label: string; value: string }[] => {
    if (loading) {
      return [{ label: 'Loading Buckets...', value: 'Loading Buckets...' }]
    }
    return defaultTo(selectItems, [])
  }

  const schemaObject = {
    bucketName: Yup.mixed().required(getString('pipeline.manifestType.bucketNameRequired')),
    tagType: Yup.string().required(),
    filePath: Yup.string().when('tagType', {
      is: 'value',
      then: Yup.string().required(getString('pipeline.manifestType.pathRequired'))
    }),
    filePathRegex: Yup.string().when('tagType', {
      is: 'regex',
      then: Yup.string().required(getString('pipeline.artifactsSelection.validation.filePathRegex'))
    })
  }
  const sidecarSchema = Yup.object().shape({
    ...schemaObject,
    ...ArtifactIdentifierValidation(
      artifactIdentifiers,
      initialValues?.identifier,
      getString('pipeline.uniqueIdentifier')
    )
  })

  const primarySchema = Yup.object().shape(schemaObject)

  const getValidationSchema = useCallback(() => {
    if (context === ModalViewFor.SIDECAR) {
      return sidecarSchema
    }
    return primarySchema
  }, [context, primarySchema, sidecarSchema])

  const getInitialValues = (): AmazonS3InitialValuesType => {
    // Initia specValues
    const specValues = get(initialValues, 'spec', null)
    // if specValues is nil or selected type is not matching with initialValues.type then assume NEW
    if (selectedArtifact !== (initialValues as any)?.type || !specValues) {
      return defaultArtifactInitialValues(defaultTo(selectedArtifact, 'AmazonS3'))
    }
    // Depending upon if filePath is present or not in specValues, decide typeType
    merge(specValues, { tagType: specValues.filePath ? TagTypes.Value : TagTypes.Regex })
    // If sidecar then merge identifier value to specValues
    if (context === ModalViewFor.SIDECAR && initialValues?.identifier) {
      merge(specValues, { identifier: initialValues?.identifier })
    }
    return specValues
  }

  const submitFormData = (formData: AmazonS3InitialValuesType & { connectorId?: string }): void => {
    // Initial data
    const artifactObj = {
      spec: {
        connectorRef: formData.connectorId,
        bucketName: formData.bucketName
      }
    }
    // Merge filePath or filePathRegex field value with initial data depending upon tagType selection
    const filePathData =
      formData?.tagType === TagTypes.Value ? { filePath: formData.filePath } : { filePathRegex: formData.filePathRegex }
    merge(artifactObj.spec, filePathData)
    // If sidecar artifact then merge identifier value with initial value
    if (context === ModalViewFor.SIDECAR) {
      merge(artifactObj, { identifier: formData?.identifier })
    }
    // Submit the final object
    handleSubmit(artifactObj)
  }

  const itemRenderer = memoize((item: { label: string }, { handleClick }) => (
    <div key={item.label.toString()}>
      <Menu.Item
        text={
          <Layout.Horizontal spacing="small">
            <Text>{item.label}</Text>
          </Layout.Horizontal>
        }
        disabled={loading}
        onClick={handleClick}
      />
    </div>
  ))

  const renderS3BucketField = (formik: FormikValues): JSX.Element => {
    if (getMultiTypeFromValue(prevStepData?.connectorId) !== MultiTypeInputType.FIXED) {
      return (
        <div className={css.imagePathContainer}>
          <FormInput.MultiTextInput
            label={getString('pipeline.manifestType.bucketName')}
            placeholder={getString('pipeline.manifestType.bucketNamePlaceholder')}
            name="bucketName"
            multiTextInputProps={{ expressions, allowableTypes }}
          />
          {getMultiTypeFromValue(formik.values?.bucketName) === MultiTypeInputType.RUNTIME && (
            <div className={css.configureOptions}>
              <ConfigureOptions
                style={{ alignSelf: 'center', marginBottom: 3 }}
                value={formik.values?.bucketName as string}
                type="String"
                variableName="bucketName"
                showRequiredField={false}
                showDefaultField={false}
                showAdvanced={true}
                onChange={value => formik.setFieldValue('bucketName', value)}
                isReadonly={isReadonly}
              />
            </div>
          )}
        </div>
      )
    }
    return (
      <div className={css.imagePathContainer}>
        <FormInput.MultiTypeInput
          selectItems={getBuckets()}
          label={getString('pipeline.manifestType.bucketName')}
          placeholder={getString('pipeline.manifestType.bucketPlaceHolder')}
          name="bucketName"
          useValue
          multiTypeInputProps={{
            expressions,
            allowableTypes,
            selectProps: {
              noResults: (
                <Text lineClamp={1}>{getRBACErrorMessage(error as RBACError) || getString('pipeline.noBuckets')}</Text>
              ),
              itemRenderer: itemRenderer,
              items: getBuckets(),
              allowCreatingNewItems: true
            },
            onFocus: () => {
              if (!bucketData?.data) {
                fetchBuckets()
              }
            }
          }}
        />
        {getMultiTypeFromValue(formik.values?.bucketName) === MultiTypeInputType.RUNTIME && (
          <div className={css.configureOptions}>
            <ConfigureOptions
              style={{ alignSelf: 'center', marginBottom: 3 }}
              value={formik.values?.bucketName as string}
              type="String"
              variableName="bucketName"
              showRequiredField={false}
              showDefaultField={false}
              showAdvanced={true}
              onChange={value => formik.setFieldValue('bucketName', value)}
              isReadonly={isReadonly}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <Layout.Vertical spacing="medium" className={css.firstep}>
      <Text font={{ variation: FontVariation.H3 }} margin={{ bottom: 'medium' }}>
        {getString('pipeline.artifactsSelection.artifactDetails')}
      </Text>
      <Formik
        initialValues={getInitialValues()}
        formName="artifactoryArtifact"
        validationSchema={getValidationSchema()}
        onSubmit={formData => {
          submitFormData({
            ...prevStepData,
            ...formData,
            connectorId: getConnectorIdValue(prevStepData)
          })
        }}
      >
        {formik => (
          <Form>
            <div className={css.connectorForm}>
              {context === ModalViewFor.SIDECAR && <SideCarArtifactIdentifier />}

              {renderS3BucketField(formik)}

              <div className={css.tagGroup}>
                <FormInput.RadioGroup
                  name="tagType"
                  radioGroup={{ inline: true }}
                  items={tagOptions}
                  className={css.radioGroup}
                  onChange={() => {
                    if (!isNil(formik.values?.filePath)) {
                      if (getMultiTypeFromValue(formik.values?.filePath) !== MultiTypeInputType.FIXED) {
                        formik.setFieldValue('filePathRegex', formik.values.filePath)
                      } else {
                        formik.setFieldValue('filePathRegex', '')
                      }
                    } else {
                      if (getMultiTypeFromValue(formik.values?.filePathRegex) !== MultiTypeInputType.FIXED) {
                        formik.setFieldValue('filePath', formik.values.filePathRegex)
                      } else {
                        formik.setFieldValue('filePath', '')
                      }
                    }
                  }}
                />
              </div>

              {formik.values?.tagType === 'value' ? (
                <div className={css.imagePathContainer}>
                  <FormInput.MultiTextInput
                    label={getString('common.git.filePath')}
                    name="filePath"
                    placeholder={getString('pipeline.manifestType.pathPlaceholder')}
                    multiTextInputProps={{
                      expressions,
                      allowableTypes
                    }}
                  />
                  {getMultiTypeFromValue(formik.values.filePath) === MultiTypeInputType.RUNTIME && (
                    <div className={css.configureOptions}>
                      <ConfigureOptions
                        style={{ alignSelf: 'center' }}
                        value={formik.values?.filePath as string}
                        type={getString('string')}
                        variableName="filePath"
                        showRequiredField={false}
                        showDefaultField={false}
                        showAdvanced={true}
                        onChange={value => {
                          formik.setFieldValue('filePath', value)
                        }}
                        isReadonly={isReadonly}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className={css.imagePathContainer}>
                  <FormInput.MultiTextInput
                    label={getString('pipeline.artifactsSelection.filePathRegexLabel')}
                    name="filePathRegex"
                    placeholder={getString('pipeline.artifactsSelection.filePathRegexPlaceholder')}
                    multiTextInputProps={{
                      expressions,
                      allowableTypes
                    }}
                  />
                  {getMultiTypeFromValue(formik.values.filePathRegex) === MultiTypeInputType.RUNTIME && (
                    <div className={css.configureOptions}>
                      <ConfigureOptions
                        style={{ alignSelf: 'center' }}
                        value={formik.values?.filePathRegex as string}
                        type={getString('string')}
                        variableName="filePathRegex"
                        showRequiredField={false}
                        showDefaultField={false}
                        showAdvanced={true}
                        onChange={value => {
                          formik.setFieldValue('filePathRegex', value)
                        }}
                        isReadonly={isReadonly}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            <Layout.Horizontal spacing="medium">
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
          </Form>
        )}
      </Formik>
    </Layout.Vertical>
  )
}
