/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Drawer, Position } from '@blueprintjs/core'
import {
  Color,
  Container,
  FontVariation,
  Layout,
  Text,
  ExpandingSearchInput,
  Button,
  ButtonVariation,
  Heading
} from '@harness/uicore'
import React, { useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'
import {
  FeatureAvailablePipeline,
  FeaturePipeline,
  useCreateFlagPipeline,
  useGetAvailableFeaturePipelines,
  usePatchFeaturePipeline
} from 'services/cf'
import useActiveEnvironment from '@cf/hooks/useActiveEnvironment'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import { showToaster } from '@cf/utils/CFUtils'
import useResponseError from '@cf/hooks/useResponseError'
import PipelineCard from '../pipeline-card/PipelineCard'
import css from './AvailablePipelinesDrawer.module.scss'
interface AvailablePipelinesDrawerProps {
  isOpen: boolean
  flagIdentifier: string
  configuredPipelineDetails?: FeaturePipeline // this means we're editing
  refetchFeaturePipeline: () => void
  onClose: () => void
}

const AvailablePipelinesDrawer: React.FC<AvailablePipelinesDrawerProps> = ({
  flagIdentifier,
  configuredPipelineDetails,
  refetchFeaturePipeline,
  isOpen,
  onClose
}) => {
  const { getString } = useStrings()
  const { activeEnvironment: environmentIdentifier } = useActiveEnvironment()
  const { handleResponseError } = useResponseError()
  const { orgIdentifier, accountId: accountIdentifier, projectIdentifier } = useParams<Record<string, string>>()

  const PAGE_SIZE = 50

  const [selectedPipeline, setSelectedPipeline] = useState<FeatureAvailablePipeline | undefined>(
    configuredPipelineDetails
  )

  const queryParams = useMemo(
    () => ({
      identifier: flagIdentifier,
      environmentIdentifier,
      projectIdentifier,
      accountIdentifier,
      orgIdentifier,
      pageSize: PAGE_SIZE
    }),
    [accountIdentifier, environmentIdentifier, orgIdentifier, projectIdentifier, flagIdentifier]
  )

  const {
    data: availableFeaturePipelines,
    loading: getAvailablePipelinesLoading,
    refetch: refetchAvailablePipelines
  } = useGetAvailableFeaturePipelines({
    queryParams,
    debounce: 500
  })

  const { mutate: createFeaturePipeline, loading: createFeaturePiplineLoading } = useCreateFlagPipeline({
    identifier: flagIdentifier as string,
    queryParams
  })

  const { mutate: updateFeaturePipeline, loading: patchFeaturePiplineLoading } = usePatchFeaturePipeline({
    identifier: flagIdentifier as string,
    queryParams
  })

  const onSaveClick = useCallback(async () => {
    try {
      if (configuredPipelineDetails) {
        await updateFeaturePipeline({
          pipelineIdentifier: selectedPipeline?.identifier as string,
          pipelineName: selectedPipeline?.name as string
        })
      } else {
        await createFeaturePipeline({
          pipelineIdentifier: selectedPipeline?.identifier as string,
          pipelineName: selectedPipeline?.name as string
        })
      }
      refetchFeaturePipeline()
      showToaster(getString('cf.featureFlags.flagPipeline.saveSuccess'))
    } catch (error) {
      handleResponseError(error)
    }
  }, [
    configuredPipelineDetails,
    refetchFeaturePipeline,
    getString,
    selectedPipeline,
    updateFeaturePipeline,
    createFeaturePipeline,
    handleResponseError
  ])

  const onSearchInputChanged = useCallback(
    value => {
      setSelectedPipeline(undefined)
      refetchAvailablePipelines({ queryParams: { ...queryParams, pipelineName: value, pageNumber: 0 }, debounce: 500 })
    },
    [queryParams, refetchAvailablePipelines]
  )

  const isLoading = getAvailablePipelinesLoading || patchFeaturePiplineLoading || createFeaturePiplineLoading

  return (
    <Drawer position={Position.RIGHT} isOpen={isOpen} onClose={onClose} className={css.drawer}>
      <Layout.Vertical padding="xxlarge" spacing="medium">
        <Container flex={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Heading level={3} font={{ variation: FontVariation.H3 }}>
            {getString('cf.featureFlags.flagPipeline.drawerTitle')}
          </Heading>

          <Button
            icon="cross"
            variation={ButtonVariation.ICON}
            onClick={onClose}
            data-testid="close-drawer-button"
            aria-label={getString('close')}
          />
        </Container>
        <Text font={{ variation: FontVariation.BODY2 }} color={Color.GREY_500}>
          {getString('cf.featureFlags.flagPipeline.drawerDescription')}
        </Text>
        <Container flex={{ justifyContent: 'space-between' }}>
          <Text font={{ variation: FontVariation.BODY2 }} className={css.envTag}>
            {getString('cf.featureFlags.flagPipeline.envText', { env: environmentIdentifier })}
          </Text>
          <ExpandingSearchInput alwaysExpanded onChange={onSearchInputChanged} />
        </Container>
        {isLoading ? (
          <ContainerSpinner height="100%" flex={{ align: 'center-center' }} />
        ) : (
          <Container className={css.pipelineCardsGrid} role="list">
            {availableFeaturePipelines?.availablePipelines.length ? (
              availableFeaturePipelines.availablePipelines.map(pipeline => (
                <PipelineCard
                  key={pipeline.identifier}
                  pipelineName={pipeline.name}
                  pipelineDescription={pipeline.description}
                  isSelected={selectedPipeline?.identifier === pipeline.identifier}
                  onClick={() => setSelectedPipeline(pipeline)}
                />
              ))
            ) : (
              <Text font={{ variation: FontVariation.BODY2 }} color={Color.GREY_500}>
                {getString('cf.featureFlags.flagPipeline.noAvailablePipelines')}
              </Text>
            )}
          </Container>
        )}
      </Layout.Vertical>
      {(configuredPipelineDetails || selectedPipeline) && (
        <Container className={css.footer}>
          <Button
            text={getString('cf.featureFlags.flagPipeline.drawerButtonText')}
            intent="primary"
            disabled={isLoading}
            variation={ButtonVariation.PRIMARY}
            onClick={onSaveClick}
          />
        </Container>
      )}
    </Drawer>
  )
}

export default AvailablePipelinesDrawer
