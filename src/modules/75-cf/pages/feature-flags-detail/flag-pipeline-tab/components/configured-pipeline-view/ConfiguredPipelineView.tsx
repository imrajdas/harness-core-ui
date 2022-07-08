/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Card, Intent } from '@blueprintjs/core'
import { Color, FontVariation } from '@harness/design-system'
import { Layout, Container, Text } from '@harness/uicore'
import React from 'react'
import { useParams } from 'react-router-dom'
import { NoData } from '@cf/components/NoData/NoData'
import useActiveEnvironment from '@cf/hooks/useActiveEnvironment'
import RbacOptionsMenuButton from '@rbac/components/RbacOptionsMenuButton/RbacOptionsMenuButton'
import { useStrings } from 'framework/strings'
import { FeaturePipelineResp, useDeleteFeaturePipeline } from 'services/cf'
import imageUrl from '@cf/images/pipeline_flags_executions_empty_state.svg'
import { ResourceType } from '@rbac/interfaces/ResourceType'

import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import useResponseError from '@cf/hooks/useResponseError'
import { showToaster } from '@cf/utils/CFUtils'
import { useConfirmAction } from '@common/hooks/useConfirmAction'
import css from './ConfiguredPipelineView.module.scss'

interface ConfiguredPipelineViewProps {
  pipelineData: FeaturePipelineResp
  flagIdentifier: string
  refetchFeaturePipeline: () => void
  onEdit: () => void
}

const ConfiguredPipelineView: React.FC<ConfiguredPipelineViewProps> = ({
  pipelineData,
  flagIdentifier,
  refetchFeaturePipeline,
  onEdit
}) => {
  const { getString } = useStrings()
  const { activeEnvironment: environmentIdentifier } = useActiveEnvironment()
  const { handleResponseError } = useResponseError()
  const { orgIdentifier, accountId: accountIdentifier, projectIdentifier } = useParams<Record<string, string>>()

  const { mutate: deleteFeaturePipeline } = useDeleteFeaturePipeline({
    identifier: flagIdentifier as string,
    queryParams: {
      projectIdentifier,
      environmentIdentifier,
      accountIdentifier,
      orgIdentifier
    }
  })

  const onConfirmDeleteClick = async (): Promise<void> => {
    try {
      await deleteFeaturePipeline()

      refetchFeaturePipeline()
      showToaster(getString('cf.featureFlags.flagPipeline.saveSuccess'))
    } catch (error) {
      handleResponseError(error)
    }
  }

  const openConfirmDeleteModal = useConfirmAction({
    title: getString('cf.featureFlags.flagPipeline.deleteModalTitle'),
    message: (
      <Text font={{ variation: FontVariation.BODY }}>{getString('cf.featureFlags.flagPipeline.deleteModalText')}</Text>
    ),
    intent: Intent.DANGER,
    action: onConfirmDeleteClick
  })

  return (
    <>
      <Card elevation={0} className={css.configuredPipelineCard}>
        <div>
          <Text color={Color.PRIMARY_7} icon="cf-main" font={{ variation: FontVariation.H5 }}>
            {/* istanbul ignore next */ pipelineData?.pipelineDetails?.name}
          </Text>
          <Text font={{ variation: FontVariation.SMALL }} color={Color.GREY_500}>
            {getString('cf.featureFlags.flagPipeline.envText', { env: environmentIdentifier })}
          </Text>
        </div>

        <RbacOptionsMenuButton
          items={[
            {
              icon: 'edit',
              text: getString('edit'),
              onClick: onEdit,
              permission: {
                resource: { resourceType: ResourceType.FEATUREFLAG },
                permission: PermissionIdentifier.EDIT_FF_FEATUREFLAG
              },
              featuresProps: {
                featuresRequest: {
                  featureNames: [FeatureIdentifier.MAUS]
                }
              }
            },
            {
              icon: 'trash',
              text: getString('delete'),
              onClick: openConfirmDeleteModal,
              permission: {
                resource: { resourceType: ResourceType.FEATUREFLAG },
                permission: PermissionIdentifier.DELETE_FF_FEATUREFLAG
              },
              featuresProps: {
                featuresRequest: {
                  featureNames: [FeatureIdentifier.MAUS]
                }
              }
            }
          ]}
        />
      </Card>
      <Layout.Vertical padding="xlarge" className={css.tabMainContent}>
        <Container height="100%" flex={{ align: 'center-center' }}>
          <NoData
            message={getString('cf.featureFlags.flagPipeline.noExecutionMessage')}
            description={getString('cf.featureFlags.flagPipeline.noExecutionDescription')}
            imageURL={imageUrl}
            imgWidth={650}
          />
        </Container>
      </Layout.Vertical>
    </>
  )
}

export default ConfiguredPipelineView
