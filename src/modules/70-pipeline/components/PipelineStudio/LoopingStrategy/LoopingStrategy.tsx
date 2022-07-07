/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import {
  Button,
  ButtonVariation,
  Card,
  ConfirmationDialog,
  Container,
  Formik,
  Layout,
  Link,
  Text,
  useToggleOpen
} from '@harness/uicore'
import { clone, defaultTo, noop } from 'lodash-es'
import type { FormikProps } from 'formik'
import { Color, FontVariation } from '@harness/design-system'
import cx from 'classnames'
import { parse } from 'yaml'
import type { StrategyConfig } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import {
  AvailableStrategies,
  LoopingStrategyEnum,
  LoopingStrategy as Strategy
} from '@pipeline/components/PipelineStudio/LoopingStrategy/LoopingStrategyUtils'
import { YamlBuilderMemo } from '@common/components/YAMLBuilder/YamlBuilder'
import type { YamlBuilderHandlerBinding } from '@common/interfaces/YAMLBuilderProps'
import { usePipelineSchema } from '../PipelineSchema/PipelineSchemaContext'

import css from './LoopingStrategy.module.scss'

export interface LoopingStrategyProps {
  strategy?: StrategyConfig
  isReadonly?: boolean
  onUpdateStrategy?: (strategy: StrategyConfig) => void
}

const DOCUMENT_URL = 'https://ngdocs.harness.io/article/i36ibenkq2-step-skip-condition-settings'
const strategyEntries = Object.entries(AvailableStrategies) as [LoopingStrategyEnum, Strategy][]

export function LoopingStrategy({
  strategy = {},
  isReadonly,
  onUpdateStrategy = noop
}: LoopingStrategyProps): React.ReactElement {
  const { getString } = useStrings()
  const { loopingStrategySchema } = usePipelineSchema()
  const [yamlHandler, setYamlHandler] = useState<YamlBuilderHandlerBinding | undefined>()
  const callbackRef = React.useRef<(() => void) | null>(null)
  const {
    isOpen: isDeleteConfirmationOpen,
    open: openDeleteConfirmation,
    close: closeDeleteConfirmation
  } = useToggleOpen()
  const {
    isOpen: isToggleTypeConfirmationOpen,
    open: openToggleTypeConfirmation,
    close: closeToggleTypeConfirmation
  } = useToggleOpen()

  const initialSelectedStrategy = Object.keys(defaultTo(strategy, {}))[0] as LoopingStrategyEnum

  const onTextChange = (_formikProps: FormikProps<StrategyConfig>): void => {
    try {
      const newValues: StrategyConfig = parse(defaultTo(/* istanbul ignore next */ yamlHandler?.getLatestYaml(), ''))
      // formikProps.setValues(newValues)
      onUpdateStrategy(newValues)
    } catch {
      // this catch intentionally left empty
    }
  }

  const onChangeStrategy = (newStrategy: LoopingStrategyEnum, formikProps: FormikProps<StrategyConfig>): void => {
    const callback = (): void => {
      const newValues: StrategyConfig = { [newStrategy]: clone(AvailableStrategies[newStrategy].defaultValue) }
      formikProps.setValues(newValues)
      onUpdateStrategy(newValues)
      callbackRef.current = null
    }

    if (initialSelectedStrategy) {
      callbackRef.current = callback
      openToggleTypeConfirmation()
    } else {
      callback()
    }
  }

  const onDelete = (formikProps: FormikProps<StrategyConfig>): void => {
    const callback = (): void => {
      formikProps.setValues({})
      onUpdateStrategy({})
    }
    callbackRef.current = callback
    openDeleteConfirmation()
  }

  const handleCloseDeleteConfirmation = (confirm: boolean): void => {
    if (confirm) {
      /* istanbul ignore next */
      callbackRef.current?.()
    } else {
      callbackRef.current = null
    }
    closeDeleteConfirmation()
  }

  const handleCloseToggleTypeConfirmation = (confirm: boolean): void => {
    if (confirm) {
      /* istanbul ignore next */
      callbackRef.current?.()
    } else {
      callbackRef.current = null
    }
    closeToggleTypeConfirmation()
  }

  const renderCustomHeader = (): null => null

  return (
    <React.Fragment>
      <Formik initialValues={strategy} formName="loopingStrategy" onSubmit={noop}>
        {(formikProps: FormikProps<StrategyConfig>) => {
          const values = defaultTo(formikProps.values, {})
          const selectedStrategy = Object.keys(values)[0] as LoopingStrategyEnum
          const selectedStrategyMetaData = AvailableStrategies[selectedStrategy]

          return (
            <Container className={css.mainContainer}>
              <Layout.Vertical spacing={'medium'}>
                <Text color={Color.GREY_700} font={{ size: 'small' }}>
                  {getString('pipeline.loopingStrategy.subTitle', { maxCount: strategyEntries.length })}{' '}
                  <Link
                    rel="noreferrer"
                    color={Color.BLUE_400}
                    target="_blank"
                    href={DOCUMENT_URL}
                    font={{ size: 'small' }}
                  >
                    {getString('pipeline.loopingStrategy.learnMore')}
                  </Link>
                </Text>
                <Container>
                  <Layout.Horizontal
                    padding={{ top: 'large' }}
                    border={{ top: true, color: Color.GREY_200 }}
                    spacing={'medium'}
                  >
                    {strategyEntries.map(([key, item]) => (
                      <Card
                        key={key}
                        interactive={!isReadonly}
                        className={cx(css.strategyAnchor, {
                          [css.disabled]: isReadonly,
                          [css.selected]: selectedStrategy === key
                        })}
                        selected={selectedStrategy === key}
                        cornerSelected={selectedStrategy === key}
                        onClick={isReadonly ? noop : () => onChangeStrategy(key, formikProps)}
                        data-testid={key}
                      >
                        <Text font={{ variation: FontVariation.BODY }} color={Color.PRIMARY_7}>
                          {item.label}
                        </Text>
                      </Card>
                    ))}
                  </Layout.Horizontal>
                </Container>
                {selectedStrategyMetaData && (
                  <Container border={{ radius: 4 }} padding={'medium'}>
                    <Layout.Vertical spacing={'medium'}>
                      <Container>
                        <Layout.Horizontal flex={{ alignItems: 'center' }}>
                          <Container style={{ flexGrow: 1 }}>
                            <Layout.Vertical>
                              <Text font={{ variation: FontVariation.BODY, weight: 'semi-bold' }}>
                                {selectedStrategyMetaData.label}
                              </Text>
                              <Text color={Color.GREY_700} font={{ size: 'small' }}>
                                {getString(selectedStrategyMetaData.helperText)}{' '}
                                <Link
                                  rel="noreferrer"
                                  color={Color.BLUE_400}
                                  target="_blank"
                                  href={selectedStrategyMetaData.helperLink}
                                  font={{ size: 'small' }}
                                >
                                  {getString('learnMore')}
                                </Link>
                              </Text>
                            </Layout.Vertical>
                          </Container>
                          <Container>
                            <Button
                              variation={ButtonVariation.ICON}
                              icon={'main-trash'}
                              data-testid="delete"
                              onClick={() => onDelete(formikProps)}
                            />
                          </Container>
                        </Layout.Horizontal>
                      </Container>
                      <Container>
                        <YamlBuilderMemo
                          showSnippetSection={false}
                          fileName={''}
                          key={selectedStrategy}
                          entityType={'Pipelines'}
                          bind={setYamlHandler}
                          height="200px"
                          width="100%"
                          schema={/* istanbul ignore next */ loopingStrategySchema?.data?.schema}
                          existingJSON={formikProps.values}
                          renderCustomHeader={renderCustomHeader}
                          yamlSanityConfig={{
                            removeEmptyObject: false,
                            removeEmptyString: false,
                            removeEmptyArray: false
                          }}
                          onChange={() => onTextChange(formikProps)}
                        />
                      </Container>
                    </Layout.Vertical>
                  </Container>
                )}
              </Layout.Vertical>
            </Container>
          )
        }}
      </Formik>
      <ConfirmationDialog
        intent="danger"
        titleText={getString('pipeline.loopingStrategy.deleteModal.title')}
        contentText={getString('pipeline.loopingStrategy.deleteModal.content')}
        confirmButtonText={getString('applyChanges')}
        cancelButtonText={getString('cancel')}
        isOpen={isDeleteConfirmationOpen}
        onClose={handleCloseDeleteConfirmation}
      />
      <ConfirmationDialog
        intent="danger"
        titleText={getString('pipeline.loopingStrategy.toggleTypeModal.title')}
        contentText={getString('pipeline.loopingStrategy.toggleTypeModal.content')}
        confirmButtonText={getString('applyChanges')}
        cancelButtonText={getString('cancel')}
        isOpen={isToggleTypeConfirmationOpen}
        onClose={handleCloseToggleTypeConfirmation}
      />
    </React.Fragment>
  )
}
