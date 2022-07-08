/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import type { DashboardModel } from 'services/custom-dashboards'
import { DashboardType } from '@dashboards/types/DashboardTypes'
import moduleTagCss from '@dashboards/common/ModuleTags.module.scss'

export interface DashboardTagProps {
  dashboard?: DashboardModel
}

const DashboardTags: React.FC<DashboardTagProps> = ({ dashboard }) => {
  const { getString } = useStrings()
  return (
    <Container className={moduleTagCss.predefinedTags}>
      {dashboard?.type === DashboardType.SHARED && (
        <section key={`harness-tag-${dashboard.id}`} className={moduleTagCss.harnessTag}>
          {getString('dashboards.modules.harness')}
        </section>
      )}
      {dashboard?.data_source.map(tag => {
        if (tag === 'CE') {
          return (
            <section key={`tag-${tag.toLowerCase()}-${dashboard.id}`} className={moduleTagCss.ceTag}>
              {getString('common.purpose.ce.cloudCost')}
            </section>
          )
        }
        if (tag === 'CI') {
          return (
            <section key={`tag-${tag.toLowerCase()}-${dashboard.id}`} className={moduleTagCss.ciTag}>
              {getString('buildsText')}
            </section>
          )
        }
        if (tag === 'CD') {
          return (
            <section key={`tag-${tag.toLowerCase()}-${dashboard.id}`} className={moduleTagCss.cdTag}>
              {getString('deploymentsText')}
            </section>
          )
        }
        if (tag === 'CF') {
          return (
            <section key={`tag-${tag.toLowerCase()}-${dashboard.id}`} className={moduleTagCss.cfTag}>
              {getString('common.purpose.cf.continuous')}
            </section>
          )
        }
        if (tag === 'STO') {
          return (
            <section key={`tag-${tag.toLowerCase()}-${dashboard.id}`} className={moduleTagCss.stoTag}>
              {getString('common.purpose.sto.continuous')}
            </section>
          )
        }
        return <></>
      })}
      {dashboard?.description &&
        dashboard.type === DashboardType.ACCOUNT &&
        dashboard?.description
          .split(',')
          .filter((tag: string) => !!tag)
          .map((tag: string) => (
            <section className={moduleTagCss.customTag} key={`custom-tag-${tag.toLowerCase()}-${dashboard.id}`}>
              {tag}
            </section>
          ))}
    </Container>
  )
}

export default DashboardTags
