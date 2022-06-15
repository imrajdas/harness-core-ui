/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Heading,
  Layout,
  Tabs,
  Tab,
  Icon,
  Text,
  HarnessDocTooltip,
  PageHeader,
  PageBody,
  PageSpinner
} from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { Breadcrumbs } from '@common/components/Breadcrumbs/Breadcrumbs'
import { useStrings } from 'framework/strings'
import routes from '@common/RouteDefinitions'
import { useGetPerspective, CEView } from 'services/ce/'

import PerspectivePreferences from '@ce/components/PerspectivePreferences/PerspectivePreferences'
import PerspectiveBuilder from '../../components/PerspectiveBuilder'
import ReportsAndBudgets from '../../components/PerspectiveReportsAndBudget/PerspectiveReportsAndBudgets'
import css from './CreatePerspectivePage.module.scss'

const PerspectiveHeader: React.FC<{ title: string }> = ({ title }) => {
  const { accountId } = useParams<{ perspectiveId: string; accountId: string }>()

  return (
    <Layout.Horizontal>
      <Layout.Vertical>
        <Breadcrumbs
          links={[
            {
              url: routes.toCEPerspectives({ accountId }),
              label: 'Perspectives'
            },
            {
              label: '',
              url: '#'
            }
          ]}
        />
        <Heading color="grey800" level={2}>
          {title}
        </Heading>
      </Layout.Vertical>
    </Layout.Horizontal>
  )
}

const CreatePerspectivePage: React.FC = () => {
  const { getString } = useStrings()

  const tabHeadings = [
    getString('ce.perspectives.createPerspective.tabHeaders.perspectiveBuilder'),
    getString('ce.perspectives.createPerspective.tabHeaders.reportsAndBudget'),
    getString('ce.perspectives.createPerspective.tabHeaders.preferences')
  ]
  const [selectedTabId, setSelectedTabId] = useState(tabHeadings[0])

  const [perspectiveData, setPerspectiveData] = useState<CEView | null>(null)
  const [updatePayload, setUpdatePayload] = useState<CEView | null>(null)

  const { perspectiveId, accountId } = useParams<{
    perspectiveId: string
    accountId: string
  }>()

  const {
    data: perspectiveRes,
    loading,
    error
  } = useGetPerspective({
    queryParams: {
      perspectiveId: perspectiveId,
      accountIdentifier: accountId
    }
  })

  useEffect(() => {
    if (perspectiveRes?.data) {
      const data = perspectiveRes.data
      setPerspectiveData(data)
    }
  }, [perspectiveRes?.data])

  // const perspectiveData = perspectiveRes?.resource

  if (error) {
    const errorMessage = (error.data as any).message
    return (
      <>
        <PageHeader title={<PerspectiveHeader title={perspectiveData?.name || perspectiveId} />} />
        <PageBody>
          <Text
            margin="xxxlarge"
            color="red800"
            icon="error"
            iconProps={{
              color: 'red800'
            }}
          >
            {errorMessage}
          </Text>
        </PageBody>
      </>
    )
  }

  return (
    <>
      <PageHeader title={<PerspectiveHeader title={perspectiveData?.name || perspectiveId} />} />
      {loading && <PageSpinner />}
      <PageBody>
        {perspectiveData && (
          <div className={css.mainContainer}>
            <div></div>
            <Tabs
              id="perspectiveBuilder"
              onChange={(id: string) => setSelectedTabId(id)}
              selectedTabId={selectedTabId}
              data-tabId={selectedTabId}
            >
              <Tab
                id={tabHeadings[0]}
                panel={
                  <PerspectiveBuilder
                    perspectiveData={perspectiveData}
                    onNext={(resource, payload) => {
                      setSelectedTabId(tabHeadings[1])
                      setPerspectiveData(resource)
                      setUpdatePayload(payload)
                    }}
                  />
                }
                panelClassName={css.panelClass}
                title={
                  <>
                    <span data-tooltip-id="perspectiveBuilder" className={css.tab}>
                      {tabHeadings[0]}
                    </span>
                    <HarnessDocTooltip tooltipId="perspectiveBuilder" useStandAlone={true} />
                  </>
                }
                data-testid={tabHeadings[0]}
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
                disabled={selectedTabId === tabHeadings[0]}
                id={tabHeadings[1]}
                panelClassName={css.panelClass}
                title={
                  <>
                    <span data-tooltip-id="perspectiveReportsAndBudget" className={css.tab}>
                      {tabHeadings[1]}
                    </span>
                    <HarnessDocTooltip tooltipId="perspectiveReportsAndBudget" useStandAlone={true} />
                  </>
                }
                panel={
                  <ReportsAndBudgets
                    onPrevButtonClick={() => {
                      setSelectedTabId(tabHeadings[0])
                    }}
                    values={perspectiveData}
                    onNext={() => {
                      setSelectedTabId(tabHeadings[2])
                    }}
                  />
                }
                data-testid={tabHeadings[1]}
              />
              <Icon
                name="chevron-right"
                height={20}
                size={20}
                margin={{ right: 'small', left: 'small' }}
                color={Color.GREY_400}
                style={{ alignSelf: 'center' }}
              />
              <Tab
                disabled={selectedTabId !== tabHeadings[2]}
                id={tabHeadings[2]}
                panelClassName={css.panelClass}
                title={
                  <>
                    <span data-tooltip-id="perspectivePreferences" className={css.tab}>
                      {tabHeadings[2]}
                    </span>
                    <HarnessDocTooltip tooltipId="perspectivePreferences" useStandAlone={true} />
                  </>
                }
                panel={
                  <PerspectivePreferences
                    perspectiveData={perspectiveData}
                    onPrevButtonClick={() => {
                      setSelectedTabId(tabHeadings[1])
                    }}
                    updatePayload={updatePayload}
                  />
                }
                data-testid={tabHeadings[2]}
              />
            </Tabs>
          </div>
        )}
      </PageBody>
    </>
  )
}

export default CreatePerspectivePage
