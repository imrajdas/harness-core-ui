/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'
import { Expander } from '@blueprintjs/core'
import { cloneDeep, isEmpty, isEqual, set } from 'lodash-es'
import produce from 'immer'
import { Tabs, Tab, Icon, Button, Layout, ButtonVariation, IconName } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import type { HarnessIconName } from '@harness/icons'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import {
  PipelineContextType,
  usePipelineContext
} from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { useStrings } from 'framework/strings'
import { DrawerTypes } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineActions'
import ExecutionGraph, {
  ExecutionGraphAddStepEvent,
  ExecutionGraphEditStepEvent,
  ExecutionGraphRefObj
} from '@pipeline/components/PipelineStudio/ExecutionGraph/ExecutionGraph'
import {
  generateRandomString,
  STATIC_SERVICE_GROUP_NAME,
  StepType
} from '@pipeline/components/PipelineStudio/ExecutionGraph/ExecutionGraphUtil'
import { StepType as StepsStepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { AdvancedPanels } from '@pipeline/components/PipelineStudio/StepCommands/StepCommandTypes'
import { StageErrorContext } from '@pipeline/context/StageErrorContext'
import type { BuildStageElementConfig } from '@pipeline/utils/pipelineTypes'
import type {
  Infrastructure,
  K8sDirectInfraYaml,
  K8sHostedInfraYaml,
  K8sHostedInfraYamlSpec,
  UseFromStageInfraYaml,
  VmInfraYaml,
  VmPoolYaml
} from 'services/ci'
import { FeatureFlag } from '@common/featureFlags'
import { useQueryParams } from '@common/hooks'
import { SaveTemplateButton } from '@pipeline/components/PipelineStudio/SaveTemplateButton/SaveTemplateButton'
import { useAddStepTemplate } from '@pipeline/hooks/useAddStepTemplate'
import { isContextTypeNotStageTemplate } from '@pipeline/components/PipelineStudio/PipelineUtils'
import { isCloneCodebaseEnabledAtLeastOneStage } from '@pipeline/utils/CIUtils'
import BuildInfraSpecifications from '../BuildInfraSpecifications/BuildInfraSpecifications'
import BuildStageSpecifications from '../BuildStageSpecifications/BuildStageSpecifications'
import BuildAdvancedSpecifications from '../BuildAdvancedSpecifications/BuildAdvancedSpecifications'
import { BuildTabs } from '../CIPipelineStagesUtils'
import { CIBuildInfrastructureType } from '../../../constants/Constants'
import css from './BuildStageSetupShell.module.scss'

export const MapStepTypeToIcon: { [key: string]: HarnessIconName } = {
  Deployment: 'pipeline-deploy',
  CI: 'pipeline-build-select',
  Approval: 'approval-stage-icon',
  Pipeline: 'pipeline',
  Custom: 'custom-stage-icon'
}

interface StagesFilledStateFlags {
  specifications: boolean
  infra: boolean
  execution: boolean
}

interface BuildStageSetupShellProps {
  moduleIcon?: IconName
}

const TabsOrder = [BuildTabs.OVERVIEW, BuildTabs.INFRASTRUCTURE, BuildTabs.EXECUTION, BuildTabs.ADVANCED]

const BuildStageSetupShell: React.FC<BuildStageSetupShellProps> = ({ moduleIcon }) => {
  const icon = moduleIcon ? moduleIcon : 'ci-main'
  const { getString } = useStrings()
  const isTemplatesEnabled = useFeatureFlag(FeatureFlag.NG_TEMPLATES)
  const ciStepGroupEnabled = useFeatureFlag(FeatureFlag.CI_STEP_GROUP_ENABLED)
  const [selectedTabId, setSelectedTabId] = React.useState<BuildTabs>(BuildTabs.OVERVIEW)
  const [filledUpStages, setFilledUpStages] = React.useState<StagesFilledStateFlags>({
    specifications: false,
    infra: false,
    execution: false
  })
  const layoutRef = React.useRef<HTMLDivElement>(null)
  const pipelineContext = usePipelineContext()
  const {
    state: {
      pipeline,
      originalPipeline,
      pipelineView: { isSplitViewOpen },
      pipelineView,
      selectionState: { selectedStageId = '', selectedStepId, selectedSectionId },
      templateTypes
    },
    contextType,
    stepsFactory,
    getStageFromPipeline,
    updatePipelineView,
    isReadonly,
    updateStage,
    setSelectedStepId,
    getStagePathFromPipeline,
    updatePipeline,
    setSelectedSectionId
  } = pipelineContext

  const query = useQueryParams()
  const stagePath = getStagePathFromPipeline(selectedStageId || '', 'pipeline.stages')
  const [stageData, setStageData] = React.useState<BuildStageElementConfig | undefined>()
  const poolName =
    ((stageData?.spec?.infrastructure as VmInfraYaml)?.spec as VmPoolYaml)?.spec?.poolName ||
    ((stageData?.spec?.infrastructure as VmInfraYaml)?.spec as VmPoolYaml)?.spec?.identifier

  React.useEffect(() => {
    if (selectedStepId) {
      setSelectedTabId(BuildTabs.EXECUTION)
    }
  }, [selectedStepId])

  React.useEffect(() => {
    // @TODO: add CI Codebase field check if Clone Codebase is checked
    // once it is added to BuildStageSpecifications (CI-757)
    const specifications = !!(stageData?.name && stageData?.identifier)
    const infra = !!(
      ((stageData?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.connectorRef &&
        (stageData?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.namespace) ||
      (stageData?.spec?.infrastructure as UseFromStageInfraYaml)?.useFromStage ||
      ((stageData?.spec?.infrastructure as VmInfraYaml)?.spec as VmPoolYaml)?.spec?.poolName ||
      ((stageData?.spec?.infrastructure as VmInfraYaml)?.spec as VmPoolYaml)?.spec?.identifier ||
      ((stageData?.spec?.infrastructure as K8sHostedInfraYaml)?.spec as K8sHostedInfraYamlSpec)?.identifier
    )
    const execution = !!stageData?.spec?.execution?.steps?.length
    setFilledUpStages({ specifications, infra, execution })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    stageData?.name,
    stageData?.identifier,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    (stageData?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.connectorRef,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    (stageData?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.namespace,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    (stageData?.spec?.infrastructure as UseFromStageInfraYaml)?.useFromStage,
    poolName,
    (stageData?.spec?.infrastructure as K8sHostedInfraYaml)?.spec,
    stageData?.spec?.execution?.steps?.length
  ])

  /* If a stage A propagates it's infra from another stage B and number of stages in a pipeline change due to deletion of propagated stage B, then infra for stage A needs to be reset */
  React.useEffect(() => {
    const propagatedStageId = (stageData?.spec?.infrastructure as UseFromStageInfraYaml)?.useFromStage
    if (stageData && propagatedStageId) {
      const { stage: propagatedStage } = getStageFromPipeline<BuildStageElementConfig>(propagatedStageId)
      if (!propagatedStage) {
        // indicates propagated stage doesn't exist
        const stageWithoutInfra = set(stageData, 'spec.infrastructure', {
          useFromStage: {}
        })
        updateStage(stageWithoutInfra)
      }
    }
  }, [pipeline?.stages?.length])

  React.useEffect(() => {
    if (selectedStageId && isSplitViewOpen) {
      const { stage } = cloneDeep(getStageFromPipeline<BuildStageElementConfig>(selectedStageId))
      const key = Object.keys(stage || {})[0]
      if (key && stage && !isEqual(stage[key as 'stage'], stageData)) {
        setStageData(stage[key as 'stage'])
      }
    }
  }, [selectedStageId, pipeline, isSplitViewOpen])

  React.useEffect(() => {
    // if clone codebase is not enabled at least one stage, then remove properties from pipeline
    if (!isCloneCodebaseEnabledAtLeastOneStage(pipeline)) {
      const newPipeline = pipeline
      delete newPipeline.properties
      updatePipeline(newPipeline)
    }
  }, [stageData?.spec?.cloneCodebase])

  const { checkErrorsForTab } = React.useContext(StageErrorContext)

  const handleTabChange = (data: BuildTabs) => {
    checkErrorsForTab(selectedTabId).then(_ => {
      setSelectedTabId(data)
      setSelectedSectionId(data)
    })
  }

  React.useEffect(() => {
    if (layoutRef.current) {
      const parent = layoutRef.current.parentElement
      if (parent && parent.scrollTo) {
        parent.scrollTo(0, 0)
      }
    }
  }, [selectedTabId])

  const executionRef = React.useRef<ExecutionGraphRefObj | null>(null)
  const { addTemplate } = useAddStepTemplate({ executionRef: executionRef.current })
  const selectedStage = getStageFromPipeline<BuildStageElementConfig>(selectedStageId).stage
  const originalStage = getStageFromPipeline<BuildStageElementConfig>(selectedStageId, originalPipeline).stage
  const infraHasWarning = !filledUpStages.infra
  const executionHasWarning = !filledUpStages.execution

  React.useEffect(() => {
    const sectionId = (query as any).sectionId || ''
    if (sectionId && TabsOrder.includes(sectionId)) {
      setSelectedTabId(sectionId)
    } else {
      setSelectedSectionId(BuildTabs.OVERVIEW)
    }
  }, [selectedSectionId])

  // NOTE: set empty arrays, required by ExecutionGraph
  const selectedStageClone = cloneDeep(selectedStage)
  if (selectedStageClone) {
    if (!selectedStageClone.stage?.spec?.serviceDependencies) {
      set(selectedStageClone, 'stage.spec.serviceDependencies', [])
    }
    if (!selectedStageClone.stage?.spec?.execution?.steps) {
      set(selectedStageClone, 'stage.spec.execution.steps', [])
    }
  }

  const navBtns = (
    <Layout.Horizontal spacing="medium" className={css.footer}>
      {selectedTabId !== BuildTabs.OVERVIEW ? (
        <Button
          text={getString('back')}
          icon="chevron-left"
          onClick={() =>
            handleTabChange(
              selectedTabId === BuildTabs.ADVANCED
                ? BuildTabs.EXECUTION
                : selectedTabId === BuildTabs.EXECUTION
                ? BuildTabs.INFRASTRUCTURE
                : BuildTabs.OVERVIEW
            )
          }
          variation={ButtonVariation.SECONDARY}
        />
      ) : null}
      {selectedTabId === BuildTabs.ADVANCED ? (
        contextType === PipelineContextType.Pipeline ? (
          <Button
            text="Done"
            intent="primary"
            onClick={() => {
              updatePipelineView({ ...pipelineView, isSplitViewOpen: false })
            }}
            variation={ButtonVariation.PRIMARY}
          />
        ) : null
      ) : (
        <Button
          text={selectedTabId === BuildTabs.EXECUTION ? getString('ci.save') : getString('continue')}
          intent="primary"
          rightIcon="chevron-right"
          onClick={() => {
            if (selectedTabId === BuildTabs.EXECUTION) {
              updatePipelineView({ ...pipelineView, isSplitViewOpen: false, splitViewData: {} })
            } else {
              handleTabChange(selectedTabId === BuildTabs.OVERVIEW ? BuildTabs.INFRASTRUCTURE : BuildTabs.EXECUTION)
            }
          }}
          variation={ButtonVariation.PRIMARY}
          disabled={
            selectedTabId === BuildTabs.INFRASTRUCTURE &&
            (stageData?.spec?.infrastructure as Infrastructure)?.type === CIBuildInfrastructureType.KubernetesHosted &&
            !((stageData?.spec?.infrastructure as K8sHostedInfraYaml)?.spec as K8sHostedInfraYamlSpec)?.identifier
          }
        />
      )}
    </Layout.Horizontal>
  )

  return (
    <section className={css.setupShell} ref={layoutRef} key={selectedStageId}>
      <Tabs id="stageSetupShell" onChange={handleTabChange} selectedTabId={selectedTabId}>
        <Tab
          id={BuildTabs.OVERVIEW}
          panel={<BuildStageSpecifications>{navBtns}</BuildStageSpecifications>}
          title={
            <span className={css.tab}>
              <Icon name={icon} height={14} size={14} />
              Overview
            </span>
          }
          data-testid={getString('overview')}
        />
        <Icon
          name="chevron-right"
          height={20}
          size={20}
          margin={{ right: 'small', left: 'small' }}
          color={'grey400'}
          style={{ alignSelf: 'center' }}
        />
        <Tab
          id={BuildTabs.INFRASTRUCTURE}
          title={
            <span className={css.tab}>
              <Icon
                name={infraHasWarning ? 'warning-sign' : 'infrastructure'}
                size={infraHasWarning ? 16 : 20}
                color={infraHasWarning ? Color.ORANGE_500 : undefined}
              />
              {getString('ci.infraLabel')}
            </span>
          }
          panel={<BuildInfraSpecifications>{navBtns}</BuildInfraSpecifications>}
          data-testid={getString('ci.infraLabel')}
        />
        <Icon
          name="chevron-right"
          height={20}
          size={20}
          margin={{ right: 'small', left: 'small' }}
          color={'grey400'}
          style={{ alignSelf: 'center' }}
        />
        <Tab
          id={BuildTabs.EXECUTION}
          title={
            <span className={css.tab}>
              <Icon
                name={executionHasWarning ? 'warning-sign' : 'execution'}
                size={executionHasWarning ? 16 : 20}
                color={executionHasWarning ? Color.ORANGE_500 : undefined}
              />
              {getString('ci.executionLabel')}
            </span>
          }
          className={cx(css.fullHeight, css.stepGroup)}
          panel={
            selectedStageClone ? (
              <ExecutionGraph
                allowAddGroup={ciStepGroupEnabled}
                hasRollback={false}
                isReadonly={isReadonly}
                hasDependencies={true}
                stepsFactory={stepsFactory}
                stage={selectedStageClone}
                originalStage={originalStage}
                ref={executionRef}
                templateTypes={templateTypes}
                updateStage={newStageData => {
                  const newData = produce(newStageData, draft => {
                    // cleanup rollbackSteps (note: rollbackSteps does not exist on CI stage at all)
                    if (draft?.stage?.spec?.execution?.rollbackSteps) {
                      delete draft.stage.spec.execution.rollbackSteps
                    }
                    // delete serviceDependencies if its empty array (as serviceDependencies is optional)
                    if (draft?.stage?.spec?.serviceDependencies && isEmpty(draft?.stage?.spec?.serviceDependencies)) {
                      delete draft.stage.spec.serviceDependencies
                    }
                  })

                  if (newData.stage) {
                    updateStage(newData.stage)
                  }
                }}
                // Check and update the correct stage path here
                pathToStage={`${stagePath}.stage.spec.execution`}
                onAddStep={(event: ExecutionGraphAddStepEvent) => {
                  if (event.parentIdentifier === STATIC_SERVICE_GROUP_NAME) {
                    updatePipelineView({
                      ...pipelineView,
                      isDrawerOpened: true,
                      drawerData: {
                        type: DrawerTypes.ConfigureService,
                        data: {
                          stepConfig: {
                            node: {
                              type: StepsStepType.Dependency,
                              name: '',
                              identifier: generateRandomString(StepsStepType.Dependency)
                            },
                            stepsMap: event.stepsMap,
                            onUpdate: executionRef.current?.stepGroupUpdated,
                            addOrEdit: 'add',
                            isStepGroup: false,
                            hiddenAdvancedPanels: [AdvancedPanels.PreRequisites, AdvancedPanels.DelegateSelectors]
                          }
                        }
                      }
                    })
                  } else {
                    if (event.isTemplate) {
                      addTemplate(event)
                    } else {
                      updatePipelineView({
                        ...pipelineView,
                        isDrawerOpened: true,
                        drawerData: {
                          type: DrawerTypes.AddStep,
                          data: {
                            paletteData: {
                              entity: event.entity,
                              stepsMap: event.stepsMap,
                              onUpdate: executionRef.current?.stepGroupUpdated,
                              // isAddStepOverride: true,
                              isRollback: event.isRollback,
                              isParallelNodeClicked: event.isParallel,
                              hiddenAdvancedPanels: [AdvancedPanels.PreRequisites, AdvancedPanels.DelegateSelectors]
                            }
                          }
                        }
                      })
                    }
                  }
                }}
                onEditStep={(event: ExecutionGraphEditStepEvent) => {
                  updatePipelineView({
                    ...pipelineView,
                    isDrawerOpened: true,
                    drawerData: {
                      type: event.stepType === StepType.STEP ? DrawerTypes.StepConfig : DrawerTypes.ConfigureService,
                      data: {
                        stepConfig: {
                          node: event.node as any,
                          stepsMap: event.stepsMap,
                          onUpdate: executionRef.current?.stepGroupUpdated,
                          isStepGroup: event.isStepGroup,
                          isUnderStepGroup: event.isUnderStepGroup,
                          addOrEdit: event.addOrEdit,
                          hiddenAdvancedPanels: [AdvancedPanels.PreRequisites, AdvancedPanels.DelegateSelectors]
                        }
                      }
                    }
                  })
                }}
                onSelectStep={(stepId: string) => {
                  setSelectedStepId(stepId)
                }}
                selectedStepId={selectedStepId}
              />
            ) : undefined
          }
          data-testid={getString('ci.executionLabel')}
        />
        <Icon
          name="chevron-right"
          height={20}
          size={20}
          margin={{ right: 'small', left: 'small' }}
          color={'grey400'}
          style={{ alignSelf: 'center' }}
        />
        <Tab
          id={BuildTabs.ADVANCED}
          title={
            <span className={css.tab}>
              <Icon name="advanced" height={20} size={20} />
              {getString('ci.advancedLabel')}
            </span>
          }
          panel={<BuildAdvancedSpecifications>{navBtns}</BuildAdvancedSpecifications>}
          data-testid={getString('ci.advancedLabel')}
        />
        {isTemplatesEnabled && isContextTypeNotStageTemplate(contextType) && selectedStage?.stage && (
          <>
            <Expander />
            <SaveTemplateButton data={selectedStage?.stage} type={'Stage'} />
          </>
        )}
      </Tabs>
    </section>
  )
}

export default BuildStageSetupShell
