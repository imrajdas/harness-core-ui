/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Layout,
  Button,
  Text,
  Formik,
  StepProps,
  getMultiTypeFromValue,
  MultiTypeInputType,
  ThumbnailSelect,
  IconName,
  ButtonVariation,
  FormikForm,
  ButtonSize
} from '@wings-software/uicore'
import * as Yup from 'yup'
import { FontVariation } from '@harness/design-system'
import { get, isEmpty } from 'lodash-es'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import { useStrings } from 'framework/strings'
import type { ConnectorConfigDTO } from 'services/cd-ng'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'

import type { GitQueryParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useQueryParams } from '@common/hooks'
import type { ConnectorSelectedValue } from '@connectors/components/ConnectorReferenceField/ConnectorReferenceField'
import { usePermission } from '@rbac/hooks/usePermission'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ManifestToConnectorMap } from '../../Manifesthelper'
import type { ManifestStores, ManifestStepInitData } from '../../ManifestInterface'
import {
  ReleaseRepoManifestStoreMap,
  releaseRepoManifestStoreTypes,
  ReleaseRepoManifestToConnectorMap,
  RepoStoreIcons
} from '../ReleaseRepoInterface'

import css from '../../ManifestWizardSteps/ManifestWizardSteps.module.scss'

interface ReleaseRepoStorePropType {
  stepName: string
  expressions?: string[]
  allowableTypes: MultiTypeInputType[]
  isReadonly: boolean
  initialValues?: any
  handleConnectorViewChange: () => void
  handleStoreChange: (store: ManifestStores) => void
  selectedManifest?: any
}

function RepoStore({
  stepName,
  isReadonly,
  initialValues,
  expressions,
  prevStepData,
  nextStep,
  handleStoreChange,
  handleConnectorViewChange,
  selectedManifest,
  allowableTypes
}: StepProps<ConnectorConfigDTO> & ReleaseRepoStorePropType): React.ReactElement {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const { getString } = useStrings()
  const [isLoadingConnectors, setIsLoadingConnectors] = React.useState<boolean>(true)
  const initStore = get(initialValues, 'store', 'Git')
  const [selectedStore, setSelectedStore] = useState(initStore)
  const [canCreate] = usePermission({
    resource: {
      resourceType: ResourceType.CONNECTOR
    },
    permissions: [PermissionIdentifier.UPDATE_CONNECTOR]
  })

  const submitFirstStep = async (formData: ManifestStepInitData): Promise<void> => {
    nextStep?.({ ...formData })
  }

  function shouldGotoNextStep(connectorRefValue: ConnectorSelectedValue | string): boolean {
    if (selectedManifest) {
      return true
    }
    return (
      !isLoadingConnectors &&
      !!selectedStore &&
      ((getMultiTypeFromValue(connectorRefValue) === MultiTypeInputType.FIXED &&
        !isEmpty(get(connectorRefValue as ConnectorSelectedValue, 'connector', null))) ||
        !isEmpty(connectorRefValue))
    )
  }
  /* istanbul ignore next */
  const handleOptionSelection = (storeSelected: any): void => {
    /* istanbul ignore next */
    handleStoreChange(storeSelected)
    setSelectedStore(storeSelected)
  }

  const supportedManifestTypes = useMemo(
    () =>
      releaseRepoManifestStoreTypes.map(manifest => ({
        label: manifest,
        icon: RepoStoreIcons[manifest] as IconName,
        value: manifest
      })),
    []
  )

  const newConnectorLabel = `${getString('newLabel')} ${selectedStore} ${getString('connector')}`
  return (
    <Layout.Vertical height={'inherit'} spacing="medium" className={css.optionsViewContainer}>
      <Text font={{ variation: FontVariation.H3 }} margin={{ bottom: 'medium' }}>
        {stepName}
      </Text>

      <Formik
        initialValues={initialValues}
        formName="manifestStore"
        validationSchema={Yup.object().shape({
          connectorRef: Yup.string().required(
            `${ManifestToConnectorMap[selectedStore]} ${getString('pipelineSteps.build.create.connectorRequiredError')}`
          )
        })}
        onSubmit={formData => {
          submitFirstStep({ ...formData })
        }}
        enableReinitialize={true}
      >
        {formik => (
          <FormikForm>
            <Layout.Vertical
              flex={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
              className={css.manifestForm}
            >
              <Layout.Vertical>
                <Layout.Horizontal spacing="large">
                  <ThumbnailSelect
                    className={css.thumbnailSelect}
                    name={'store'}
                    items={supportedManifestTypes}
                    isReadonly={isReadonly}
                    onChange={
                      /* istanbul ignore next */
                      storeSelected => {
                        /* istanbul ignore next */
                        handleOptionSelection(storeSelected)
                      }
                    }
                  />
                </Layout.Horizontal>

                {!isEmpty(formik.values.store) ? (
                  <Layout.Horizontal
                    spacing={'medium'}
                    flex={{ alignItems: 'flex-start', justifyContent: 'flex-start' }}
                    className={css.connectorContainer}
                  >
                    <FormMultiTypeConnectorField
                      key={formik.values.store}
                      onLoadingFinish={() => {
                        setIsLoadingConnectors(false)
                      }}
                      name="connectorRef"
                      label={`${ReleaseRepoManifestStoreMap[formik.values.store] as string} ${getString('connector')}`}
                      placeholder={`${ReleaseRepoManifestStoreMap[formik.values.store] as string} ${getString(
                        'connector'
                      )}`}
                      accountIdentifier={accountId}
                      projectIdentifier={projectIdentifier}
                      orgIdentifier={orgIdentifier}
                      width={400}
                      multiTypeProps={{
                        expressions,
                        allowableTypes
                      }}
                      isNewConnectorLabelVisible={
                        !(
                          getMultiTypeFromValue(formik.values.connectorRef) === MultiTypeInputType.RUNTIME &&
                          (isReadonly || !canCreate)
                        )
                      }
                      createNewLabel={newConnectorLabel}
                      type={ReleaseRepoManifestToConnectorMap[formik.values.store]}
                      enableConfigureOptions={false}
                      gitScope={{ repo: repoIdentifier || '', branch, getDefaultFromOtherRepo: true }}
                    />
                    {/*istanbul ignore next */}
                    {getMultiTypeFromValue(formik.values.connectorRef) === MultiTypeInputType.RUNTIME ? (
                      <ConfigureOptions
                        className={css.configureOptions}
                        value={formik.values.connectorRef as unknown as string}
                        type={ReleaseRepoManifestToConnectorMap[formik.values.store]}
                        variableName="connectorRef"
                        showRequiredField={false}
                        showDefaultField={false}
                        showAdvanced={true}
                        onChange={
                          /*istanbul ignore next */
                          value => {
                            /*istanbul ignore next */
                            formik.setFieldValue('connectorRef', value)
                          }
                        }
                        isReadonly={isReadonly}
                      />
                    ) : (
                      <Button
                        variation={ButtonVariation.LINK}
                        size={ButtonSize.SMALL}
                        disabled={isReadonly || !canCreate}
                        id="new-releaserepo-connector"
                        text={newConnectorLabel}
                        className={css.addNewManifest}
                        icon="plus"
                        iconProps={{ size: 12 }}
                        onClick={
                          /*istanbul ignore next */
                          () => {
                            /*istanbul ignore next */
                            handleConnectorViewChange()
                            nextStep?.({ ...prevStepData, store: selectedStore })
                          }
                        }
                      />
                    )}
                  </Layout.Horizontal>
                ) : null}
              </Layout.Vertical>

              <Layout.Horizontal spacing="medium" className={css.saveBtn}>
                <Button
                  variation={ButtonVariation.PRIMARY}
                  type="submit"
                  text={getString('continue')}
                  rightIcon="chevron-right"
                  disabled={!shouldGotoNextStep(formik.values.connectorRef as ConnectorSelectedValue | string)}
                />
              </Layout.Horizontal>
            </Layout.Vertical>
          </FormikForm>
        )}
      </Formik>
    </Layout.Vertical>
  )
}

export default RepoStore
