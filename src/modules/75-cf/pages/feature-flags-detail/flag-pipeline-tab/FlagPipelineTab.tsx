/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo, useState } from 'react'
import { Container } from '@harness/uicore'
import { useParams } from 'react-router-dom'
import { NoData } from '@cf/components/NoData/NoData'
import imageUrl from '@cf/images/pipeline_flags_empty_state.svg'
import { useStrings } from 'framework/strings'
import { useGetFeaturePipeline } from 'services/cf'
import useActiveEnvironment from '@cf/hooks/useActiveEnvironment'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import AvailablePipelinesDrawer from './components/available-pipelines-drawer/AvailablePipelinesDrawer'
import ConfiguredPipelineView from './components/configured-pipeline-view/ConfiguredPipelineView'
export interface FlagPipelineTabProps {
  flagIdentifier: string
}

const FlagPipelineTab: React.FC<FlagPipelineTabProps> = ({ flagIdentifier }) => {
  const { getString } = useStrings()
  const { activeEnvironment: environmentIdentifier } = useActiveEnvironment()
  const { orgIdentifier, accountId: accountIdentifier, projectIdentifier } = useParams<Record<string, string>>()

  const queryParams = useMemo(
    () => ({
      identifier: flagIdentifier,
      environmentIdentifier,
      projectIdentifier,
      accountIdentifier,
      orgIdentifier
    }),
    [accountIdentifier, environmentIdentifier, orgIdentifier, projectIdentifier, flagIdentifier]
  )

  const {
    data: featurePipeline,
    loading,
    refetch: refetchFeaturePipeline
  } = useGetFeaturePipeline({
    identifier: flagIdentifier,
    queryParams,
    debounce: 500
  })

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  if (loading && !isDrawerOpen) {
    return (
      <Container height="100%" flex={{ align: 'center-center' }}>
        <ContainerSpinner />
      </Container>
    )
  }

  return (
    <>
      {featurePipeline?.pipelineConfigured ? (
        <ConfiguredPipelineView
          pipelineData={featurePipeline}
          flagIdentifier={flagIdentifier}
          onEdit={() => setIsDrawerOpen(true)}
          refetchFeaturePipeline={async () => await refetchFeaturePipeline()}
        />
      ) : (
        <Container height="100%" flex={{ align: 'center-center' }}>
          <NoData
            message={getString('cf.featureFlags.flagPipeline.noDataMessage')}
            buttonText={getString('cf.featureFlags.flagPipeline.noDataButtonText')}
            description={getString('cf.featureFlags.flagPipeline.noDataDescription')}
            imageURL={imageUrl}
            onClick={() => setIsDrawerOpen(true)}
            imgWidth={650}
          />
        </Container>
      )}

      <AvailablePipelinesDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        flagIdentifier={flagIdentifier}
        configuredPipelineDetails={featurePipeline?.pipelineDetails}
        refetchFeaturePipeline={async () => await refetchFeaturePipeline()}
      />
    </>
  )
}

export default FlagPipelineTab
