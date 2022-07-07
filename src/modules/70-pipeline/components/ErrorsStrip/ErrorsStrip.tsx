/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Icon, Layout, Text, Utils, Button, ButtonVariation } from '@wings-software/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { Intent, PopoverPosition } from '@blueprintjs/core'
import type { FormikErrors } from 'formik'
import cx from 'classnames'
import { defaultTo, isEmpty } from 'lodash-es'
import { getErrorsList } from '@pipeline/utils/errorUtils'
import { useStrings } from 'framework/strings'
import type { StringsMap } from 'stringTypes'
import { useDeepCompareEffect } from '@common/hooks'
import { focusOnNode } from '@common/utils/utils'
import css from './ErrorsStrip.module.scss'

interface ErrorStripProps {
  formErrors: FormikErrors<unknown>
  domRef?: React.MutableRefObject<HTMLElement | undefined>
}

const onNextHandler = (
  offset: number,
  inputsList: string[],
  highlighted: number,
  setHighlighted: React.Dispatch<React.SetStateAction<number>>,
  domRef?: React.MutableRefObject<HTMLElement | undefined>
): void => {
  const nextElementName = inputsList[highlighted + offset]
  if (nextElementName) {
    let element = domRef?.current?.querySelector(`[name="${nextElementName}"]`) as HTMLInputElement | undefined
    if (element) {
      element.focus()
    } else {
      element = domRef?.current?.querySelector(`[data-name="${nextElementName}"]`)?.parentElement
        ?.previousElementSibling as HTMLInputElement | undefined

      // element.scrollIntoView was breaking the UI
      element && focusOnNode(element)
    }
    setHighlighted(highlighted + offset)
  }
}

export function ErrorsStrip(props: ErrorStripProps): React.ReactElement {
  const { errorStrings, errorCount } = getErrorsList(props.formErrors)
  const { getString } = useStrings()

  const [highlighted, setHighlighted] = React.useState(-1)
  const [inputsList, setInputsList] = React.useState<string[]>([])

  const tabList = document.getElementsByClassName('bp3-tab-list')
  const [stickyErrors, setStickyErrors] = React.useState(false)
  const [stickyWidth, setStickyWidth] = React.useState('100%')
  const errorStripRef = React.useRef<HTMLDivElement | undefined>()
  function handleIntersection(entries: IntersectionObserverEntry[]): void {
    const [entry] = entries
    setStickyErrors(!entry.isIntersecting)
  }

  const clickHandler = React.useCallback(
    (e: Event) => {
      if (e.target && !errorStripRef.current?.contains(e.target as Node)) {
        const target = e.target as HTMLDivElement
        let element = defaultTo(target.getAttribute('name'), '')

        if (isEmpty(element)) {
          element = defaultTo(target.closest('.bp3-form-group')?.querySelector('.bp3-label')?.getAttribute('for'), '')
        }
        if (!isEmpty(element)) {
          setHighlighted(inputsList.indexOf(element))
        } else {
          setHighlighted(-1)
        }
      }
    },
    [inputsList]
  )

  React.useEffect(() => {
    props.domRef?.current?.addEventListener('click', clickHandler)
    return () => {
      props.domRef?.current?.removeEventListener('click', clickHandler)
    }
  }, [props.domRef, errorStripRef, clickHandler])

  useDeepCompareEffect(() => {
    const totalElements: string[] = []
    props.domRef?.current?.querySelectorAll('.bp3-form-helper-text [data-name]').forEach(element => {
      const name = element.getAttribute('data-name')
      if (name && !isEmpty(name)) {
        totalElements.push(name)
      }
    })
    setHighlighted(-1)
    setInputsList(totalElements)
  }, [errorCount, props.domRef, props.formErrors])

  React.useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0
    }

    const observer = new IntersectionObserver(handleIntersection, options)
    if (tabList[0]) observer.observe(tabList[0])

    return () => {
      if (tabList[0]) observer.unobserve(tabList[0])
    }
  }, [tabList])

  // Set the width of error strip width using js since it is position:fixed
  // and out of normal flow of the document
  React.useEffect(() => {
    if (errorStripRef.current?.parentElement) {
      const { width } = getComputedStyle(errorStripRef.current?.parentElement)
      width !== stickyWidth && setStickyWidth(width)
    }
  }, [props.formErrors, stickyWidth])

  if (!errorCount) {
    return <></>
  }

  return (
    <Layout.Horizontal
      className={cx(css.errorHeader, { [css.sticky]: stickyErrors })}
      flex={{ distribution: 'space-between' }}
      ref={ref => {
        errorStripRef.current = ref as HTMLDivElement
      }}
      style={{
        width: stickyErrors ? stickyWidth : ''
      }}
    >
      <Layout.Horizontal>
        <Icon name="warning-sign" intent={Intent.DANGER} margin={{ right: 'small' }} />
        <Text intent="danger">{getString('common.errorCount' as keyof StringsMap, { count: errorCount })}</Text>
        <Utils.WrapOptionalTooltip
          tooltip={
            <div className={css.runPipelineErrorDesc}>
              {errorStrings.map((errorMessage, index) => (
                <Text
                  intent="danger"
                  key={index}
                  font={{ variation: FontVariation.SMALL_BOLD }}
                  className={css.runPipelineErrorLine}
                >
                  {errorMessage}
                </Text>
              ))}
            </div>
          }
          tooltipProps={{
            position: PopoverPosition.BOTTOM,
            inheritDarkTheme: true,
            popoverClassName: css.runPipelineErrorPopover
          }}
        >
          <Text font={{ variation: FontVariation.TINY_SEMI }} color={Color.GREY_600} margin={{ left: 'small' }}>
            {getString('common.seeDetails')}
          </Text>
        </Utils.WrapOptionalTooltip>
      </Layout.Horizontal>
      {inputsList.length > 0 ? (
        <Layout.Horizontal>
          <Button
            intent="danger"
            disabled={highlighted === inputsList.length - 1}
            onClick={() => onNextHandler(1, inputsList, highlighted, setHighlighted, props.domRef)}
            variation={ButtonVariation.ICON}
            iconProps={{ size: 10 }}
            icon="main-chevron-down"
          />
          <Button
            intent="danger"
            disabled={highlighted <= 0}
            onClick={() => onNextHandler(-1, inputsList, highlighted, setHighlighted, props.domRef)}
            iconProps={{ size: 10 }}
            variation={ButtonVariation.ICON}
            icon="main-chevron-up"
          />
        </Layout.Horizontal>
      ) : null}
    </Layout.Horizontal>
  )
}
