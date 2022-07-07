/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useEffect } from 'react'
import {
  Formik,
  FormInput,
  getMultiTypeFromValue,
  Layout,
  MultiTypeInputType,
  Button,
  SelectOption,
  StepProps,
  Text,
  ButtonVariation
} from '@wings-software/uicore'
import { Form } from 'formik'
import { FontVariation } from '@harness/design-system'
import { useParams } from 'react-router-dom'
import * as Yup from 'yup'
import { defaultTo, get, merge } from 'lodash-es'
import { useListAwsRegions } from 'services/portal'
import { ConnectorConfigDTO, useGetBuildDetailsForEcr } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import type { GitQueryParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'

import { useQueryParams } from '@common/hooks'
import {
  checkIfQueryParamsisNotEmpty,
  getArtifactFormData,
  getConnectorIdValue,
  getFinalArtifactObj,
  resetTag,
  shouldFetchTags
} from '@pipeline/components/ArtifactsSelection/ArtifactUtils'
import type {
  ArtifactType,
  ImagePathProps,
  ImagePathTypes
} from '@pipeline/components/ArtifactsSelection/ArtifactInterface'
import { ArtifactIdentifierValidation, ModalViewFor } from '../../../ArtifactHelper'
import ArtifactImagePathTagView from '../ArtifactImagePathTagView/ArtifactImagePathTagView'
import SideCarArtifactIdentifier from '../SideCarArtifactIdentifier'
import css from '../../ArtifactConnector.module.scss'

export function ECRArtifact({
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
}: StepProps<ConnectorConfigDTO> & ImagePathProps<ImagePathTypes>): React.ReactElement {
  const { getString } = useStrings()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const [tagList, setTagList] = React.useState([])
  const [regions, setRegions] = React.useState<SelectOption[]>([])
  const [lastQueryData, setLastQueryData] = React.useState<{ imagePath: string; region: any }>({
    imagePath: '',
    region: ''
  })

  const schemaObject = {
    imagePath: Yup.string().trim().required(getString('pipeline.artifactsSelection.validation.imagePath')),
    region: Yup.mixed().required(getString('pipeline.artifactsSelection.validation.region')),
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

  const primarySchema = Yup.object().shape(schemaObject)
  const sideCarSchema = Yup.object().shape({
    ...schemaObject,
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
    data: ecrBuildData,
    loading: ecrBuildDetailsLoading,
    refetch: refetchECRBuilddata,
    error: ecrTagError
  } = useGetBuildDetailsForEcr({
    queryParams: {
      imagePath: lastQueryData.imagePath,
      connectorRef: getConnectorRefQueryData(),
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      region: defaultTo(lastQueryData.region.value, lastQueryData.region),
      repoIdentifier,
      branch
    },
    lazy: true
  })
  useEffect(() => {
    if (ecrTagError) {
      setTagList([])
    } else if (Array.isArray(ecrBuildData?.data?.buildDetailsList)) {
      setTagList(ecrBuildData?.data?.buildDetailsList as [])
    }
  }, [ecrBuildData, ecrTagError])

  useEffect(() => {
    if (checkIfQueryParamsisNotEmpty(Object.values(lastQueryData))) {
      refetchECRBuilddata()
    }
  }, [lastQueryData, prevStepData, refetchECRBuilddata])

  const { data } = useListAwsRegions({
    queryParams: {
      accountId
    }
  })
  useEffect(() => {
    const regionValues = defaultTo(data?.resource, []).map(region => ({
      value: region.value,
      label: region.name
    }))
    setRegions(regionValues as SelectOption[])
  }, [data?.resource])

  const fetchTags = (imagePath = '', region = ''): void => {
    if (canFetchTags(imagePath, region)) {
      setLastQueryData({ imagePath, region })
    }
  }
  const canFetchTags = useCallback(
    (imagePath: string, region: string): boolean =>
      !!(
        (lastQueryData.imagePath !== imagePath || lastQueryData.region !== region) &&
        shouldFetchTags(prevStepData, [imagePath, region])
      ),
    [lastQueryData, prevStepData]
  )

  const isTagDisabled = useCallback((formikValue): boolean => {
    return !checkIfQueryParamsisNotEmpty([formikValue.imagePath, formikValue.region])
  }, [])

  const getInitialValues = useCallback((): ImagePathTypes => {
    const values = getArtifactFormData(
      initialValues,
      selectedArtifact as ArtifactType,
      context === ModalViewFor.SIDECAR
    )
    const specValues = get(initialValues, 'spec', null)
    if (getMultiTypeFromValue(specValues?.region) === MultiTypeInputType.FIXED) {
      values.region = regions.find(regionData => regionData.value === specValues?.region)
    }
    return values
  }, [context, initialValues, regions, selectedArtifact])

  const submitFormData = (formData: ImagePathTypes & { connectorId?: string }): void => {
    const artifactObj = getFinalArtifactObj(formData, context === ModalViewFor.SIDECAR)
    merge(artifactObj.spec, { region: formData?.region?.value ? formData?.region?.value : formData?.region })
    handleSubmit(artifactObj)
  }

  return (
    <Layout.Vertical spacing="medium" className={css.firstep}>
      <Text font={{ variation: FontVariation.H3 }} margin={{ bottom: 'medium' }}>
        {getString('pipeline.artifactsSelection.artifactDetails')}
      </Text>
      <Formik
        initialValues={getInitialValues()}
        validationSchema={context === ModalViewFor.SIDECAR ? sideCarSchema : primarySchema}
        formName="ecrArtifact"
        onSubmit={formData => {
          submitFormData({
            ...prevStepData,
            ...formData,
            connectorId: getConnectorIdValue(prevStepData)
          })
        }}
        enableReinitialize={true}
      >
        {formik => (
          <Form>
            <div className={css.connectorForm}>
              {context === ModalViewFor.SIDECAR && <SideCarArtifactIdentifier />}
              <div className={css.imagePathContainer}>
                <FormInput.MultiTypeInput
                  name="region"
                  selectItems={regions}
                  multiTypeInputProps={{
                    onChange: () => {
                      tagList.length && setTagList([])
                      resetTag(formik)
                    },
                    selectProps: {
                      defaultSelectedItem: formik.values.region,
                      items: regions
                    }
                  }}
                  label={getString('regionLabel')}
                  placeholder={getString('select')}
                />

                {getMultiTypeFromValue(formik.values.region) === MultiTypeInputType.RUNTIME && (
                  <div className={css.configureOptions}>
                    <ConfigureOptions
                      style={{ alignSelf: 'center' }}
                      value={formik.values?.region as string}
                      type="String"
                      variableName="region"
                      showRequiredField={false}
                      showDefaultField={false}
                      showAdvanced={true}
                      onChange={value => {
                        formik.setFieldValue('region', value)
                      }}
                      isReadonly={isReadonly}
                    />
                  </div>
                )}
              </div>
              <ArtifactImagePathTagView
                selectedArtifact={selectedArtifact as ArtifactType}
                formik={formik}
                expressions={expressions}
                allowableTypes={allowableTypes}
                isReadonly={isReadonly}
                connectorIdValue={getConnectorIdValue(prevStepData)}
                fetchTags={imagePath => fetchTags(imagePath, formik.values?.region)}
                buildDetailsLoading={ecrBuildDetailsLoading}
                tagError={ecrTagError}
                tagList={tagList}
                setTagList={setTagList}
                tagDisabled={isTagDisabled(formik?.values)}
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
