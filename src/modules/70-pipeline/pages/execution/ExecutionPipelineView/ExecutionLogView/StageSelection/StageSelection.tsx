/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Accordion, AccordionHandle } from '@harness/uicore'
import { Spinner } from '@blueprintjs/core'
import { defaultTo, isEmpty } from 'lodash-es'

import { useUpdateQueryParams } from '@common/hooks'
import { processExecutionData } from '@pipeline/utils/executionUtils'
import { useExecutionContext } from '@pipeline/context/ExecutionContext'
import type { ExecutionPageQueryParams } from '@pipeline/utils/types'
import type { ExecutionStatus } from '@pipeline/utils/statusHelpers'
import { isExecutionNotStarted, isExecutionSkipped } from '@pipeline/utils/statusHelpers'
import { StatusHeatMap } from '@pipeline/components/StatusHeatMap/StatusHeatMap'
import { String as TemplateString } from 'framework/strings'
import { StepsTree } from '../StepsTree/StepsTree'
import { StatusIcon } from '../StepsTree/StatusIcon'

import css from './StageSelection.module.scss'

const SCROLL_OFFSET = 250

export function StageSelection(): React.ReactElement {
  const {
    pipelineStagesMap,
    allNodeMap,
    pipelineExecutionDetail,
    selectedStageId,
    selectedStepId,
    selectedStageExecutionId,
    queryParams,
    loading
  } = useExecutionContext()

  const accordionRef = React.useRef<AccordionHandle | null>(null)
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const prevSelectedStageIdRef = React.useRef(selectedStageId)
  const prevSelectedStageExecutionId = React.useRef(selectedStageExecutionId)
  const hasUserClicked = React.useRef(false)

  const { updateQueryParams } = useUpdateQueryParams<ExecutionPageQueryParams>()

  React.useEffect(() => {
    let timer: number

    if (accordionRef.current && selectedStageId) {
      const newIdentifier = isEmpty(selectedStageExecutionId)
        ? selectedStageId
        : [selectedStageId, selectedStageExecutionId].join('|')
      accordionRef.current.open(newIdentifier)
      const scrollPanelIntoView = (): void => {
        const panel = document.querySelector(`[data-testid="${newIdentifier}-panel"]`)
        if (panel && containerRef.current) {
          const rect = panel.getBoundingClientRect()
          containerRef.current.scrollTop += rect.top - SCROLL_OFFSET
        } else {
          timer = window.setTimeout(() => {
            scrollPanelIntoView()
          }, 300)
        }
      }

      scrollPanelIntoView()
    }

    return () => {
      if (timer) {
        window.clearTimeout(timer)
      }
    }
  }, [selectedStageId, selectedStageExecutionId])

  React.useEffect(() => {
    if (!loading) {
      // only update reference, after API is complete
      prevSelectedStageIdRef.current = selectedStageId
      prevSelectedStageExecutionId.current = selectedStageExecutionId
    }
  }, [selectedStageId, selectedStageExecutionId, loading])

  const tree = React.useMemo(
    () => processExecutionData(pipelineExecutionDetail?.executionGraph),
    [pipelineExecutionDetail?.executionGraph]
  )

  function handleStepSelect(stepId: string, retryStep?: string): void {
    updateQueryParams({ step: stepId, stage: selectedStageId, stageExecId: selectedStageExecutionId, retryStep })
  }

  /**
   * This function is called even during auto stage selection,
   * we should call this only when user clicks it.
   */
  function handleAccordionChange(stageId: string | string[]): void {
    if (hasUserClicked.current) {
      const [stageNodeId, stageNodeExecId] = Array.isArray(stageId) ? stageId : (stageId || '').split('|')

      if (typeof stageId === 'string' && stageId && stageNodeId) {
        updateQueryParams({
          stage: stageNodeId,
          stageExecId: stageNodeExecId
        })
      }
      hasUserClicked.current = false
    }
  }

  const stageEntries = [...pipelineStagesMap.entries()]
  const stages = [...pipelineStagesMap.values()]

  return (
    <div ref={containerRef} className={css.mainContainer} onClick={() => (hasUserClicked.current = true)}>
      <div className={css.statusHeader}>
        <div className={css.heatmap}>
          <StatusHeatMap
            data={stages}
            getId={i => defaultTo(i.nodeIdentifier, '')}
            getStatus={i => i.status as ExecutionStatus}
          />
        </div>
        <TemplateString
          stringID={stageEntries.length > 1 ? 'pipeline.numOfStages' : 'pipeline.numOfStage'}
          vars={{ n: stageEntries.length }}
        />
      </div>
      <Accordion
        ref={accordionRef}
        className={css.mainAccordion}
        onChange={handleAccordionChange}
        panelClassName={css.accordionPanel}
        summaryClassName={css.accordionSummary}
        detailsClassName={css.accordionDetails}
      >
        {stageEntries.map(([identifier, stage]) => {
          const newIdentifier = stage?.strategyMetadata ? [stage.nodeUuid, stage.nodeExecutionId].join('|') : identifier
          const shouldShowTree =
            newIdentifier.includes(selectedStageExecutionId || selectedStageId) &&
            (!loading ||
              prevSelectedStageIdRef.current === stage.nodeUuid ||
              prevSelectedStageExecutionId.current === stage.nodeExecutionId)

          return (
            <Accordion.Panel
              key={newIdentifier}
              id={newIdentifier}
              disabled={isExecutionSkipped(stage.status) || isExecutionNotStarted(stage.status)}
              summary={
                <div>
                  <StatusIcon className={css.icon} status={stage.status as ExecutionStatus} />
                  <span>{stage.name}</span>
                </div>
              }
              details={
                shouldShowTree ? (
                  <StepsTree
                    allNodeMap={allNodeMap}
                    nodes={tree}
                    selectedStepId={selectedStepId}
                    onStepSelect={handleStepSelect}
                    retryStep={queryParams.retryStep}
                    isRoot
                  />
                ) : (
                  <Spinner size={20} className={css.spinner} />
                )
              }
            />
          )
        })}
      </Accordion>
    </div>
  )
}
