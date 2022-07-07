/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useEffect, useState } from 'react'
import {
  Formik,
  FormInput,
  getMultiTypeFromValue,
  Layout,
  MultiTypeInputType,
  Button,
  StepProps,
  Text,
  ButtonVariation,
  SelectOption
} from '@wings-software/uicore'
import { FontVariation } from '@harness/design-system'
import { Form } from 'formik'
import * as Yup from 'yup'
import { defaultTo, merge } from 'lodash-es'
import { useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'
import type { GitQueryParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useQueryParams } from '@common/hooks'

import { ConnectorConfigDTO, DockerBuildDetailsDTO, useGetBuildDetailsForArtifactoryArtifact } from 'services/cd-ng'
import {
  checkIfQueryParamsisNotEmpty,
  getArtifactFormData,
  getConnectorIdValue,
  getFinalArtifactFormObj,
  repositoryFormat,
  resetTag,
  shouldFetchTags
} from '@pipeline/components/ArtifactsSelection/ArtifactUtils'
import { isServerlessDeploymentType } from '@pipeline/utils/stageHelpers'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import type {
  ArtifactType,
  ImagePathProps,
  ImagePathTypes
} from '@pipeline/components/ArtifactsSelection/ArtifactInterface'
import { ArtifactIdentifierValidation, ModalViewFor } from '../../../ArtifactHelper'
import ArtifactImagePathTagView from '../ArtifactImagePathTagView/ArtifactImagePathTagView'
import SideCarArtifactIdentifier from '../SideCarArtifactIdentifier'
import ServerlessArtifactoryRepository from './ServerlessArtifactoryRepository'
import css from '../../ArtifactConnector.module.scss'

const getRepositoryValue = (
  formData: ImagePathTypes & { connectorId?: string },
  isServerlessDeploymentTypeSelected = false
): string => {
  if (isServerlessDeploymentTypeSelected) {
    if ((formData?.repository as SelectOption)?.value) {
      return (formData?.repository as SelectOption)?.value as string
    }
  }
  return formData?.repository as string
}

function Artifactory({
  context,
  handleSubmit,
  expressions,
  allowableTypes,
  prevStepData,
  initialValues,
  previousStep,
  artifactIdentifiers,
  isReadonly = false,
  selectedArtifact,
  selectedDeploymentType
}: StepProps<ConnectorConfigDTO> & ImagePathProps<ImagePathTypes>): React.ReactElement {
  const { getString } = useStrings()
  const [lastQueryData, setLastQueryData] = useState({ artifactPath: '', repository: '' })

  const [tagList, setTagList] = useState<DockerBuildDetailsDTO[] | undefined>([])
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const isServerlessDeploymentTypeSelected = isServerlessDeploymentType(selectedDeploymentType)

  const schemaObject = {
    artifactPath: Yup.string().trim().required(getString('pipeline.artifactsSelection.validation.artifactPath')),
    repository: Yup.string().trim().required(getString('common.git.validation.repoRequired')),
    tagType: Yup.string().required(),
    tagRegex: Yup.string().when('tagType', {
      is: 'regex',
      then: Yup.string().trim().required(getString('pipeline.artifactsSelection.validation.tagRegex'))
    }),
    tag: Yup.mixed().when('tagType', {
      is: 'value',
      then: Yup.mixed().required(getString('pipeline.artifactsSelection.validation.tag'))
    })
  }

  const serverlessArtifactorySchema = {
    repository: Yup.string().trim().required(getString('common.git.validation.repoRequired')),
    artifactDirectory: Yup.string()
      .trim()
      .required(getString('pipeline.artifactsSelection.validation.artifactDirectory')),
    tagType: Yup.string().required(),
    tagRegex: Yup.string().when('tagType', {
      is: 'regex',
      then: Yup.string().trim().required(getString('pipeline.artifactsSelection.validation.artifactPathFilter'))
    }),
    tag: Yup.mixed().when('tagType', {
      is: 'value',
      then: Yup.mixed().required(getString('pipeline.artifactsSelection.validation.artifactPath'))
    })
  }

  const primarySchema = Yup.object().shape(schemaObject)

  const serverlessPrimarySchema = Yup.object().shape(serverlessArtifactorySchema)

  const sidecarSchema = Yup.object().shape({
    ...schemaObject,
    ...ArtifactIdentifierValidation(
      artifactIdentifiers,
      initialValues?.identifier,
      getString('pipeline.uniqueIdentifier')
    )
  })

  const serverlessSidecarSchema = Yup.object().shape({
    ...serverlessArtifactorySchema,
    ...ArtifactIdentifierValidation(
      artifactIdentifiers,
      initialValues?.identifier,
      getString('pipeline.uniqueIdentifier')
    )
  })

  const getConnectorRefQueryData = (): string => {
    return defaultTo(prevStepData?.connectorId?.value, prevStepData?.identifier)
  }

  const {
    data,
    loading: artifactoryBuildDetailsLoading,
    refetch: refetchArtifactoryTag,
    error: artifactoryTagError
  } = useGetBuildDetailsForArtifactoryArtifact({
    queryParams: {
      artifactPath: lastQueryData.artifactPath,
      repository: lastQueryData.repository,
      repositoryFormat: isServerlessDeploymentTypeSelected ? 'generic' : repositoryFormat,
      connectorRef: getConnectorRefQueryData(),
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      repoIdentifier,
      branch
    },
    lazy: true,
    debounce: 300
  })

  useEffect(() => {
    if (checkIfQueryParamsisNotEmpty(Object.values(lastQueryData))) {
      refetchArtifactoryTag()
    }
  }, [lastQueryData, refetchArtifactoryTag])
  useEffect(() => {
    if (artifactoryTagError) {
      setTagList([])
    } else if (Array.isArray(data?.data?.buildDetailsList)) {
      setTagList(data?.data?.buildDetailsList)
    }
  }, [data?.data?.buildDetailsList, artifactoryTagError])

  const canFetchTags = useCallback(
    (artifactPath: string, repository: string): boolean => {
      return !!(
        (lastQueryData.artifactPath !== artifactPath || lastQueryData.repository !== repository) &&
        shouldFetchTags(prevStepData, [artifactPath, repository])
      )
    },
    [lastQueryData, prevStepData]
  )
  const fetchTags = useCallback(
    (artifactPath = '', repository = ''): void => {
      if (canFetchTags(artifactPath, repository)) {
        setLastQueryData({ artifactPath, repository })
      }
    },
    [canFetchTags]
  )

  const isTagDisabled = useCallback((formikValue): boolean => {
    return !checkIfQueryParamsisNotEmpty([formikValue.artifactPath, formikValue.repository])
  }, [])

  const isArtifactPathDisabled = useCallback((formikValue): boolean => {
    return !checkIfQueryParamsisNotEmpty([formikValue.artifactDirectory, formikValue.repository])
  }, [])

  const getInitialValues = useCallback((): ImagePathTypes => {
    return getArtifactFormData(
      initialValues,
      selectedArtifact as ArtifactType,
      context === ModalViewFor.SIDECAR,
      isServerlessDeploymentTypeSelected
    )
  }, [context, initialValues, selectedArtifact])

  const submitFormData = (formData: ImagePathTypes & { connectorId?: string }): void => {
    const artifactObj = getFinalArtifactFormObj(
      formData,
      context === ModalViewFor.SIDECAR,
      isServerlessDeploymentTypeSelected
    )
    merge(artifactObj.spec, {
      repository: getRepositoryValue(formData, isServerlessDeploymentTypeSelected),
      repositoryUrl: formData?.repositoryUrl,
      repositoryFormat: isServerlessDeploymentTypeSelected ? 'generic' : repositoryFormat
    })
    handleSubmit(artifactObj)
  }

  const getValidationSchema = useCallback(() => {
    if (isServerlessDeploymentTypeSelected) {
      if (context === ModalViewFor.SIDECAR) {
        return serverlessSidecarSchema
      }
      return serverlessPrimarySchema
    }
    if (context === ModalViewFor.SIDECAR) {
      return sidecarSchema
    }
    return primarySchema
  }, [context, isServerlessDeploymentTypeSelected, primarySchema, serverlessPrimarySchema, sidecarSchema])

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
            tag: defaultTo(formData?.tag?.value, formData?.tag),
            connectorId: getConnectorIdValue(prevStepData)
          })
        }}
      >
        {formik => (
          <Form>
            <div className={css.connectorForm}>
              {context === ModalViewFor.SIDECAR && <SideCarArtifactIdentifier />}
              {!isServerlessDeploymentTypeSelected && (
                <div className={css.imagePathContainer}>
                  <FormInput.MultiTextInput
                    label={getString('repositoryUrlLabel')}
                    name="repositoryUrl"
                    isOptional
                    placeholder={getString('pipeline.repositoryUrlPlaceholder')}
                    multiTextInputProps={{
                      expressions,
                      allowableTypes
                    }}
                  />

                  {getMultiTypeFromValue(formik.values.repositoryUrl) === MultiTypeInputType.RUNTIME && (
                    <div className={css.configureOptions}>
                      <ConfigureOptions
                        style={{ alignSelf: 'center' }}
                        value={formik.values?.repositoryUrl as string}
                        type={getString('string')}
                        variableName="repositoryUrl"
                        showRequiredField={false}
                        showDefaultField={false}
                        showAdvanced={true}
                        onChange={value => {
                          formik.setFieldValue('repositoryUrl', value)
                        }}
                        isReadonly={isReadonly}
                      />
                    </div>
                  )}
                </div>
              )}

              {isServerlessDeploymentTypeSelected ? (
                <ServerlessArtifactoryRepository
                  connectorRef={
                    getMultiTypeFromValue(prevStepData?.connectorId) === MultiTypeInputType.RUNTIME
                      ? prevStepData?.connectorId
                      : prevStepData?.connectorId?.value
                      ? prevStepData.connectorId.value
                      : prevStepData?.connectorId
                  }
                  isReadonly={isReadonly}
                  expressions={expressions}
                  allowableTypes={allowableTypes}
                  formik={formik}
                  fieldName={'repository'}
                />
              ) : (
                <div className={css.imagePathContainer}>
                  <FormInput.MultiTextInput
                    label={getString('repository')}
                    name="repository"
                    placeholder={getString('pipeline.artifactsSelection.repositoryPlaceholder')}
                    multiTextInputProps={{
                      expressions,
                      allowableTypes
                    }}
                    onChange={() => {
                      tagList?.length && setTagList([])
                      resetTag(formik)
                    }}
                  />

                  {getMultiTypeFromValue(formik.values.repository) === MultiTypeInputType.RUNTIME && (
                    <div className={css.configureOptions}>
                      <ConfigureOptions
                        style={{ alignSelf: 'center' }}
                        value={formik.values?.repository as string}
                        type={getString('string')}
                        variableName="repository"
                        showRequiredField={false}
                        showDefaultField={false}
                        showAdvanced={true}
                        onChange={value => {
                          formik.setFieldValue('repository', value)
                        }}
                        isReadonly={isReadonly}
                      />
                    </div>
                  )}
                </div>
              )}

              {isServerlessDeploymentTypeSelected && (
                <div className={css.imagePathContainer}>
                  <FormInput.MultiTextInput
                    label={getString('pipeline.artifactsSelection.artifactDirectory')}
                    name="artifactDirectory"
                    placeholder={getString('pipeline.artifactsSelection.artifactDirectoryPlaceholder')}
                    multiTextInputProps={{
                      expressions,
                      allowableTypes
                    }}
                    onChange={() => {
                      resetTag(formik)
                    }}
                  />

                  {getMultiTypeFromValue(formik.values.repository) === MultiTypeInputType.RUNTIME && (
                    <div className={css.configureOptions}>
                      <ConfigureOptions
                        style={{ alignSelf: 'center' }}
                        value={formik.values?.repository as string}
                        type={getString('string')}
                        variableName="artifactDirectory"
                        showRequiredField={false}
                        showDefaultField={false}
                        showAdvanced={true}
                        onChange={value => {
                          formik.setFieldValue('artifactDirectory', value)
                        }}
                        isReadonly={isReadonly}
                      />
                    </div>
                  )}
                </div>
              )}

              <ArtifactImagePathTagView
                selectedArtifact={selectedArtifact as ArtifactType}
                formik={formik}
                expressions={expressions}
                allowableTypes={allowableTypes}
                isReadonly={isReadonly}
                connectorIdValue={getConnectorIdValue(prevStepData)}
                fetchTags={artifactPath => {
                  fetchTags(artifactPath, formik?.values?.repository)
                }}
                buildDetailsLoading={artifactoryBuildDetailsLoading}
                tagError={artifactoryTagError}
                tagList={tagList}
                setTagList={setTagList}
                tagDisabled={
                  isServerlessDeploymentTypeSelected
                    ? isArtifactPathDisabled(formik?.values)
                    : isTagDisabled(formik?.values)
                }
                isArtifactPath={true}
                isServerlessDeploymentTypeSelected={isServerlessDeploymentTypeSelected}
              />
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
export default Artifactory
