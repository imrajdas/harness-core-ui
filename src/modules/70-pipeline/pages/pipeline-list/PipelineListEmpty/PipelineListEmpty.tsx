/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Color } from '@harness/design-system'
import { Button, ButtonVariation, Icon, Layout, Text } from '@wings-software/uicore'
import React, { ReactElement, ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import type { Module } from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'
import CIPipelineIllustration from '../images/ci-pipeline-illustration.svg'
import CDPipelineIllustration from '../images/cd-pipeline-illustration.svg'
import CFPipelineIllustration from '../images/cf-pipeline-illustration.svg'
import type { PipelineListPagePathParams } from '../types'
import css from './PipelineListEmpty.module.scss'

interface PipelineListEmptyProps {
  hasFilter: boolean
  resetFilter: () => void
  createPipeline: ReactNode
}

export function PipelineListEmpty({ hasFilter, resetFilter, createPipeline }: PipelineListEmptyProps): ReactElement {
  const { getString } = useStrings()
  const { module } = useParams<PipelineListPagePathParams>()
  const illustration: Partial<Record<Module, string>> = {
    ci: CIPipelineIllustration,
    cd: CDPipelineIllustration,
    cf: CFPipelineIllustration
  }

  return (
    <div className={css.noPipelineSection}>
      <Layout.Vertical spacing="small" flex={{ justifyContent: 'center', alignItems: 'center' }} width={720}>
        {hasFilter ? (
          <>
            <Icon size={50} name={module === 'ci' ? 'ci-main' : 'cd-main'} margin={{ bottom: 'large' }} />
            <Text
              margin={{ top: 'large', bottom: 'small' }}
              font={{ weight: 'bold', size: 'medium' }}
              color={Color.GREY_800}
            >
              {getString('common.filters.noMatchingFilterData')}
            </Text>
            <Button
              text={getString('common.filters.clearFilters')}
              variation={ButtonVariation.LINK}
              onClick={resetFilter}
            />
          </>
        ) : (
          <>
            <img src={illustration[module]} className={css.image} />
            <Text className={css.noPipelineText} margin={{ top: 'medium', bottom: 'small' }}>
              {getString('pipeline.noPipelineText')}
            </Text>
            <Text className={css.aboutPipeline} margin={{ top: 'xsmall', bottom: 'xlarge' }}>
              {getString('pipeline-list.aboutPipeline')}
            </Text>
            {createPipeline}
          </>
        )}
      </Layout.Vertical>
    </div>
  )
}
