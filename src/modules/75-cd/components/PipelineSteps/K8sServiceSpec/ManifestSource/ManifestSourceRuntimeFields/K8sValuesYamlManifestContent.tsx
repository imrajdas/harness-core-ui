/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'
import { Layout } from '@harness/uicore'
import { get } from 'lodash-es'
import { StringKeys, useStrings } from 'framework/strings'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { FormMultiTypeCheckboxField } from '@common/components'
import List from '@common/components/List/List'
import type { ManifestSourceRenderProps } from '@cd/factory/ManifestSourceFactory/ManifestSourceBase'
import { FileSelectList } from '@filestore/components/FileStoreList/FileStoreList'
import { SELECT_FILES_TYPE } from '@filestore/utils/constants'
import { ManifestStoreMap } from '@pipeline/components/ManifestSelection/Manifesthelper'
import { isFieldRuntime } from '../../K8sServiceSpecHelper'
import { isFieldfromTriggerTabDisabled } from '../ManifestSourceUtils'
import ManifestGitStoreRuntimeFields from './ManifestGitStoreRuntimeFields'
import CustomRemoteManifestRuntimeFields from './CustomRemoteManifestRuntimeFields'
import ManifestCommonRuntimeFields from './ManifestCommonRuntimeFields'
import css from '../../KubernetesManifests/KubernetesManifests.module.scss'

interface K8sValuesYamlManifestRenderProps extends ManifestSourceRenderProps {
  pathFieldlabel: StringKeys
}
const K8sValuesYamlManifestContent = (props: K8sValuesYamlManifestRenderProps): React.ReactElement => {
  const {
    template,
    path,
    manifestPath,
    manifest,
    fromTrigger,
    allowableTypes,
    readonly,
    formik,
    stageIdentifier,
    pathFieldlabel
  } = props
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const manifestStoreType = get(template, `${manifestPath}.spec.store.type`, null)
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
  return (
    <Layout.Vertical
      data-name="manifest"
      key={manifest?.identifier}
      className={cx(css.inputWidth, css.layoutVerticalSpacing)}
    >
      <ManifestGitStoreRuntimeFields {...props} />
      <ManifestCommonRuntimeFields {...props} />
      <CustomRemoteManifestRuntimeFields {...props} />
      {isFieldRuntime(`${manifestPath}.spec.store.spec.paths`, template) && (
        <div className={css.verticalSpacingInput}>
          <List
            labelClassName={css.listLabel}
            label={getString(pathFieldlabel)}
            name={`${path}.${manifestPath}.spec.store.spec.paths`}
            placeholder={getString('pipeline.manifestType.pathPlaceholder')}
            disabled={isFieldDisabled(`${manifestPath}.spec.store.spec.paths`)}
            style={{ marginBottom: 'var(--spacing-small)' }}
            expressions={expressions}
            isNameOfArrayType
          />
        </div>
      )}

      {isFieldRuntime(`${manifestPath}.spec.valuesPaths`, template) && (
        <div className={css.verticalSpacingInput}>
          {manifestStoreType === ManifestStoreMap.Harness ? (
            <FileSelectList
              labelClassName={css.listLabel}
              label={getString('pipeline.manifestType.valuesYamlPath')}
              name={`${path}.${manifestPath}.spec.valuesPaths`}
              placeholder={getString('pipeline.manifestType.manifestPathPlaceholder')}
              disabled={isFieldDisabled(`${manifestPath}.spec.valuesPaths`)}
              style={{ marginBottom: 'var(--spacing-small)' }}
              expressions={expressions}
              isNameOfArrayType
              type={SELECT_FILES_TYPE.FILE_STORE}
              formik={formik}
            />
          ) : (
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
          )}
        </div>
      )}

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
    </Layout.Vertical>
  )
}

export default K8sValuesYamlManifestContent
