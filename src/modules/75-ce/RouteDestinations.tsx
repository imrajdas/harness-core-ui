/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Route, useParams, Redirect, Switch } from 'react-router-dom'
import { createClient, Provider, dedupExchange, cacheExchange, fetchExchange } from 'urql'
import { requestPolicyExchange } from '@urql/exchange-request-policy'
import { get } from 'lodash-es'
import routes from '@common/RouteDefinitions'
import type { SidebarContext } from '@common/navigation/SidebarProvider'
import { accountPathProps, projectPathProps } from '@common/utils/routeUtils'
import { RouteWithLayout } from '@common/router'
import type { AccountPathProps, Module } from '@common/interfaces/RouteInterfaces'
import NotFoundPage from '@common/pages/404/NotFoundPage'
import { MinimalLayout } from '@common/layouts'
import SessionToken from 'framework/utils/SessionToken'
// eslint-disable-next-line no-restricted-imports
import ChildAppMounter from 'microfrontends/ChildAppMounter'

import CESideNav from '@ce/components/CESideNav/CESideNav'
import { ModuleName } from 'framework/types/ModuleName'
import { getConfig } from 'services/config'
import { LicenseRedirectProps, LICENSE_STATE_NAMES } from 'framework/LicenseStore/LicenseStoreContext'
import featureFactory from 'framework/featureStore/FeaturesFactory'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import { BannerType } from '@common/layouts/Constants'
import { FEATURE_USAGE_WARNING_LIMIT } from '@common/layouts/FeatureBanner'
import { PAGE_NAME } from '@common/pages/pageContext/PageName'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import AuditTrailFactory, { ResourceScope } from '@audit-trail/factories/AuditTrailFactory'
import type { ResourceDTO } from 'services/audit'
import CEHomePage from './pages/home/CEHomePage'
import CECODashboardPage from './pages/co-dashboard/CECODashboardPage'
import CECOCreateGatewayPage from './pages/co-create-gateway/CECOCreateGatewayPage'
import CECOEditGatewayPage from './pages/co-edit-gateway/CECOEditGatewayPage'
import CECOLoadBalancersPage from './pages/co-access-points/CECOAccessPointsPage'
import Budgets from './pages/budgets/Budgets'
import CETrialHomePage from './pages/home/CETrialHomePage'

import RecommendationList from './pages/recommendationList/RecommendationList'
import RecommendationDetailsPage from './pages/recommendationDetails/RecommendationDetailsPage'
import PerspectiveDetailsPage from './pages/perspective-details/PerspectiveDetailsPage'
import CreatePerspectivePage from './pages/perspective-builder/CreatePerspectivePage'
import PerspectiveListPage from './pages/perspective-list/PerspectiveListPage'
import WorkloadDetailsPage from './pages/workload-details/WorkloadDetailsPage'
import OverviewPage from './pages/overview/OverviewPage'
import NodeRecommendationDetailsPage from './pages/node-recommendation-details/NodeRecommendationDetailsPage'
import BudgetDetails from './pages/budget-details/BudgetDetails'
import NodeDetailsPage from './pages/node-details/NodeDetailsPage'
import AnomaliesOverviewPage from './pages/anomalies-overview/AnomaliesOverviewPage'
import formatCost from './utils/formatCost'
import BusinessMapping from './pages/business-mapping/BusinessMapping'
import ECSRecommendationDetailsPage from './pages/ecs-recommendation-details/ECSRecommendationDetailsPage'

featureFactory.registerFeaturesByModule('ce', {
  features: [FeatureIdentifier.PERSPECTIVES],
  renderMessage: (_, getString, additionalLicenseProps, usageAndLimitInfo) => {
    const { isFreeEdition } = additionalLicenseProps || {}
    const { limitData, usageData } = usageAndLimitInfo || {}

    const usageCost = get(usageData, 'usage.ccm.activeSpend.count', 0)
    const limitCost = get(limitData, 'limit.ccm.totalSpendLimit', 1)

    const usagePercentage = (usageCost / limitCost) * 100

    if (usageCost >= limitCost) {
      return isFreeEdition
        ? {
            message: () =>
              getString('ce.enforcementMessage.exceededSpendLimitFreePlan', {
                usage: formatCost(Number(usageCost), {
                  shortFormat: true
                }),
                limit: formatCost(Number(limitCost), {
                  shortFormat: true
                })
              }),
            bannerType: BannerType.LEVEL_UP
          }
        : {
            message: () => getString('ce.enforcementMessage.exceededSpendLimit'),
            bannerType: BannerType.OVERUSE
          }
    }

    if (usagePercentage > FEATURE_USAGE_WARNING_LIMIT) {
      return {
        message: () =>
          getString('ce.enforcementMessage.usageInfo', {
            percentage: Math.ceil(usagePercentage)
          }),
        bannerType: BannerType.INFO
      }
    }

    return {
      message: () => '',
      bannerType: BannerType.LEVEL_UP
    }
  }
})

// eslint-disable-next-line import/no-unresolved
const CcmMicroFrontendPath = React.lazy(() => import('ccmui/MicroFrontendApp'))

AuditTrailFactory.registerResourceHandler('PERSPECTIVE', {
  moduleIcon: { name: 'ccm-solid' },
  moduleLabel: 'common.purpose.ce.continuous',
  resourceLabel: 'ce.sideNav.perspective',
  resourceUrl: (resource: ResourceDTO, resourceScope: ResourceScope) => {
    const { accountIdentifier } = resourceScope
    return routes.toPerspectiveDetails({
      accountId: accountIdentifier,
      perspectiveId: resource.identifier,
      perspectiveName: resource.labels?.resourceName || resource.identifier
    })
  }
})

AuditTrailFactory.registerResourceHandler('PERSPECTIVE_BUDGET', {
  moduleIcon: { name: 'ccm-solid' },
  moduleLabel: 'common.purpose.ce.continuous',
  resourceLabel: 'ce.perspectives.budgets.perspectiveBudgets',
  resourceUrl: (resource: ResourceDTO, resourceScope: ResourceScope) => {
    const { accountIdentifier } = resourceScope
    return routes.toCEBudgetDetails({
      accountId: accountIdentifier,
      budgetId: resource.identifier,
      budgetName: resource.labels?.resourceName || resource.identifier
    })
  }
})

AuditTrailFactory.registerResourceHandler('PERSPECTIVE_REPORT', {
  moduleIcon: { name: 'ccm-solid' },
  moduleLabel: 'common.purpose.ce.continuous',
  resourceLabel: 'ce.perspectives.reports.perspectiveReport'
})

AuditTrailFactory.registerResourceHandler('COST_CATEGORY', {
  moduleIcon: { name: 'ccm-solid' },
  moduleLabel: 'common.purpose.ce.continuous',
  resourceLabel: 'ce.businessMapping.costCategory'
})

const CESideNavProps: SidebarContext = {
  navComponent: CESideNav,
  subtitle: 'CLOUD COST',
  title: 'Management',
  icon: 'ce-main'
}

const RedirectToModuleTrialHome = (): React.ReactElement => {
  const { accountId } = useParams<{
    accountId: string
  }>()

  return (
    <Redirect
      to={routes.toModuleTrialHome({
        accountId,
        module: 'ce'
      })}
    />
  )
}

const RedirectToOverviewPage = (): React.ReactElement => {
  const { accountId } = useParams<{
    accountId: string
  }>()

  return (
    <Redirect
      to={routes.toCEOverview({
        accountId
      })}
    />
  )
}

const RedirectToBudgetDetails = (): React.ReactElement => {
  const { accountId, budgetId, budgetName } = useParams<{
    accountId: string
    budgetId: string
    budgetName: string
  }>()

  return (
    <Redirect
      to={routes.toCEBudgetDetails({
        accountId,
        budgetName,
        budgetId
      })}
    />
  )
}

const RedirectToSubscriptions = (): React.ReactElement => {
  const { accountId } = useParams<{
    accountId: string
  }>()

  return (
    <Redirect
      to={routes.toSubscriptions({
        accountId,
        moduleCard: ModuleName.CE.toLowerCase() as Module
      })}
    />
  )
}

const RedirectToNewNodeRecommendationDetailsRoute = (): React.ReactElement => {
  const { recommendation, recommendationName, accountId } = useParams<{
    recommendationName: string
    recommendation: string
    accountId: string
  }>()
  return (
    <Redirect
      to={routes.toCENodeRecommendationDetails({
        accountId,
        recommendationName,
        recommendation
      })}
    />
  )
}

const licenseRedirectData: LicenseRedirectProps = {
  licenseStateName: LICENSE_STATE_NAMES.CCM_LICENSE_STATE,
  startTrialRedirect: RedirectToModuleTrialHome,
  expiredTrialRedirect: RedirectToSubscriptions
}

const getRequestOptions = (): Partial<RequestInit> => {
  const token = SessionToken.getToken()

  const headers: RequestInit['headers'] = {}

  if (token && token.length > 0) {
    headers.Authorization = `Bearer ${token}`
  }

  return { headers }
}

const CERoutes: React.FC = () => {
  const { accountId } = useParams<AccountPathProps>()
  const { CCM_MICRO_FRONTEND } = useFeatureFlags()
  const enableMicroFrontend = CCM_MICRO_FRONTEND

  const urqlClient = React.useMemo(() => {
    const url = getConfig(`ccm/api/graphql?accountIdentifier=${accountId}&routingId=${accountId}`)
    return createClient({
      url: url,
      fetchOptions: getRequestOptions,
      exchanges: [dedupExchange, requestPolicyExchange({}), cacheExchange, fetchExchange],
      requestPolicy: 'cache-first'
    })
  }, [accountId])

  return (
    <Provider value={urqlClient}>
      <Switch>
        <RouteWithLayout
          layout={MinimalLayout}
          path={routes.toModuleTrialHome({ ...accountPathProps, module: 'ce' })}
          exact
          pageName={PAGE_NAME.CETrialHomePage}
        >
          <CETrialHomePage />
        </RouteWithLayout>
        <RouteWithLayout
          licenseRedirectData={licenseRedirectData}
          path={routes.toCEHome({ ...accountPathProps })}
          exact
          pageName={PAGE_NAME.CEHomePage}
        >
          <CEHomePage />
        </RouteWithLayout>
        <RouteWithLayout licenseRedirectData={licenseRedirectData} path={routes.toCE({ ...accountPathProps })} exact>
          <RedirectToOverviewPage />
        </RouteWithLayout>
        <RouteWithLayout
          licenseRedirectData={licenseRedirectData}
          sidebarProps={CESideNavProps}
          path={routes.toCEOverview({ ...accountPathProps, ...projectPathProps })}
          pageName={PAGE_NAME.CEOverviewPage}
        >
          <OverviewPage />
        </RouteWithLayout>
        {/* <RouteWithLayout
          sidebarProps={CESideNavProps}
          path={routes.toCEDashboard({ ...accountPathProps, ...projectPathProps })}
          exact
        >
          <CEDashboardPage />
        </RouteWithLayout> */}
        <RouteWithLayout
          licenseRedirectData={licenseRedirectData}
          sidebarProps={CESideNavProps}
          path={routes.toCECORules({ ...accountPathProps, ...projectPathProps, params: '' })}
          exact
          pageName={PAGE_NAME.CECODashboardPage}
        >
          <CECODashboardPage />
        </RouteWithLayout>
        <RouteWithLayout
          licenseRedirectData={licenseRedirectData}
          sidebarProps={CESideNavProps}
          path={routes.toCECOCreateGateway({ ...accountPathProps, ...projectPathProps })}
          exact
          pageName={PAGE_NAME.CECOCreateGatewayPage}
        >
          <CECOCreateGatewayPage />
        </RouteWithLayout>
        <RouteWithLayout
          licenseRedirectData={licenseRedirectData}
          sidebarProps={CESideNavProps}
          path={routes.toCECOEditGateway({
            ...accountPathProps,
            ...projectPathProps,
            gatewayIdentifier: ':gatewayIdentifier'
          })}
          exact
          pageName={PAGE_NAME.CECOEditGatewayPage}
        >
          <CECOEditGatewayPage />
        </RouteWithLayout>
        <RouteWithLayout
          licenseRedirectData={licenseRedirectData}
          sidebarProps={CESideNavProps}
          path={routes.toCECOAccessPoints({ ...accountPathProps, ...projectPathProps })}
          exact
          pageName={PAGE_NAME.CECOLoadBalancersPage}
        >
          <CECOLoadBalancersPage />
        </RouteWithLayout>

        {!enableMicroFrontend ? (
          <RouteWithLayout
            licenseRedirectData={licenseRedirectData}
            sidebarProps={CESideNavProps}
            path={routes.toCEBudgets({ ...accountPathProps })}
            pageName={PAGE_NAME.CEBudgets}
            exact
          >
            <Budgets />
          </RouteWithLayout>
        ) : null}

        <RouteWithLayout
          licenseRedirectData={licenseRedirectData}
          sidebarProps={CESideNavProps}
          path={routes.toCEBudgetDetailsOld({
            ...accountPathProps,
            budgetId: ':budgetId',
            budgetName: ':budgetName'
          })}
          pageName={PAGE_NAME.CEBudgetDetails}
        >
          <RedirectToBudgetDetails />
        </RouteWithLayout>

        {!enableMicroFrontend ? (
          <RouteWithLayout
            licenseRedirectData={licenseRedirectData}
            sidebarProps={CESideNavProps}
            path={routes.toCEBudgetDetails({
              ...accountPathProps,
              budgetId: ':budgetId',
              budgetName: ':budgetName'
            })}
            pageName={PAGE_NAME.CEBudgetDetails}
          >
            <BudgetDetails />
          </RouteWithLayout>
        ) : null}

        <RouteWithLayout
          licenseRedirectData={licenseRedirectData}
          sidebarProps={CESideNavProps}
          path={routes.toCERecommendations({ ...accountPathProps, ...projectPathProps })}
          exact
          pageName={PAGE_NAME.CERecommendationList}
        >
          <RecommendationList />
        </RouteWithLayout>
        <RouteWithLayout
          licenseRedirectData={licenseRedirectData}
          sidebarProps={CESideNavProps}
          path={routes.toCERecommendationDetails({
            ...accountPathProps,
            ...projectPathProps,
            recommendationName: ':recommendationName',
            recommendation: ':recommendation'
          })}
          exact
          pageName={PAGE_NAME.CERecommendationDetailsPage}
        >
          <RecommendationDetailsPage />
        </RouteWithLayout>
        <RouteWithLayout
          licenseRedirectData={licenseRedirectData}
          sidebarProps={CESideNavProps}
          path={routes.toOldCENodeRecommendationDetails({
            ...accountPathProps,
            ...projectPathProps,
            recommendationName: ':recommendationName',
            recommendation: ':recommendation'
          })}
          exact
        >
          <RedirectToNewNodeRecommendationDetailsRoute />
        </RouteWithLayout>
        <RouteWithLayout
          licenseRedirectData={licenseRedirectData}
          sidebarProps={CESideNavProps}
          path={routes.toCENodeRecommendationDetails({
            ...accountPathProps,
            ...projectPathProps,
            recommendationName: ':recommendationName',
            recommendation: ':recommendation'
          })}
          exact
          pageName={PAGE_NAME.CENodeRecommendationDetailsPage}
        >
          <NodeRecommendationDetailsPage />
        </RouteWithLayout>
        <RouteWithLayout
          licenseRedirectData={licenseRedirectData}
          sidebarProps={CESideNavProps}
          path={routes.toCEECSRecommendationDetails({
            ...accountPathProps,
            ...projectPathProps,
            recommendationName: ':recommendationName',
            recommendation: ':recommendation'
          })}
          exact
          pageName={PAGE_NAME.CEECSRecommendationDetailsPage}
        >
          <ECSRecommendationDetailsPage />
        </RouteWithLayout>
        <RouteWithLayout
          sidebarProps={CESideNavProps}
          path={routes.toPerspectiveDetails({
            ...accountPathProps,
            perspectiveId: ':perspectiveId',
            perspectiveName: ':perspectiveName'
          })}
          exact
          pageName={PAGE_NAME.CEPerspectiveDetailsPage}
        >
          <PerspectiveDetailsPage />
        </RouteWithLayout>

        <RouteWithLayout
          licenseRedirectData={licenseRedirectData}
          sidebarProps={CESideNavProps}
          path={routes.toCECreatePerspective({
            ...accountPathProps,
            perspectiveId: ':perspectiveId'
          })}
          exact
          pageName={PAGE_NAME.CECreatePerspectivePage}
        >
          <CreatePerspectivePage />
        </RouteWithLayout>
        <RouteWithLayout
          licenseRedirectData={licenseRedirectData}
          sidebarProps={CESideNavProps}
          path={routes.toCEPerspectives({
            ...accountPathProps
          })}
          exact
          pageName={PAGE_NAME.CEPerspectiveListPage}
        >
          <PerspectiveListPage />
        </RouteWithLayout>
        <RouteWithLayout
          licenseRedirectData={licenseRedirectData}
          sidebarProps={CESideNavProps}
          path={routes.toCEPerspectiveWorkloadDetails({
            ...accountPathProps,
            perspectiveId: ':perspectiveId',
            perspectiveName: ':perspectiveName',
            clusterName: ':clusterName',
            namespace: ':namespace',
            workloadName: ':workloadName'
          })}
          exact
          pageName={PAGE_NAME.CEWorkloadDetailsPage}
        >
          <WorkloadDetailsPage />
        </RouteWithLayout>
        <RouteWithLayout
          licenseRedirectData={licenseRedirectData}
          sidebarProps={CESideNavProps}
          path={routes.toCERecommendationWorkloadDetails({
            ...accountPathProps,
            recommendation: ':recommendation',
            recommendationName: ':recommendationName',
            clusterName: ':clusterName',
            namespace: ':namespace',
            workloadName: ':workloadName'
          })}
          exact
          pageName={PAGE_NAME.CEWorkloadDetailsPage}
        >
          <WorkloadDetailsPage />
        </RouteWithLayout>
        <RouteWithLayout
          licenseRedirectData={licenseRedirectData}
          sidebarProps={CESideNavProps}
          path={routes.toCEPerspectiveNodeDetails({
            ...accountPathProps,
            perspectiveId: ':perspectiveId',
            perspectiveName: ':perspectiveName',
            clusterName: ':clusterName',
            nodeId: ':nodeId'
          })}
          exact
          pageName={PAGE_NAME.CENodeDetailsPage}
        >
          <NodeDetailsPage />
        </RouteWithLayout>
        <RouteWithLayout
          licenseRedirectData={licenseRedirectData}
          sidebarProps={CESideNavProps}
          path={routes.toCEAnomalyDetection({
            ...accountPathProps
          })}
          exact
          pageName={PAGE_NAME.CEAnomaliesOverviewPage}
        >
          <AnomaliesOverviewPage />
        </RouteWithLayout>

        <RouteWithLayout
          licenseRedirectData={licenseRedirectData}
          sidebarProps={CESideNavProps}
          path={routes.toBusinessMapping({ ...accountPathProps })}
          exact
          pageName={PAGE_NAME.CEBusinessMapping}
        >
          <BusinessMapping />
        </RouteWithLayout>

        <RouteWithLayout
          licenseRedirectData={licenseRedirectData}
          sidebarProps={CESideNavProps}
          path={routes.toCEOverview({ ...accountPathProps })}
          exact
          pageName={PAGE_NAME.CEOverviewPage}
        >
          <OverviewPage />
        </RouteWithLayout>

        {enableMicroFrontend ? (
          <RouteWithLayout
            path={[
              routes.toCEBudgets({ ...accountPathProps }),
              routes.toCEBudgetDetails({ ...accountPathProps, budgetId: ':budgetId', budgetName: ':budgetName' })
            ]}
            sidebarProps={CESideNavProps}
          >
            <ChildAppMounter ChildApp={CcmMicroFrontendPath} />
          </RouteWithLayout>
        ) : null}

        <Route path="*">
          <NotFoundPage />
        </Route>
      </Switch>
    </Provider>
  )
}

export default CERoutes
