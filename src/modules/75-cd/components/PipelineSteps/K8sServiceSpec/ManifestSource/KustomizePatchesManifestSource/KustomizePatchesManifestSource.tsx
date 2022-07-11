/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'
import { Layout } from '@harness/uicore'
import { ManifestDataType } from '@pipeline/components/ManifestSelection/Manifesthelper'
import { ManifestSourceBase, ManifestSourceRenderProps } from '@cd/factory/ManifestSourceFactory/ManifestSourceBase'
import { useStrings } from 'framework/strings'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import List from '@common/components/List/List'
import { isFieldRuntime } from '../../K8sServiceSpecHelper'
import { isFieldfromTriggerTabDisabled } from '../ManifestSourceUtils'
import ManifestGitStoreRuntimeFields from '../ManifestSourceRuntimeFields/ManifestGitStoreRuntimeFields'
import ManifestCommonRuntimeFields from '../ManifestSourceRuntimeFields/ManifestCommonRuntimeFields'
import css from '../../KubernetesManifests/KubernetesManifests.module.scss'

const Content = (props: ManifestSourceRenderProps): React.ReactElement => {
  const { template, path, manifestPath, manifest, fromTrigger, readonly, formik, stageIdentifier } = props
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()

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
      {isFieldRuntime(`${manifestPath}.spec.store.spec.paths`, template) && (
        <div className={css.verticalSpacingInput}>
          <List
            labelClassName={css.listLabel}
            label={getString('common.git.filePath')}
            name={`${path}.${manifestPath}.spec.store.spec.paths`}
            placeholder={getString('pipeline.manifestType.pathPlaceholder')}
            disabled={isFieldDisabled(`${manifestPath}.spec.store.spec.paths`)}
            style={{ marginBottom: 'var(--spacing-small)' }}
            expressions={expressions}
            isNameOfArrayType
          />
        </div>
      )}
    </Layout.Vertical>
  )
}

export class KustomizePatchesManifestSource extends ManifestSourceBase<ManifestSourceRenderProps> {
  protected manifestType = ManifestDataType.KustomizePatches

  renderContent(props: ManifestSourceRenderProps): JSX.Element | null {
    if (!props.isManifestsRuntime) {
      return null
    }

    return <Content {...props} />
  }
}
