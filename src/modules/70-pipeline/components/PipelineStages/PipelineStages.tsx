/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { defaultTo } from 'lodash-es'
import type { PipelineInfoConfig } from 'services/pipeline-ng'
import type { TemplateSummaryResponse } from 'services/template-ng'
import { useTemplateSelector } from 'framework/Templates/TemplateSelectorContext/useTemplateSelector'
import { AddStageView } from './views/AddStageView'
import type { PipelineStageProps } from './PipelineStage'

export interface PipelineStagesProps<T = Record<string, unknown>> {
  children: Array<React.ReactElement<PipelineStageProps> | null>
  minimal?: boolean
  stageType?: string
  isParallel?: boolean
  getNewStageFromType?: (type: string, clearDefaultValues?: boolean) => T
  getNewStageFromTemplate?: (template: TemplateSummaryResponse, clearDefaultValues?: boolean) => T
  stageProps?: T
  onSelectStage?: (stageType: string, stage?: T, pipeline?: PipelineInfoConfig) => void
  showSelectMenu?: boolean
  contextType?: string
}

interface PipelineStageMap extends Omit<PipelineStageProps, 'minimal'> {
  index: number
}

export function PipelineStages<T = Record<string, unknown>>({
  children,
  showSelectMenu,
  isParallel = false,
  contextType,
  onSelectStage,
  getNewStageFromType,
  getNewStageFromTemplate,
  stageType,
  stageProps,
  minimal = false
}: PipelineStagesProps<T>): JSX.Element {
  const [stages, setStages] = React.useState<Map<string, PipelineStageMap>>(new Map())
  const [template, setTemplate] = React.useState<TemplateSummaryResponse>()
  const { getTemplate } = useTemplateSelector()

  React.useLayoutEffect(() => {
    const stagesLocal: Map<string, PipelineStageMap> = new Map()
    const steps = React.Children.toArray(children) as React.ReactElement<PipelineStageProps>[]
    steps.forEach((child, i: number) => {
      stagesLocal.set(child.props.type, {
        ...child.props,
        index: i
      })
    })
    setStages(stagesLocal)
  }, [children])

  const [showMenu, setShowMenu] = React.useState(showSelectMenu)
  const [type, setType] = React.useState(stageType)
  const [stageData, setStageData] = React.useState<T>()

  React.useEffect(() => {
    if (stageType) {
      setType(stageType)
    }
  }, [stageType])

  React.useEffect(() => {
    if (showSelectMenu) {
      setShowMenu(true)
    }
  }, [showSelectMenu])
  const selected = stages.get(type || '')

  const childTypes = React.useMemo(() => {
    return [...stages.values()].filter(item => !item.isDisabled && !!item.isTemplateSupported).map(item => item.type)
  }, [stages])

  const onUseTemplate = async () => {
    try {
      const { template: newTemplate, isCopied } = await getTemplate({
        templateType: 'Stage',
        allChildTypes: childTypes
      })
      if (getNewStageFromType) {
        setShowMenu(false)
        setType(newTemplate.childType)
        if (isCopied) {
          setStageData(getNewStageFromTemplate?.(newTemplate, true))
        } else {
          setStageData(getNewStageFromType?.(newTemplate.childType || '', true))
          setTemplate(newTemplate)
        }
      } else {
        onSelectStage?.(defaultTo(newTemplate.childType, ''))
      }
    } catch (_) {
      // Do nothing.. user cancelled template selection
    }
  }

  const selectedStageIndex = selected?.index || 0
  const stage = React.Children.toArray(children)[selectedStageIndex] as React.ReactElement<PipelineStageProps>
  return (
    <>
      {showSelectMenu && showMenu && (
        <AddStageView
          stages={[...stages].map(item => item[1])}
          isParallel={isParallel}
          contextType={contextType}
          callback={selectedType => {
            if (getNewStageFromType) {
              setShowMenu(false)
              setType(selectedType)
              setStageData(getNewStageFromType?.(selectedType, true))
            } else {
              onSelectStage?.(selectedType)
            }
          }}
          onUseTemplate={onUseTemplate}
        />
      )}
      {!showSelectMenu && selected && stage && (
        <>
          {React.cloneElement(stage, {
            ...selected,
            key: selected.type,
            minimal,
            stageProps: stageProps as Record<string, unknown>
          })}
        </>
      )}
      {!showMenu && showSelectMenu && type && stage && stageData && (
        <>
          {React.cloneElement(stage, {
            ...selected,
            minimal: true,
            stageProps: {
              data: stageData,
              template: template,
              onSubmit: (data: T, _id?: string, pipeline?: PipelineInfoConfig) => {
                onSelectStage?.(type, data, pipeline)
              }
            }
          })}
        </>
      )}
    </>
  )
}
