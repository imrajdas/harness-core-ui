/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect, useCallback } from 'react'
import YAML from 'yaml'
import { Switch } from '@blueprintjs/core'
import {
  Text,
  Icon,
  Layout,
  Button,
  Card,
  IconName,
  ButtonVariation,
  Container,
  PageError
} from '@wings-software/uicore'
import { defaultTo, isEmpty, set, startCase } from 'lodash-es'
import { Color, FontVariation } from '@harness/design-system'
import cx from 'classnames'
import produce from 'immer'
import {
  DeploymentStageConfig,
  GetExecutionStrategyYamlQueryParams,
  useGetExecutionStrategyList,
  useGetExecutionStrategyYaml
} from 'services/cd-ng'
import type { StageElementConfig, StageElementWrapperConfig } from 'services/pipeline-ng'
import { useStrings } from 'framework/strings'
import { loggerFor } from 'framework/logging/logging'
import { ModuleName } from 'framework/types/ModuleName'
import { PageSpinner } from '@common/components'
import { getServiceDefinitionType, ServiceDeploymentType } from '@pipeline/utils/stageHelpers'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import { usePipelineContext } from '../PipelineContext/PipelineContext'
import { DrawerTypes } from '../PipelineContext/PipelineActions'
import Default from './resources/BlankCanvas.png'
import Steps from './Steps'
import RollingUpdateVideo from './resources/Rolling-Update-deployment.mp4'
import HelmDeploymentBasic from './resources/Helm-Deployment-basic.mp4'
import BlueGreenVideo from './resources/Blue-Green-deployment.mp4'
import CanaryVideo from './resources/Canary-deployment.mp4'
import Rolling from './resources/Rolling-Update-deployment.png'
import AddContinuousVerification from './resources/addContinuousVerification.svg'
import BlueGreen from './resources/Blue-Green-deployment.png'
import Canary from './resources/Canary-deployment.png'
import { isNewServiceEnvEntity } from '../CommonUtils/DeployStageSetupShellUtils'
import { cvLearnMoreHref } from './ExecutionStrategy.constant'
import css from './ExecutionStrategy.module.scss'

export interface ExecutionStrategyProps {
  selectedStage: StageElementWrapperConfig
  ref?: ExecutionStrategyForwardRef
}

const iconMap: { [key: string]: IconName } = {
  Rolling: 'rolling-update',
  Canary: 'canary-icon',
  BlueGreen: 'blue-green',
  Default: 'blank-canvas-card-icon',
  Basic: 'basic-deployment'
}

const imageByType: { [key: string]: string } = {
  BlueGreen,
  Rolling,
  Canary,
  Default,
  Basic: Rolling
}

const videoByType: { [key: string]: string } = {
  BlueGreen: BlueGreenVideo,
  Rolling: RollingUpdateVideo,
  Canary: CanaryVideo,
  Basic: HelmDeploymentBasic
}

type StrategyType = GetExecutionStrategyYamlQueryParams['strategyType'] | 'BlankCanvas'

export interface ExecutionStrategyRefInterface {
  cancelExecutionStrategySelection: () => void
}

export type ExecutionStrategyForwardRef =
  | ((instance: ExecutionStrategyRefInterface | null) => void)
  | React.MutableRefObject<ExecutionStrategyRefInterface | null>
  | null

function ExecutionStrategyRef(
  props: ExecutionStrategyProps,
  executionStrategyRef: ExecutionStrategyForwardRef
): JSX.Element {
  const { selectedStage } = props
  const {
    state: { pipelineView },
    updateStage,
    updatePipelineView,
    getStageFromPipeline
  } = usePipelineContext()
  const { getString } = useStrings()
  const isSvcEnvEntityEnabled = useFeatureFlag(FeatureFlag.NG_SVC_ENV_REDESIGN)

  const [strategiesByDeploymentType, setStrategies] = useState([])
  const [isSubmitDisabled, disableSubmit] = useState(false)
  const [isVerifyEnabled, setIsVerifyEnabled] = useState(true)
  const [showPlayButton, setShowPlayButton] = useState<boolean>(false)
  const logger = loggerFor(ModuleName.CD)

  const serviceDefinitionType = useCallback((): GetExecutionStrategyYamlQueryParams['serviceDefinitionType'] => {
    return getServiceDefinitionType(selectedStage, getStageFromPipeline, isNewServiceEnvEntity, isSvcEnvEntityEnabled)
  }, [getStageFromPipeline, isSvcEnvEntityEnabled, selectedStage])
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyType>(
    serviceDefinitionType() === ServiceDeploymentType.ServerlessAwsLambda ? 'Basic' : 'Rolling'
  )

  const infoByType: { [key: string]: string } = {
    BlueGreen: getString('pipeline.executionStrategy.strategies.blueGreen.description'),
    Rolling: getString('pipeline.executionStrategy.strategies.rolling.description'),
    Canary: getString('pipeline.executionStrategy.strategies.canary.description'),
    Default: getString('pipeline.executionStrategy.strategies.default.description'),
    Basic: getString('pipeline.executionStrategy.strategies.basic.description')
  }

  const learnMoreLinkByType: { [key: string]: string } = {
    BlueGreen: getString('pipeline.executionStrategy.strategies.blueGreen.learnMoreLink'),
    Rolling: getString('pipeline.executionStrategy.strategies.rolling.learnMoreLink'),
    Canary: getString('pipeline.executionStrategy.strategies.canary.learnMoreLink'),
    Default: getString('pipeline.executionStrategy.strategies.default.learnMoreLink'),
    Basic: getString('pipeline.executionStrategy.strategies.default.learnMoreLink')
  }

  const { loading, error: strategiesError, data: strategies, refetch } = useGetExecutionStrategyList({})

  // Video related
  let vidWrapper: HTMLElement | null = document.querySelector('[data-testid="player"]')
  let videoPlayer: HTMLVideoElement | undefined | null = vidWrapper?.querySelector('[data-testid="videoPlayer"]')

  useEffect(() => {
    if (!executionStrategyRef) return
    if (typeof executionStrategyRef === 'function') {
      return
    }
    executionStrategyRef.current = {
      cancelExecutionStrategySelection: cancelSelection
    }
    vidWrapper = document.querySelector('[data-testid="player"]')
    videoPlayer = vidWrapper?.querySelector('[data-testid="videoPlayer"]')
    videoPlayer?.addEventListener('ended', () => setShowPlayButton(true), false)
    if (videoPlayer?.ended) {
      setShowPlayButton(true)
    } else {
      setShowPlayButton(false)
    }
  })

  useEffect(() => {
    const _strategies = strategies?.data
    /* istanbul ignore else */ if (_strategies) {
      if (_strategies[serviceDefinitionType()]) {
        setStrategies(_strategies[serviceDefinitionType()] as any)
      } else {
        setStrategies([selectedStrategy] as any) // setting default value as strategy
        logger.error('Service Definition Type is missing', { serviceDefinitionType: serviceDefinitionType() })
      }
    }
  }, [strategies?.data, serviceDefinitionType])

  const {
    data: yamlSnippet,
    error,
    refetch: refetchStrategyYaml
  } = useGetExecutionStrategyYaml({
    queryParams: {
      serviceDefinitionType: serviceDefinitionType(),
      strategyType: selectedStrategy !== 'BlankCanvas' ? selectedStrategy : 'Rolling',
      ...(isVerifyEnabled && { includeVerify: true })
    },
    lazy: true
  })

  const getServiceDefintionType = serviceDefinitionType()
  useEffect(() => {
    if (getServiceDefintionType) {
      refetchStrategyYaml?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getServiceDefintionType, selectedStrategy, isVerifyEnabled])

  useEffect(() => {
    if (error) {
      disableSubmit(true)
    } else {
      disableSubmit(false)
    }
  }, [error])

  useEffect(() => {
    if (yamlSnippet?.data) {
      updateStage(
        produce(selectedStage, draft => {
          const jsonFromYaml = YAML.parse(defaultTo(yamlSnippet?.data, '{}')) as StageElementConfig
          set(draft, 'stage.failureStrategies', jsonFromYaml.failureStrategies)
          set(draft, 'stage.spec.execution', defaultTo((jsonFromYaml.spec as DeploymentStageConfig)?.execution, {}))
        }).stage as StageElementConfig
      )
    }
    if (selectedStrategy === getString('pipeline.executionStrategy.strategies.default.actualName')) {
      setIsVerifyEnabled(false)
    }
  }, [yamlSnippet?.data, selectedStrategy])

  const updatePipelineViewState = (): void => {
    updatePipelineView({
      ...pipelineView,
      isDrawerOpened: false,
      drawerData: { type: DrawerTypes.ExecutionStrategy }
    })
  }

  const cancelSelection = (): void => {
    updateStage(
      produce(selectedStage, draft => {
        const jsonFromYaml = YAML.parse(defaultTo(yamlSnippet?.data, '{}')) as StageElementConfig
        set(draft, 'stage.failureStrategies', jsonFromYaml.failureStrategies)
        set(draft, 'stage.spec.execution', { steps: [], rollbackSteps: [] })
      }).stage as StageElementConfig
    ).then(() => {
      updatePipelineViewState()
    })
  }

  const toggleVideo = (): void => {
    videoPlayer?.play()
    setShowPlayButton(false)
  }

  const getStrategyNameByType = (type: string): string => {
    return type === 'Default' ? getString('pipeline.executionStrategy.strategies.default.displayName') : startCase(type)
  }

  const refetchCall = (): void => {
    if (!isSubmitDisabled) {
      refetch()
    } else {
      // for yaml-snippets call fail
      refetchStrategyYaml?.()
    }
  }
  return (
    <>
      {loading && (
        <Container data-test="executionStrategyListLoader">
          <PageSpinner />
        </Container>
      )}
      {(strategiesError || isSubmitDisabled) && (
        <Container data-test="executionStrategyListError" height={'100%'}>
          <PageError
            onClick={() => {
              refetchCall()
            }}
            message={isSubmitDisabled ? defaultTo((error?.data as Error)?.message, error?.message) : undefined}
            width={230}
          />
        </Container>
      )}
      {!loading && !strategiesError && !isSubmitDisabled && (
        <Layout.Horizontal>
          <Layout.Vertical width={448} className={css.strategySelectionPanel}>
            <Layout.Horizontal className={css.header}>
              <Text className={css.headerText}>{getString('pipeline.executionStrategy.executionStrategies')}</Text>
            </Layout.Horizontal>
            <section className={css.patterns}>
              <section className={css.strategies} data-section-id="strategy-selection">
                {strategiesByDeploymentType?.map((v: StrategyType) => (
                  <Card
                    className={cx(css.card, selectedStrategy === v && css.active)}
                    elevation={0}
                    key={v}
                    interactive={true}
                    onClick={() => setSelectedStrategy(v)}
                    data-testid={`${v}-Card`}
                  >
                    <Icon name={iconMap[v] as IconName} size={40} border={false} />
                    <section className={css.strategyName}>{getStrategyNameByType(v)}</section>
                    <section className={css.strategyType}>
                      {v !== 'Default' ? startCase(serviceDefinitionType()) : null}
                    </section>
                  </Card>
                ))}
              </section>
            </section>
          </Layout.Vertical>

          <Layout.Vertical width={688} className={css.strategyDetailsPanel}>
            <Container className={css.strategyDetailsBody}>
              <Layout.Horizontal className={css.header} flex>
                <Layout.Horizontal>
                  <Text
                    className={css.headerText}
                    data-testid={`${selectedStrategy}DetailsHeader`}
                    tooltipProps={{ dataTooltipId: `${selectedStrategy}DetailsHeader` }}
                  >
                    {getStrategyNameByType(selectedStrategy)}
                  </Text>
                  {selectedStrategy === 'Default' && (
                    <Icon name="blank-canvas-header-icon" size={24} color={Color.PRIMARY_6} />
                  )}
                </Layout.Horizontal>
                <Button
                  variation={ButtonVariation.LINK}
                  href={learnMoreLinkByType[selectedStrategy]}
                  target="_blank"
                  withoutBoxShadow={true}
                >
                  {getString('learnMore')}
                </Button>
              </Layout.Horizontal>
              <section className={css.preview}>
                <section className={css.previewContainer}>
                  <section className={css.info} data-testid="info">
                    {infoByType[selectedStrategy]}
                  </section>
                  {!isEmpty(videoByType[selectedStrategy]) ? (
                    <section className={css.player} data-testid="player">
                      <video
                        key={selectedStrategy}
                        className={css.videoPlayer}
                        autoPlay
                        poster={imageByType[selectedStrategy]}
                        data-testid="videoPlayer"
                      >
                        <source src={videoByType[selectedStrategy]} type="video/mp4"></source>
                        <Text tooltipProps={{ dataTooltipId: 'videoNotSupportedError' }}>
                          {getString('common.videoNotSupportedError')}
                        </Text>
                      </video>
                      {showPlayButton && (
                        <div className={css.playerControls}>
                          <Button
                            minimal
                            variation={ButtonVariation.ICON}
                            className={css.playButton}
                            onClick={toggleVideo}
                            data-testid="playButton"
                            icon="play-circle"
                            iconProps={{ size: 42 }}
                            withoutCurrentColor
                          />
                        </div>
                      )}
                    </section>
                  ) : (
                    <section className={css.image}>
                      <img src={imageByType[selectedStrategy]} data-testid="blank-canvas-image" />
                    </section>
                  )}
                  {selectedStrategy !== 'Default' && (
                    <>
                      <Steps strategy={selectedStrategy} />

                      <Layout.Horizontal margin={{ top: 'medium', bottom: 'large' }}>
                        <Container className={css.enableVerificationDetail}>
                          <Text font={{ variation: FontVariation.H4 }}>
                            {getString('pipeline.enableVerificationTitle')}
                          </Text>
                          <Text className={css.info} margin={{ top: 'medium' }} color={Color.BLACK}>
                            {getString('pipeline.enableVerificationHelpText')}{' '}
                            <a href={cvLearnMoreHref} rel="noreferrer" target="_blank">
                              {getString('pipeline.createPipeline.learnMore')}
                            </a>
                          </Text>
                          <Switch
                            checked={isVerifyEnabled}
                            onChange={() => setIsVerifyEnabled(prevIsVerifyEnabled => !prevIsVerifyEnabled)}
                            data-testid="enable-verification-options-switch"
                            className={css.cvEnableSwitch}
                            labelElement={
                              <Text font={{ variation: FontVariation.BODY1 }} style={{ fontWeight: 500 }}>
                                {getString('pipeline.enableVerificationOptions')}
                              </Text>
                            }
                          />
                        </Container>
                        <Container>
                          <img
                            className={css.enableVerificationImage}
                            src={AddContinuousVerification}
                            data-testid="blank-canvas-image"
                          />
                        </Container>
                      </Layout.Horizontal>
                    </>
                  )}
                </section>
              </section>
            </Container>
            <Container className={css.strategyDetailsFooter}>
              <Button
                variation={ButtonVariation.PRIMARY}
                text={getString('pipeline.executionStrategy.useStrategy')}
                onClick={() => {
                  const newStage = produce(selectedStage, draft => {
                    const jsonFromYaml = YAML.parse(defaultTo(yamlSnippet?.data, '')) as StageElementConfig
                    if (draft.stage && draft.stage.spec) {
                      draft.stage.failureStrategies = jsonFromYaml?.failureStrategies
                      ;(draft.stage.spec as DeploymentStageConfig).execution = (
                        jsonFromYaml?.spec as DeploymentStageConfig
                      )?.execution ?? { steps: [], rollbackSteps: [] }
                    }
                  }).stage

                  if (newStage) {
                    updateStage(newStage).then(() => {
                      updatePipelineViewState()
                    })
                  }
                }}
                disabled={isSubmitDisabled}
              />
            </Container>
          </Layout.Vertical>
        </Layout.Horizontal>
      )}
    </>
  )
}

export const ExecutionStrategy = React.forwardRef(ExecutionStrategyRef)
