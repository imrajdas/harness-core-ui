/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useLayoutEffect, useRef, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import type { IconName } from '@wings-software/uicore'
import { useTelemetry } from '@common/hooks/useTelemetry'
import routes from '@common/RouteDefinitions'
import { useUpdateAccountDefaultExperienceNG } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import { Experiences } from '@common/constants/Utils'
import { useToaster } from '@common/components'
import { Category, PurposeActions } from '@common/constants/TrackingConstants'
import type { Module, AccountPathProps } from '@common/interfaces/RouteInterfaces'
import ModuleCard from './ModuleCard'
import css from './WelcomePage.module.scss'

interface ModuleProps {
  enabled: boolean
  titleIcon: IconName
  bodyIcon: IconName
  module: Module
  description: string
}

interface SelectModuleListProps {
  onModuleClick: (module?: Module) => void
  moduleList: ModuleProps[]
}

const SelectModuleList: React.FC<SelectModuleListProps> = ({ onModuleClick, moduleList }) => {
  const [selected, setSelected] = useState<Module>()
  const { getString } = useStrings()
  const { accountId } = useParams<AccountPathProps>()
  const { trackEvent } = useTelemetry()
  const { showError } = useToaster()
  const { mutate: updateDefaultExperience, loading: updatingDefaultExperience } = useUpdateAccountDefaultExperienceNG({
    accountIdentifier: accountId
  })
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: innerHeight })
  const ref = useRef<HTMLDivElement>(null)

  const handleModuleSelection = (module: Module): void => {
    setSelected(module)
    onModuleClick(module)
  }

  const history = useHistory()

  const getButtonProps = (buttonType: string): { clickHandle?: () => void; disabled?: boolean } => {
    switch (buttonType) {
      case 'ci':
        return {
          clickHandle: () => {
            trackEvent(PurposeActions.ModuleContinue, { category: Category.SIGNUP, module: buttonType })
            try {
              updateDefaultExperience({
                defaultExperience: Experiences.NG
              }).then(() => {
                history.push(routes.toModuleTrialHome({ accountId, module: buttonType }))
              })
            } catch (error) {
              showError(error.data?.message || getString('somethingWentWrong'))
            }
          },
          disabled: updatingDefaultExperience
        }
      case 'cd':
      case 'ce':
      case 'cv':
      case 'cf':
        return {
          clickHandle: () => {
            trackEvent(PurposeActions.ModuleContinue, { category: Category.SIGNUP, module: buttonType })
            try {
              updateDefaultExperience({
                defaultExperience: Experiences.NG
              }).then(() => {
                history.push(routes.toModuleHome({ accountId, module: buttonType, source: 'purpose' }))
              })
            } catch (error) {
              showError(error.data?.message || getString('somethingWentWrong'))
            }
          },
          disabled: updatingDefaultExperience
        }
      default:
        return {}
    }
  }

  const moduleListElements = moduleList.map(option => {
    const buttonProp: { clickHandle?: () => void; disabled?: boolean } = getButtonProps(option.module)

    return (
      <ModuleCard
        key={option.module}
        option={option}
        onClick={handleModuleSelection}
        selected={selected === option.module}
        buttonText={getString('continue')}
        buttonDisabled={buttonProp.disabled}
        handleButtonClick={buttonProp.clickHandle}
      />
    )
  })

  useLayoutEffect(() => {
    const resize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', resize)
    resize()
    const removeListner = () => window.removeEventListener('resize', resize)

    return removeListner
  }, [])

  const wWI = dimensions.width
  const wHI = dimensions.height
  const scaleW = Math.max(wWI / 1920, 1)
  const scaleH = Math.max(wHI / 1080, 1)
  const scale = Math.min(scaleH, scaleW)

  let topMarginAdd = 0
  let leftMarginAdd = 0
  if (scale > 1 && ref !== null && ref !== undefined) {
    const height = ref?.current?.clientHeight
    const width = ref?.current?.clientWidth
    topMarginAdd = height ? (height * (scale - 1)) / 3 : 0
    leftMarginAdd = width ? (width * (scale - 1)) / 3 : 0
  }
  return (
    <div
      ref={ref}
      className={css.moduleList}
      style={{ transform: `scale(${scale}) translate(${leftMarginAdd}px,${topMarginAdd}px)` }}
    >
      {moduleListElements}
    </div>
  )
}

export default SelectModuleList
