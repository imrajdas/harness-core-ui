/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { SyntheticEvent } from 'react'
import { Button, Container, Layout, Text } from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import { Color } from '@harness/design-system'
import { noop, omit, set } from 'lodash-es'
import produce from 'immer'
import { Drawer, Position } from '@blueprintjs/core'
import { StepPopover } from '@pipeline/components/PipelineStudio/StepPalette/StepPopover/StepPopover'
import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
import type { StepElementConfig } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import type { StepData, StepPalleteModuleInfo } from 'services/pipeline-ng'
import { TemplateContext } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateContext'
import type { ModulePathParams, TemplateStudioPathProps } from '@common/interfaces/RouteInterfaces'
import { DefaultNewTemplateId } from 'framework/Templates/templates'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepPalette } from '@pipeline/components/PipelineStudio/StepPalette/StepPalette'
import { StageType } from '@pipeline/utils/stageHelpers'
import { getAllStepPaletteModuleInfos, getStepPaletteModuleInfosFromStage } from '@pipeline/utils/stepUtils'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import css from './StepTemplateDiagram.module.scss'

export const StepTemplateDiagram = (): JSX.Element => {
  const { getString } = useStrings()
  const [stepData, setStepData] = React.useState<StepData>()
  const {
    state: { template, gitDetails },
    updateTemplate
  } = React.useContext(TemplateContext)
  const { templateIdentifier } = useParams<TemplateStudioPathProps>()
  const [stepPaletteModuleInfos, setStepPaletteModuleInfos] = React.useState<StepPalleteModuleInfo[]>([])
  const { module } = useParams<ModulePathParams>()
  const { CDNG_ENABLED, CING_ENABLED, CFNG_ENABLED } = useFeatureFlags()
  const [isStepSelectorOpen, setIsStepSelectorOpen] = React.useState<boolean>()

  const openStepSelector = React.useCallback(() => {
    setIsStepSelectorOpen(true)
  }, [setIsStepSelectorOpen])

  const onSelection = React.useCallback(
    async (data: StepData) => {
      setIsStepSelectorOpen(false)
      await updateTemplate(
        produce(template, draft => {
          const factoryStep = factory?.getStep<unknown>(data.type)
          const defaultValues = factoryStep?.getDefaultValues({}, StepViewType.Edit) as StepElementConfig
          set(draft, 'spec', omit(defaultValues, 'name', 'identifier'))
        })
      )
    },
    [setIsStepSelectorOpen, updateTemplate, template, factory]
  )

  const closeDrawer = React.useCallback(
    (e?: SyntheticEvent<HTMLElement, Event> | undefined): void => {
      e?.persist()
      setIsStepSelectorOpen(false)
    },
    [setIsStepSelectorOpen]
  )

  const onCloseDrawer = React.useCallback((): void => {
    closeDrawer()
  }, [closeDrawer])

  React.useEffect(() => {
    if (module === 'cd') {
      setStepPaletteModuleInfos(getStepPaletteModuleInfosFromStage(StageType.DEPLOY))
    } else if (module === 'ci') {
      setStepPaletteModuleInfos(getStepPaletteModuleInfosFromStage(StageType.BUILD))
    } else if (module === 'cf') {
      setStepPaletteModuleInfos(getStepPaletteModuleInfosFromStage(StageType.FEATURE))
    } else {
      if (CDNG_ENABLED && CING_ENABLED && CFNG_ENABLED) {
        setStepPaletteModuleInfos(getAllStepPaletteModuleInfos())
      } else if (CDNG_ENABLED) {
        setStepPaletteModuleInfos(getStepPaletteModuleInfosFromStage(StageType.DEPLOY))
      } else if (CING_ENABLED) {
        setStepPaletteModuleInfos(getStepPaletteModuleInfosFromStage(StageType.BUILD))
      } else if (CFNG_ENABLED) {
        setStepPaletteModuleInfos(getStepPaletteModuleInfosFromStage(StageType.FEATURE))
      }
    }
  }, [module])

  React.useEffect(() => {
    if (!!template.name && !(template.spec as StepElementConfig)?.type) {
      openStepSelector()
    }
  }, [template.name, gitDetails])

  React.useEffect(() => {
    const stepType = (template.spec as StepElementConfig)?.type
    if (stepType) {
      setStepData({ name: factory.getStepName(stepType) || '', type: stepType })
    }
  }, [(template.spec as StepElementConfig)?.type])

  return (
    <Container
      className={css.container}
      background={Color.FORM_BG}
      width={'100%'}
      padding={{ left: 'huge', right: 'huge' }}
    >
      <Layout.Vertical height={'100%'} flex={{ justifyContent: 'center', alignItems: 'flex-start' }} spacing={'small'}>
        <Text font={{ size: 'small', weight: 'semi-bold' }} color={Color.GREY_600}>
          {getString('stepType')}
        </Text>
        <Container>
          <Layout.Horizontal
            spacing={'medium'}
            onClick={templateIdentifier === DefaultNewTemplateId ? openStepSelector : noop}
            data-testid={'change-step'}
            flex={{ alignItems: 'center', justifyContent: 'flex-start' }}
          >
            <StepPopover className={css.stepPalette} stepsFactory={factory} stepData={stepData} />
            <Text font={{ size: 'small', weight: 'semi-bold' }} color={Color.GREY_600}>
              {stepData?.name || ''}
            </Text>
          </Layout.Horizontal>
        </Container>
      </Layout.Vertical>
      <Drawer
        onClose={closeDrawer}
        usePortal={true}
        autoFocus={true}
        canEscapeKeyClose={true}
        canOutsideClickClose={true}
        enforceFocus={false}
        hasBackdrop={true}
        size={700}
        isOpen={isStepSelectorOpen}
        position={Position.RIGHT}
        data-type={'select-step'}
        className={css.stepDrawer}
      >
        <Button minimal className={css.closeButton} icon="cross" withoutBoxShadow onClick={onCloseDrawer} />
        <StepPalette
          stepsFactory={factory}
          stepPaletteModuleInfos={stepPaletteModuleInfos}
          stageType={StageType.BUILD}
          onSelect={onSelection}
        />
      </Drawer>
    </Container>
  )
}
