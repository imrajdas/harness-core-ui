/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import cx from 'classnames'
import { FormInput, Layout, MultiTypeInputType } from '@harness/uicore'
import { defaultTo, get } from 'lodash-es'
import {
  ManifestDataType,
  ManifestStoreMap,
  ManifestToConnectorMap
} from '@pipeline/components/ManifestSelection/Manifesthelper'
import { ManifestSourceBase, ManifestSourceRenderProps } from '@cd/factory/ManifestSourceFactory/ManifestSourceBase'
import { useStrings } from 'framework/strings'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { FormMultiTypeCheckboxField } from '@common/components'
import List from '@common/components/List/List'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import { useListAwsRegions } from 'services/portal'
import { GitConfigDTO, useGetBucketListForS3, useGetGCSBucketList } from 'services/cd-ng'
import { TriggerDefaultFieldList } from '@triggers/pages/triggers/utils/TriggersWizardPageUtils'
import type { Scope } from '@common/interfaces/SecretsInterface'
import type { CommandFlags } from '@pipeline/components/ManifestSelection/ManifestInterface'
import {
  getDefaultQueryParam,
  getFinalQueryParamData,
  getFqnPath,
  isFieldfromTriggerTabDisabled,
  isNewServiceEntity,
  shouldDisplayRepositoryName
} from '../ManifestSourceUtils'
import { isFieldFixedType, isFieldRuntime } from '../../K8sServiceSpecHelper'
import ExperimentalInput from '../../K8sServiceSpecForms/ExperimentalInput'
import CustomRemoteManifestRuntimeFields from '../ManifestSourceRuntimeFields/CustomRemoteManifestRuntimeFields'
import css from '../../KubernetesManifests/KubernetesManifests.module.scss'

const Content = (props: ManifestSourceRenderProps): React.ReactElement => {
  const {
    initialValues,
    template,
    path,
    manifestPath,
    manifest,
    fromTrigger,
    allowableTypes,
    readonly,
    formik,
    accountId,
    projectIdentifier,
    orgIdentifier,
    repoIdentifier,
    branch,
    stageIdentifier,
    serviceIdentifier
  } = props
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const [showRepoName, setShowRepoName] = useState(true)

  const { data: regionData } = useListAwsRegions({
    queryParams: {
      accountId
    }
  })

  const commonQueryParam = {
    accountIdentifier: accountId,
    orgIdentifier,
    projectIdentifier,
    connectorRef: getFinalQueryParamData(
      getDefaultQueryParam(
        manifest?.spec?.store?.spec.connectorRef,
        get(initialValues, `${manifestPath}.spec.store.spec.connectorRef`, '')
      )
    ),
    serviceId: isNewServiceEntity(path as string) ? serviceIdentifier : undefined,
    fqnPath: isNewServiceEntity(path as string) ? getFqnPath(stageIdentifier, manifestPath as string) : undefined
  }

  const {
    data: s3BucketList,
    loading: s3bucketdataLoading,
    refetch: refetchS3Buckets
  } = useGetBucketListForS3({
    queryParams: {
      ...commonQueryParam,
      region: getFinalQueryParamData(
        getDefaultQueryParam(
          manifest?.spec?.store?.spec.region,
          get(initialValues, `${manifestPath}.spec.store.spec.region`, '')
        )
      )
    },
    lazy: true
  })

  const regions = (regionData?.resource || []).map((region: any) => ({
    value: region.value,
    label: region.name
  }))

  const s3BucketOptions = Object.keys(s3BucketList || {}).map(item => ({
    label: item,
    value: item
  }))

  /*-------------------------Gcs Store related code --------------------------*/
  const {
    data: gcsBucketData,
    loading: gcsBucketLoading,
    refetch: refetchGcsBucket
  } = useGetGCSBucketList({
    queryParams: commonQueryParam,
    lazy: true
  })

  const bucketOptions = Object.keys(gcsBucketData?.data || {}).map(item => ({
    label: item,
    value: item
  }))
  /*-------------------------Gcs Store related code --------------------------*/

  const isFieldDisabled = (fieldName: string): boolean => {
    // /* instanbul ignore else */
    if (readonly) {
      return true
    }
    return isFieldfromTriggerTabDisabled(
      fieldName,
      formik,
      stageIdentifier,
      manifest?.identifier as string,
      fromTrigger
    )
  }

  const renderBucketListforS3Gcs = (): React.ReactElement | null => {
    const manifestStoreType = get(template, `${manifestPath}.spec.store.type`, null)
    if (manifestStoreType === ManifestStoreMap.S3) {
      return (
        <ExperimentalInput
          name={`${path}.${manifestPath}.spec.store.spec.bucketName`}
          disabled={isFieldDisabled(`${manifestPath}.spec.store.spec.bucketName`)}
          formik={formik}
          label={getString('pipeline.manifestType.bucketName')}
          placeholder={getString('pipeline.manifestType.bucketNamePlaceholder')}
          multiTypeInputProps={{
            onFocus: () => {
              if (
                !s3BucketList?.data &&
                getDefaultQueryParam(
                  manifest?.spec?.spec.connectorRef,
                  get(initialValues, `${manifestPath}.spec.store.spec.connectorRef`, '')
                ) &&
                getDefaultQueryParam(
                  manifest?.spec?.store?.spec.region,
                  get(initialValues, `${manifestPath}.spec.store.spec.region`, '')
                )
              ) {
                refetchS3Buckets()
              }
            },
            selectProps: {
              usePortal: true,
              addClearBtn: !readonly,
              items: s3bucketdataLoading
                ? [{ label: 'Loading Buckets...', value: 'Loading Buckets...' }]
                : s3BucketOptions,

              allowCreatingNewItems: true
            },
            expressions,
            allowableTypes
          }}
          useValue
          selectItems={s3BucketOptions}
        />
      )
    } else if (manifestStoreType === ManifestStoreMap.Gcs) {
      return (
        <ExperimentalInput
          name={`${path}.${manifestPath}.spec.store.spec.bucketName`}
          disabled={isFieldDisabled(`${manifestPath}.spec.store.spec.bucketName`)}
          formik={formik}
          label={getString('pipeline.manifestType.bucketName')}
          placeholder={getString('pipeline.manifestType.bucketNamePlaceholder')}
          multiTypeInputProps={{
            onFocus: () => {
              if (
                !gcsBucketData?.data &&
                getDefaultQueryParam(
                  manifest?.spec?.store.spec.connectorRef,
                  get(initialValues, `${manifestPath}.spec.store.spec.connectorRef`, '')
                )
              ) {
                refetchGcsBucket()
              }
            },
            selectProps: {
              usePortal: true,
              addClearBtn: !readonly,
              items: gcsBucketLoading ? [{ label: 'Loading Buckets...', value: 'Loading Buckets...' }] : bucketOptions,

              allowCreatingNewItems: true
            },
            expressions,
            allowableTypes
          }}
          useValue
          selectItems={bucketOptions}
        />
      )
    }
    return null
  }

  const renderCommandFlags = (commandFlagPath: string): React.ReactElement => {
    const commandFlags = get(template, commandFlagPath)

    return commandFlags?.map((helmCommandFlag: CommandFlags, helmFlagIdx: number) => {
      if (isFieldRuntime(`${manifestPath}.spec.commandFlags[${helmFlagIdx}].flag`, template)) {
        return (
          <div className={css.verticalSpacingInput}>
            <FormInput.MultiTextInput
              disabled={isFieldDisabled(`${manifestPath}.spec.commandFlags[${helmFlagIdx}].flag`)}
              name={`${path}.${manifestPath}.spec.commandFlags[${helmFlagIdx}].flag`}
              multiTextInputProps={{
                expressions,
                allowableTypes
              }}
              label={`${helmCommandFlag.commandType}: ${getString('flag')}`}
            />
          </div>
        )
      }
    })
  }

  // this OR condition is for OCI helm connector
  const connectorRefPath =
    manifest?.spec?.store?.type === 'OciHelmChart'
      ? `${manifestPath}.spec.store.spec.config.spec.connectorRef`
      : `${manifestPath}.spec.store.spec.connectorRef`

  return (
    <Layout.Vertical
      data-name="manifest"
      key={manifest?.identifier}
      className={cx(css.inputWidth, css.layoutVerticalSpacing)}
    >
      {isFieldRuntime(connectorRefPath, template) && (
        <div data-name="connectorRefContainer" className={css.verticalSpacingInput}>
          <FormMultiTypeConnectorField
            disabled={isFieldDisabled(connectorRefPath)}
            name={`${path}.${connectorRefPath}`}
            selected={get(initialValues, connectorRefPath, '')}
            label={getString('connector')}
            placeholder={''}
            setRefValue
            multiTypeProps={{
              allowableTypes,
              expressions
            }}
            width={391}
            accountIdentifier={accountId}
            projectIdentifier={projectIdentifier}
            orgIdentifier={orgIdentifier}
            type={ManifestToConnectorMap[defaultTo(manifest?.spec?.store?.type, '')]}
            onChange={(selected, _itemType, multiType) => {
              const item = selected as unknown as { record?: GitConfigDTO; scope: Scope }
              if (multiType === MultiTypeInputType.FIXED) {
                if (shouldDisplayRepositoryName(item)) {
                  setShowRepoName(false)
                } else {
                  setShowRepoName(true)
                }
              }
            }}
            gitScope={{
              repo: defaultTo(repoIdentifier, ''),
              branch: defaultTo(branch, ''),
              getDefaultFromOtherRepo: true
            }}
          />
        </div>
      )}

      {isFieldRuntime(`${manifestPath}.spec.store.spec.repoName`, template) && showRepoName && (
        <div className={css.verticalSpacingInput}>
          <FormInput.MultiTextInput
            disabled={isFieldDisabled(`${manifestPath}.spec.store.spec.repoName`)}
            name={`${path}.${manifestPath}.spec.store.spec.repoName`}
            multiTextInputProps={{
              expressions,
              allowableTypes
            }}
            label={getString('common.repositoryName')}
          />
        </div>
      )}

      {isFieldRuntime(`${manifestPath}.spec.store.spec.branch`, template) && (
        <div className={css.verticalSpacingInput}>
          <FormInput.MultiTextInput
            disabled={isFieldDisabled(`${manifestPath}.spec.store.spec.branch`)}
            name={`${path}.${manifestPath}.spec.store.spec.branch`}
            multiTextInputProps={{
              expressions,
              allowableTypes
            }}
            label={getString('pipelineSteps.deploy.inputSet.branch')}
          />
        </div>
      )}
      {isFieldRuntime(`${manifestPath}.spec.store.spec.commitId`, template) && (
        <div className={css.verticalSpacingInput}>
          <FormInput.MultiTextInput
            disabled={isFieldDisabled(`${manifestPath}.spec.store.spec.commitId`)}
            name={`${path}.${manifestPath}.spec.store.spec.commitId`}
            multiTextInputProps={{
              expressions,
              allowableTypes
            }}
            label={getString('pipelineSteps.commitIdValue')}
          />
        </div>
      )}

      {isFieldRuntime(`${manifestPath}.spec.store.spec.region`, template) && (
        <div className={css.verticalSpacingInput}>
          <ExperimentalInput
            formik={formik}
            name={`${path}.${manifestPath}.spec.store.spec.region`}
            disabled={isFieldDisabled(`${manifestPath}.spec.store.spec.region`)}
            multiTypeInputProps={{
              selectProps: {
                usePortal: true,
                addClearBtn: !readonly,
                items: regions
              },
              expressions,
              allowableTypes
            }}
            useValue
            selectItems={regions}
            label={getString('regionLabel')}
          />
        </div>
      )}
      {isFieldFixedType(`${manifestPath}.spec.store.spec.connectorRef`, initialValues) &&
      isFieldFixedType(`${manifestPath}.spec.store.spec.region`, initialValues) ? (
        <div className={css.verticalSpacingInput}>{renderBucketListforS3Gcs()}</div>
      ) : (
        <div className={css.verticalSpacingInput}>
          <FormInput.MultiTextInput
            disabled={isFieldDisabled(`${manifestPath}.spec.store.spec.bucketName`)}
            name={`${path}.${manifestPath}.spec.store.spec.bucketName`}
            multiTextInputProps={{
              expressions,
              allowableTypes
            }}
            label={getString('pipeline.manifestType.bucketName')}
            placeholder={getString('pipeline.manifestType.bucketNamePlaceholder')}
          />
        </div>
      )}

      {isFieldRuntime(`${manifestPath}.spec.store.spec.basePath`, template) && (
        <div className={css.verticalSpacingInput}>
          <FormInput.MultiTextInput
            disabled={isFieldDisabled(`${manifestPath}.spec.store.spec.basePath`)}
            name={`${path}.${manifestPath}.spec.store.spec.basePath`}
            multiTextInputProps={{
              expressions,
              allowableTypes
            }}
            label={getString('pipeline.manifestType.basePath')}
          />
        </div>
      )}

      {isFieldRuntime(`${manifestPath}.spec.chartName`, template) && (
        <div className={css.verticalSpacingInput}>
          <FormInput.MultiTextInput
            disabled={isFieldDisabled(`${manifestPath}.spec.chartName`)}
            name={`${path}.${manifestPath}.spec.chartName`}
            multiTextInputProps={{
              expressions,
              allowableTypes
            }}
            label={getString('pipeline.manifestType.http.chartName')}
          />
        </div>
      )}

      {isFieldRuntime(`${manifestPath}.spec.store.spec.folderPath`, template) && (
        <div className={css.verticalSpacingInput}>
          <FormInput.MultiTextInput
            disabled={isFieldDisabled(`${manifestPath}.spec.store.spec.folderPath`)}
            name={`${path}.${manifestPath}.spec.store.spec.folderPath`}
            multiTextInputProps={{
              expressions,
              allowableTypes
            }}
            label={getString('chartPath')}
          />
        </div>
      )}

      {isFieldRuntime(`${manifestPath}.spec.chartVersion`, template) && (
        <div className={css.verticalSpacingInput}>
          <FormInput.MultiTextInput
            disabled={isFieldDisabled(fromTrigger ? 'chartVersion' : `${manifestPath}.spec.chartVersion`)}
            name={`${path}.${manifestPath}.spec.chartVersion`}
            multiTextInputProps={{
              ...(fromTrigger && { value: TriggerDefaultFieldList.chartVersion }),
              expressions,
              allowableTypes
            }}
            label={getString('pipeline.manifestType.http.chartVersion')}
          />
        </div>
      )}

      {isFieldRuntime(`${manifestPath}.spec.valuesPaths`, template) && (
        <div className={css.verticalSpacingInput}>
          <List
            labelClassName={css.listLabel}
            label={getString('pipeline.manifestType.valuesYamlPath')}
            name={`${path}.${manifestPath}.spec.valuesPaths`}
            placeholder={getString('pipeline.manifestType.manifestPathPlaceholder')}
            disabled={isFieldDisabled(`${manifestPath}.spec.valuesPaths`)}
            style={{ marginBottom: 'var(--spacing-small)' }}
            expressions={expressions}
            isNameOfArrayType
          />
        </div>
      )}
      <CustomRemoteManifestRuntimeFields {...props} />

      {isFieldRuntime(`${manifestPath}.spec.skipResourceVersioning`, template) && (
        <div className={css.verticalSpacingInput}>
          <FormMultiTypeCheckboxField
            disabled={isFieldDisabled(`${manifestPath}.spec.skipResourceVersioning`)}
            name={`${path}.${manifestPath}.spec.skipResourceVersioning`}
            label={getString('skipResourceVersion')}
            setToFalseWhenEmpty={true}
            multiTypeTextbox={{
              expressions,
              allowableTypes
            }}
          />
        </div>
      )}

      {renderCommandFlags(`${manifestPath}.spec.commandFlags`)}
    </Layout.Vertical>
  )
}

export class HelmChartManifestSource extends ManifestSourceBase<ManifestSourceRenderProps> {
  protected manifestType = ManifestDataType.HelmChart

  renderContent(props: ManifestSourceRenderProps): JSX.Element | null {
    if (!props.isManifestsRuntime) {
      return null
    }

    return <Content {...props} />
  }
}
