/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import {
  Button,
  FlexExpander,
  ExpandingSearchInput,
  Layout,
  Text,
  Container,
  Popover,
  TableV2,
  useConfirmationDialog,
  useToaster
} from '@wings-software/uicore'
import { Classes, Menu, Position, Intent } from '@blueprintjs/core'
import type { CellProps, Renderer, Column } from 'react-table'
import { FontVariation, Color } from '@harness/design-system'
import { useParams, useHistory } from 'react-router-dom'
import { Page } from '@common/exports'
import { useFetchBudgetQuery, BudgetSummary } from 'services/ce/services'
import { useStrings } from 'framework/strings'
import { useDeleteBudget, Budget } from 'services/ce'
import { PageSpinner } from '@common/components'
import routes from '@common/RouteDefinitions'
import formatCost from '@ce/utils/formatCost'
import BudgetStatusBar from '@ce/components/BudgetStatusBar/BudgetStatusBar'
import useBudgetModal from '@ce/components/PerspectiveReportsAndBudget/PerspectiveCreateBudget'
import EmptyView from '@ce/images/empty-state.svg'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { PAGE_NAMES, USER_JOURNEY_EVENTS } from '@ce/TrackingEventsConstants'
import RbacButton from '@rbac/components/Button/Button'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import RbacMenuItem from '@rbac/components/MenuItem/MenuItem'
import css from './Budgets.module.scss'

interface BudgetMenuProps {
  onEdit: () => void
  budgetId: string
  handleDeleteBudget: (id: string, name: string) => void
  budgetName: string
}

const BudgetMenu: (props: BudgetMenuProps) => JSX.Element = ({ onEdit, handleDeleteBudget, budgetId, budgetName }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { getString } = useStrings()

  const getConfirmationDialogContent = (): JSX.Element => {
    return (
      <div>
        <Text>
          {getString('ce.budgets.confirmDeleteBudgetMsg', {
            name: budgetName
          })}
        </Text>
      </div>
    )
  }

  const { openDialog } = useConfirmationDialog({
    contentText: getConfirmationDialogContent(),
    titleText: getString('ce.budgets.confirmDeleteBudgetTitle'),
    confirmButtonText: getString('delete'),
    cancelButtonText: getString('cancel'),
    intent: Intent.DANGER,
    buttonIntent: Intent.DANGER,
    onCloseDialog: async (isConfirmed: boolean) => {
      if (isConfirmed) {
        budgetId && handleDeleteBudget(budgetId, budgetName)
      }
    }
  })

  return (
    <Popover
      isOpen={isOpen}
      onInteraction={nextOpenState => {
        setIsOpen(nextOpenState)
      }}
      className={Classes.DARK}
      position={Position.RIGHT_TOP}
    >
      <Button
        minimal
        icon="Options"
        onClick={e => {
          e.stopPropagation()
          setIsOpen(true)
        }}
      />
      <Menu>
        <RbacMenuItem
          text={getString('edit')}
          onClick={(e: any) => {
            e.stopPropagation()
            setIsOpen(false)
            onEdit()
          }}
          permission={{
            permission: PermissionIdentifier.EDIT_CCM_BUDGET,
            resource: {
              resourceType: ResourceType.CCM_BUDGETS
            }
          }}
        />
        <RbacMenuItem
          text={getString('delete')}
          onClick={(e: any) => {
            e.stopPropagation()
            setIsOpen(false)
            openDialog()
          }}
          permission={{
            permission: PermissionIdentifier.DELETE_CCM_BUDGET,
            resource: {
              resourceType: ResourceType.CCM_BUDGETS
            }
          }}
        />
      </Menu>
    </Popover>
  )
}

interface BudgetsListProps {
  budgetData: BudgetSummary[]
  handleDeleteBudget: (id: string, budgetName: string) => void
  handleEditBudget: (budget: BudgetSummary) => void
  navigateToBudgetDetailsPage: (id: string, name: string) => void
}

const BudgetsList: (props: BudgetsListProps) => JSX.Element | null = ({
  budgetData,
  handleDeleteBudget,
  handleEditBudget,
  navigateToBudgetDetailsPage
}) => {
  const { getString } = useStrings()

  const BudgetStatusCell: Renderer<CellProps<BudgetSummary>> = ({ row }) => {
    return <BudgetStatusBar rowData={row.original} />
  }

  const CostCell: Renderer<CellProps<BudgetSummary>> = cell => {
    return cell.value || cell.value === 0 ? (
      <Text font={{ variation: FontVariation.H5 }} color={Color.GREY_800}>
        {formatCost(cell.value)}
      </Text>
    ) : null
  }

  const NameCell: Renderer<CellProps<BudgetSummary>> = ({ row }) => {
    const rowData = row.original
    return (
      <Layout.Vertical>
        <Text color={Color.BLACK}>{rowData.name}</Text>
        <Text font={{ variation: FontVariation.SMALL }} color={Color.GREY_600}>
          {getString('ce.budgets.listPage.timePeriodRemaining', {
            scope: rowData.timeScope,
            remaining: rowData.timeLeft,
            unit: rowData.timeUnit
          })}
        </Text>
      </Layout.Vertical>
    )
  }

  const AlertCell: Renderer<CellProps<BudgetSummary>> = ({ row }) => {
    const mtdAlerts = (row.original.actualCostAlerts || []).map(e => `${e}%`)
    const forecastAlerts = (row.original.forecastCostAlerts || []).map(e => `${e}%`)
    return (
      <Layout.Vertical>
        <Text font={{ variation: FontVariation.SMALL }} color={Color.GREY_600}>
          {getString('ce.budgets.listPage.mtdAlert', {
            alert: mtdAlerts.length ? mtdAlerts.join(', ') : '-'
          })}
        </Text>
        <Text font={{ variation: FontVariation.SMALL }} color={Color.GREY_600}>
          {getString('ce.budgets.listPage.forecastAlert', {
            alert: forecastAlerts.length ? forecastAlerts.join(', ') : '-'
          })}
        </Text>
      </Layout.Vertical>
    )
  }

  const MenuCell: Renderer<CellProps<BudgetSummary>> = ({ row }) => {
    const budgetId = row.original.id
    const budget = row.original
    const budgetName = row.original.name

    const onEdit: () => void = () => {
      budgetId && handleEditBudget(budget)
    }

    return (
      <BudgetMenu handleDeleteBudget={handleDeleteBudget} onEdit={onEdit} budgetId={budgetId} budgetName={budgetName} />
    )
  }

  const columns: Column<BudgetSummary>[] = React.useMemo(
    () => [
      {
        accessor: 'name',
        Header: getString('ce.budgets.listPage.tableHeaders.name'),
        width: '25%',
        Cell: NameCell
      },
      {
        accessor: 'budgetAmount',
        Header: getString('ce.budgets.listPage.tableHeaders.budgetAmount'),
        width: '20%',
        Cell: CostCell
      },
      {
        Header: getString('ce.budgets.listPage.tableHeaders.monthToDate'),
        width: '35%',
        Cell: BudgetStatusCell
      },
      {
        Header: getString('ce.budgets.listPage.tableHeaders.alerts'),
        width: '15%',
        Cell: AlertCell
      },
      {
        Header: ' ',
        width: '5%',
        Cell: MenuCell
      }
    ],
    []
  )

  if (!budgetData.length) {
    return null
  }

  return (
    <TableV2<BudgetSummary>
      data={budgetData}
      onRowClick={row => {
        navigateToBudgetDetailsPage(row.id, row.name)
      }}
      columns={columns}
    />
  )
}

const Budgets: () => JSX.Element = () => {
  const history = useHistory()
  const { getString } = useStrings()
  const [{ data, fetching, error }, refetchBudget] = useFetchBudgetQuery()
  const [searchParam, setSearchParam] = useState<string>('')
  const { accountId } = useParams<{ accountId: string }>()
  const { trackEvent } = useTelemetry()
  const { openModal, hideModal } = useBudgetModal({
    onSuccess: () => {
      hideModal()
      refetchBudget({
        requestPolicy: 'network-only'
      })
    }
  })
  const { showSuccess, showError } = useToaster()

  const { mutate: deleteBudget, loading } = useDeleteBudget({ queryParams: { accountIdentifier: accountId } })

  const handleDeleteBudget: (id: string, budgetName: string) => void = async (id, budgetName) => {
    try {
      const deleted = await deleteBudget(id, {
        headers: {
          'content-type': 'application/json'
        }
      })

      if (deleted) {
        showSuccess(
          getString('ce.budgets.budgetDeletedTxt', {
            name: budgetName
          })
        )

        refetchBudget({
          requestPolicy: 'network-only'
        })
      }
    } catch (err) {
      showError(err?.data?.message || err?.message)
    }
  }

  const handleEditBudget: (budget: BudgetSummary) => void = budget => {
    openModal({
      isEdit: true,
      perspective: budget.perspectiveId,
      selectedBudget: budget as unknown as Budget,
      source: PAGE_NAMES.BUDGET_LANDING_PAGE
    })
  }

  const navigateToBudgetDetailsPage: (budgetId: string, budgetName: string) => void = (budgetId, budgetName) => {
    trackEvent(USER_JOURNEY_EVENTS.BUDGETS_LIST_ITEM_CLICK, { budgetId })
    history.push(
      routes.toCEBudgetDetails({
        accountId,
        budgetName,
        budgetId
      })
    )
  }

  const budgetData = (data?.budgetList || []) as unknown as BudgetSummary[]

  useEffect(() => {
    if (data) {
      trackEvent(PAGE_NAMES.BUDGET_LANDING_PAGE, { count: budgetData.length })
    }
  }, [data])

  const filteredBudgetData = budgetData.filter(budget => {
    if (!budget || !budget.name) {
      return false
    }
    return budget.name?.toLocaleLowerCase().indexOf(searchParam.toLowerCase()) < 0 ? false : true
  })

  const HeaderComponent = <Page.Header title={getString('ce.budgets.listPage.title')} breadcrumbs={<NGBreadcrumbs />} />

  useDocumentTitle(getString('ce.budgets.sideNavText'), true)

  const openNewBudgetModal = () => {
    trackEvent(USER_JOURNEY_EVENTS.CREATE_NEW_BUDGET, { pageName: PAGE_NAMES.BUDGET_LANDING_PAGE, isEditMode: false })
    openModal({
      isEdit: false,
      selectedBudget: {
        lastMonthCost: 0,
        forecastCost: 0
      },
      source: PAGE_NAMES.BUDGET_LANDING_PAGE
    })
  }

  const ToolBarComponent = (
    <Layout.Horizontal
      padding={{
        left: 'large',
        right: 'large',
        top: 'medium',
        bottom: 'medium'
      }}
      background="white"
    >
      <RbacButton
        intent="primary"
        text={getString('ce.budgets.listPage.newBudget')}
        icon="plus"
        iconProps={{ size: 10 }}
        margin={{ top: 'large' }}
        permission={{
          permission: PermissionIdentifier.EDIT_CCM_BUDGET,
          resource: {
            resourceType: ResourceType.CCM_BUDGETS
          }
        }}
        onClick={openNewBudgetModal}
      />
      <FlexExpander />
      <ExpandingSearchInput
        className={css.search}
        onChange={text => {
          setSearchParam(text.trim())
        }}
        placeholder={getString('ce.budgets.listPage.searchText')}
      />
    </Layout.Horizontal>
  )

  if (!fetching && !filteredBudgetData.length && !error) {
    return (
      <>
        {HeaderComponent}
        <Page.Body>
          {ToolBarComponent}

          <Container className={css.empty}>
            <img src={EmptyView} />
            <Text
              margin={{
                top: 'large',
                bottom: 'xsmall'
              }}
              font="small"
              style={{
                fontWeight: 600
              }}
              color={Color.GREY_500}
            >
              {getString('ce.pageErrorMsg.noBudgetMsg')}
            </Text>
            <Text font="small">{getString('ce.pageErrorMsg.noBudgetInfo')}</Text>
            <RbacButton
              intent="primary"
              text={getString('ce.budgets.listPage.newBudget')}
              icon="plus"
              iconProps={{ size: 10 }}
              margin={{ top: 'large' }}
              permission={{
                permission: PermissionIdentifier.EDIT_CCM_BUDGET,
                resource: {
                  resourceType: ResourceType.CCM_BUDGETS
                }
              }}
              onClick={openNewBudgetModal}
            />
          </Container>
        </Page.Body>
      </>
    )
  }

  return (
    <>
      {HeaderComponent}
      <Page.Body>
        {loading || fetching ? <PageSpinner /> : null}
        {ToolBarComponent}

        <Layout.Horizontal padding="large">
          <Text font={{ variation: FontVariation.H5 }}>
            {getString('ce.budgets.listPage.budgetCount', {
              count: filteredBudgetData?.length
            })}
          </Text>
        </Layout.Horizontal>
        <Container padding="large">
          <BudgetsList
            navigateToBudgetDetailsPage={navigateToBudgetDetailsPage}
            handleDeleteBudget={handleDeleteBudget}
            handleEditBudget={handleEditBudget}
            budgetData={filteredBudgetData}
          />
        </Container>
      </Page.Body>
    </>
  )
}

export default Budgets
