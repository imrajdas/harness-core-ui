/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  Formik,
  Layout,
  Button,
  StepProps,
  Text,
  ButtonVariation,
  FormInput,
  getMultiTypeFromValue,
  MultiTypeInputType
} from '@harness/uicore'
import { Form } from 'formik'
import * as Yup from 'yup'
import { FontVariation } from '@harness/design-system'
import { merge } from 'lodash-es'
import { useStrings } from 'framework/strings'

import type {
  ArtifactType,
  ImagePathProps,
  CustomArtifactSource,
  ImagePathTypes
} from '@pipeline/components/ArtifactsSelection/ArtifactInterface'
import type { ConnectorConfigDTO } from 'services/cd-ng'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import { getArtifactFormData } from '@pipeline/components/ArtifactsSelection/ArtifactUtils'
import { ArtifactIdentifierValidation, ModalViewFor } from '../../../ArtifactHelper'
import SideCarArtifactIdentifier from '../SideCarArtifactIdentifier'
import css from '../../ArtifactConnector.module.scss'

export function CustomArtifact({
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

  const schemaObject = {
    version: Yup.string().trim().required(getString('validation.nexusVersion'))
  }

  const primarySchema = Yup.object().shape(schemaObject)
  const sidecarSchema = Yup.object().shape({
    ...schemaObject,
    ...ArtifactIdentifierValidation(
      artifactIdentifiers,
      initialValues?.identifier,
      getString('pipeline.uniqueIdentifier')
    )
  })

  const getInitialValues = (): CustomArtifactSource => {
    return getArtifactFormData(
      initialValues,
      selectedArtifact as ArtifactType,
      context === ModalViewFor.SIDECAR
    ) as CustomArtifactSource
  }
  const submitFormData = (formData: CustomArtifactSource & { connectorId?: string }): void => {
    const artifactObj = {
      spec: {
        version: formData?.version
      }
    }
    if (context === ModalViewFor.SIDECAR) {
      merge(artifactObj, { identifier: formData?.identifier })
    }
    handleSubmit(artifactObj)
  }

  return (
    <Layout.Vertical spacing="medium" className={css.firstep}>
      <Text font={{ variation: FontVariation.H3 }} margin={{ bottom: 'medium' }}>
        {getString('pipeline.artifactsSelection.artifactDetails')}
      </Text>
      <Formik
        initialValues={getInitialValues()}
        formName="imagePath"
        validationSchema={context === ModalViewFor.SIDECAR ? sidecarSchema : primarySchema}
        onSubmit={formData => {
          submitFormData({
            ...prevStepData,
            ...formData
          })
        }}
      >
        {formik => (
          <Form>
            <div className={css.connectorForm}>
              {context === ModalViewFor.SIDECAR && <SideCarArtifactIdentifier />}

              <div className={css.imagePathContainer}>
                <FormInput.MultiTextInput
                  label={getString('version')}
                  name="version"
                  placeholder={getString('pipeline.artifactsSelection.versionPlaceholder')}
                  multiTextInputProps={{
                    expressions,
                    allowableTypes
                  }}
                />

                {getMultiTypeFromValue(formik.values.version) === MultiTypeInputType.RUNTIME && (
                  <div className={css.configureOptions}>
                    <ConfigureOptions
                      style={{ alignSelf: 'center' }}
                      value={formik.values?.version as string}
                      type={getString('string')}
                      variableName="version"
                      showRequiredField={false}
                      showDefaultField={false}
                      showAdvanced={true}
                      onChange={value => {
                        formik.setFieldValue('version', value)
                      }}
                      isReadonly={isReadonly}
                    />
                  </div>
                )}
              </div>
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
