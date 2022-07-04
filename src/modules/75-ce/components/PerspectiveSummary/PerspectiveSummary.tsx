/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo, useState } from 'react'
import {
  Layout,
  Card,
  Text,
  Container,
  FlexExpander,
  Icon,
  Carousel,
  Button,
  Link,
  ButtonSize,
  ButtonVariation
} from '@wings-software/uicore'
import cx from 'classnames'
import { FontVariation, Color } from '@harness/design-system'
import { useHistory, useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'
import {
  PerspectiveTrendStats,
  Maybe,
  useFetchPerspectiveBudgetQuery,
  BudgetSummary,
  K8sRecommendationFilterDtoInput
} from 'services/ce/services'
import useBudgetModal from '@ce/components/PerspectiveReportsAndBudget/PerspectiveCreateBudget'
import formatCost from '@ce/utils/formatCost'
import { useGetLastMonthCost, useGetForecastCost } from 'services/ce'

import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import routes from '@common/RouteDefinitions'
import { getViewFilterForId } from '@ce/utils/perspectiveUtils'
import { PAGE_NAMES } from '@ce/TrackingEventsConstants'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { usePermission } from '@rbac/hooks/usePermission'
import RbacButton from '@rbac/components/Button/Button'
import RecommendationSummaryCard from './RecommendationSummaryCard'
import css from './PerspectiveSummary.module.scss'

const StatsTrendRenderer: React.FC<{ val: number }> = ({ val }) => {
  if (+val === 0) {
    return null
  }
  if (val < 0) {
    return (
      <Text
        iconProps={{
          color: 'green500'
        }}
        icon="caret-down"
        color="green500"
      >
        {`${val * -1}%`}
      </Text>
    )
  }
  return (
    <Text
      iconProps={{
        color: 'red500'
      }}
      icon="caret-up"
      color="red500"
    >
      {`${val}%`}
    </Text>
  )
}

interface CostCardProps {
  fetching: boolean
  statsLabel: string | undefined
  statsValue: string | undefined
  statsTrend: any
  statsDescription: string | undefined
  isEmpty: boolean
  showTrend?: boolean
}

const CostCard: (val: CostCardProps) => JSX.Element = ({
  fetching,
  statsLabel,
  statsValue,
  statsTrend,
  statsDescription,
  isEmpty,
  showTrend = true
}) => {
  if (fetching) {
    return (
      <Card elevation={1} interactive={false}>
        <Container className={cx(css.mainCard, css.loadingContainer)}>
          <Icon name="spinner" color="blue500" size={30} />
        </Container>
      </Card>
    )
  }

  return (
    <Card elevation={1} interactive={false}>
      <Container className={css.mainCard}>
        {!isEmpty ? (
          <>
            <Text color={Color.GREY_500} font="small">
              {statsLabel}
            </Text>
            <Layout.Horizontal
              style={{
                alignItems: 'center'
              }}
              margin={{
                top: 'small',
                bottom: 'small'
              }}
            >
              <Text font={{ variation: FontVariation.H3 }}>{statsValue}</Text>
              <FlexExpander />
              {showTrend && <StatsTrendRenderer val={statsTrend} />}
            </Layout.Horizontal>

            <Text color="grey400" font="xsmall">
              {statsDescription}
            </Text>
          </>
        ) : null}
      </Container>
    </Card>
  )
}

const BAR_WIDTH = 298
interface BudgetCardProps {
  budgetData: BudgetSummary
  canEdit: boolean
}

const BudgetCard: (props: BudgetCardProps) => JSX.Element | null = ({ budgetData, canEdit }) => {
  const { accountId } = useParams<AccountPathProps>()
  const { getString } = useStrings()
  const { actualCost, budgetAmount } = budgetData
  const history = useHistory()

  const percentage = Math.round((actualCost * 100) / (budgetAmount || 1))

  let width = BAR_WIDTH

  if (percentage > 100) {
    width = BAR_WIDTH * (budgetAmount / actualCost)
  }

  let intentColor = Color.GREEN_500
  if (percentage > 50) {
    intentColor = Color.ORANGE_500
  }
  if (percentage > 90) {
    intentColor = Color.RED_500
  }

  return (
    <Container className={cx(css.budgetCard)}>
      <Layout.Horizontal>
        <Text color={Color.GREY_500} font={FontVariation.SMALL}>
          {getString('ce.perspectives.budgets.budgetMonthlyTxt', { period: budgetData.timeScope })}
        </Text>
        <FlexExpander />
        <Link
          className={css.viewBudgetLink}
          withoutHref
          onClick={() =>
            history.push(
              routes.toCEBudgetDetails({
                budgetId: budgetData.id,
                budgetName: budgetData.name,
                accountId: accountId
              })
            )
          }
          size={ButtonSize.SMALL}
          padding="none"
          margin="none"
          font={FontVariation.SMALL}
          variation={ButtonVariation.LINK}
          disabled={!canEdit}
        >
          {getString('ce.perspectives.budgets.viewText')}
        </Link>
      </Layout.Horizontal>

      <Layout.Horizontal
        margin={{
          top: 'small',
          bottom: 'small'
        }}
        spacing="xsmall"
        style={{
          alignItems: 'flex-end'
        }}
      >
        <Text font={{ variation: FontVariation.H3 }}>{formatCost(budgetAmount)}</Text>
        <Text className={css.thisMonthText} color={Color.GREY_400} font={{ variation: FontVariation.TINY }}>
          {getString('ce.perspectives.budgets.thisMonth')}
        </Text>
      </Layout.Horizontal>
      <Layout.Horizontal spacing="xsmall">
        {percentage > 100 ? (
          <>
            <Text className={css.spendText} color={Color.GREY_500} font={{ variation: FontVariation.TINY }}>
              {getString('ce.perspectives.budgets.spendExceededBy')}
            </Text>
            <Text color="red500" font={{ variation: FontVariation.TINY_SEMI }}>
              {formatCost(actualCost - budgetAmount)}
            </Text>
          </>
        ) : (
          <>
            <Text className={css.spendText} color={Color.GREY_500} font={{ variation: FontVariation.TINY }}>
              {getString('ce.perspectives.budgets.monthToDateSpend')}
            </Text>
            <Text color={Color.GREY_500} font={{ variation: FontVariation.TINY_SEMI }}>{`${percentage}%`}</Text>
            <Text color={Color.GREY_500} font={{ variation: FontVariation.TINY }}>
              {getString('ce.perspectives.budgets.budgetSmallTxt')}
            </Text>
          </>
        )}
      </Layout.Horizontal>
      <div className={cx(css.indicatorBar, css.indicatorBarWithPattern)}></div>
      <Container width={width} background={intentColor} className={css.indicatorBar}></Container>
    </Container>
  )
}

const BudgetCardsCarousel: () => JSX.Element | null = () => {
  const { perspectiveId, accountId, perspectiveName } = useParams<{
    perspectiveId: string
    accountId: string
    perspectiveName: string
  }>()
  const [activeSlide, setActiveSlide] = useState<number>(1)
  const { getString } = useStrings()

  const [canEdit] = usePermission(
    {
      resource: {
        resourceType: ResourceType.CCM_BUDGETS
      },
      permissions: [PermissionIdentifier.EDIT_CCM_BUDGET]
    },
    []
  )

  const [{ data, fetching: budgetFetching }, refetchBudget] = useFetchPerspectiveBudgetQuery({
    variables: {
      perspectiveId: perspectiveId
    }
  })

  const budgetData = data?.budgetSummaryList

  const { openModal, hideModal } = useBudgetModal({
    onSuccess: () => {
      hideModal()
      refetchBudget({
        requestPolicy: 'cache-and-network'
      })
    }
  })

  const { data: lmc } = useGetLastMonthCost({
    queryParams: { accountIdentifier: accountId, perspectiveId }
  })

  const { data: fc } = useGetForecastCost({
    queryParams: { accountIdentifier: accountId, perspectiveId }
  })

  if (budgetFetching) {
    return (
      <Card className={css.cardContainer} elevation={1} interactive={false}>
        <Container className={cx(css.budgetCard, { [css.loadingContainer]: budgetFetching })}>
          <Icon name="spinner" color="blue500" size={30} />
        </Container>
      </Card>
    )
  }

  if (!budgetData?.length) {
    return (
      <Card className={css.cardContainer} elevation={1} interactive={false}>
        <Container className={cx(css.budgetCard)}>
          <Text color="grey800" font="small">
            {getString('ce.perspectives.budgets.title')}
          </Text>
          <Text
            margin={{
              top: 'small',
              bottom: 'small'
            }}
            color="black"
            font={{ weight: 'semi-bold', size: 'medium' }}
          >
            {'$---'}
          </Text>
          <RbacButton
            text={getString('ce.perspectives.budgets.addBudget')}
            variation={ButtonVariation.LINK}
            className={css.addBudgetText}
            onClick={() => {
              openModal({
                isEdit: false,
                perspectiveName: perspectiveName,
                perspective: perspectiveId,
                selectedBudget: {
                  lastMonthCost: lmc?.data,
                  forecastCost: fc?.data
                },
                source: PAGE_NAMES.PERSPECTIVE_DETAILS_PAGE
              })
            }}
            permission={{
              permission: PermissionIdentifier.EDIT_CCM_BUDGET,
              resource: {
                resourceType: ResourceType.CCM_BUDGETS
              }
            }}
          />
        </Container>
      </Card>
    )
  }

  return (
    <Card className={css.cardContainer} elevation={1} interactive={false}>
      <Carousel
        className={css.carousel}
        onChange={setActiveSlide}
        hideIndicators={true}
        previousElement={
          activeSlide > 1 ? (
            <Button
              intent="primary"
              className={css.prevButtons}
              icon="main-caret-left"
              minimal
              iconProps={{
                size: 8,
                color: Color.PRIMARY_7
              }}
            />
          ) : (
            <span />
          )
        }
        nextElement={
          activeSlide < budgetData.length ? (
            <Button
              intent="primary"
              className={css.nextButton}
              icon="main-caret-right"
              minimal
              iconProps={{
                size: 8,
                color: Color.PRIMARY_7
              }}
            />
          ) : (
            <span />
          )
        }
      >
        {budgetData.map(bData => (
          <BudgetCard key={bData?.id} budgetData={bData as BudgetSummary} canEdit={canEdit} />
        ))}
      </Carousel>
    </Card>
  )
}

interface PerspectiveSummaryProps {
  fetching: boolean
  data: Maybe<PerspectiveTrendStats> | undefined
  forecastedCostData: Maybe<PerspectiveTrendStats> | undefined
  errors?: any[] | null
  isDefaultPerspective: boolean
  hasClusterAsSource: boolean
}

const PerspectiveSummary: React.FC<PerspectiveSummaryProps> = ({
  fetching,
  data,
  forecastedCostData,
  isDefaultPerspective,
  hasClusterAsSource
}) => {
  const { perspectiveId } = useParams<{
    perspectiveId: string
  }>()

  let showForecastedCostCard = true
  if (!fetching && !forecastedCostData?.cost?.statsValue) {
    showForecastedCostCard = false
  }

  const recommendationFilters = useMemo(
    () =>
      ({
        perspectiveFilters: [getViewFilterForId(perspectiveId)]
      } as K8sRecommendationFilterDtoInput),
    [perspectiveId]
  )

  return (
    <Layout.Horizontal margin="xlarge" spacing="large">
      <CostCard
        fetching={fetching}
        statsLabel={data?.cost?.statsLabel}
        statsDescription={data?.cost?.statsDescription}
        statsTrend={data?.cost?.statsTrend}
        statsValue={data?.cost?.statsValue}
        isEmpty={!data?.cost}
      />
      {!isDefaultPerspective && <BudgetCardsCarousel />}
      {showForecastedCostCard && (
        <CostCard
          fetching={fetching}
          statsLabel={forecastedCostData?.cost?.statsLabel}
          statsDescription={forecastedCostData?.cost?.statsDescription}
          statsTrend={forecastedCostData?.cost?.statsTrend}
          statsValue={forecastedCostData?.cost?.statsValue}
          isEmpty={!forecastedCostData?.cost}
          showTrend={false}
        />
      )}
      {hasClusterAsSource && <RecommendationSummaryCard filters={recommendationFilters} />}
    </Layout.Horizontal>
  )
}

export default PerspectiveSummary
