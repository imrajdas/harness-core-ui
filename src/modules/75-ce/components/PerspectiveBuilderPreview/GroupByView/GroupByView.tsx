/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Container, Text, Layout, FlexExpander, Icon } from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import cx from 'classnames'
import { Menu, MenuItem, Popover, Position, Drawer } from '@blueprintjs/core'
import { useStrings } from 'framework/strings'
import {
  useFetchViewFieldsQuery,
  QlceViewFilterWrapperInput,
  useFetchPerspectiveFiltersValueQuery,
  QlceViewFieldInputInput,
  ViewChartType
} from 'services/ce/services'
import { getTimeFilters } from '@ce/utils/perspectiveUtils'

import { getGMTEndDateTime, getGMTStartDateTime } from '@ce/utils/momentUtils'
import type { TimeRangeFilterType } from '@ce/types'

import BusinessMappingBuilder from '@ce/components/BusinessMappingBuilder/BusinessMappingBuilder'
import RbacButton from '@rbac/components/Button/Button'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import GroupByViewSubMenu from './GroupByViewSubMenu'
import css from '../PerspectiveBuilderPreview.module.scss'

interface GroupByViewProps {
  groupBy: QlceViewFieldInputInput
  setGroupBy: (groupBy: QlceViewFieldInputInput) => void
  chartType: ViewChartType
  setChartType: (type: ViewChartType) => void
  timeRange: TimeRangeFilterType
  showBusinessMappingButton?: boolean
}

const GroupByView: React.FC<GroupByViewProps> = ({
  groupBy,
  setGroupBy,
  chartType,
  setChartType,
  timeRange,
  showBusinessMappingButton
}) => {
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false)

  const { perspectiveId } = useParams<{ perspectiveId: string }>()

  const { getString } = useStrings()

  const [result, refetch] = useFetchViewFieldsQuery({
    variables: {
      filters: [{ viewMetadataFilter: { viewId: perspectiveId, isPreview: true } } as QlceViewFilterWrapperInput]
    }
  })
  const { data, fetching } = result

  const [labelResult] = useFetchPerspectiveFiltersValueQuery({
    variables: {
      filters: [
        ...getTimeFilters(getGMTStartDateTime(timeRange.from), getGMTEndDateTime(timeRange.to)),
        {
          idFilter: {
            field: {
              fieldId: 'labels.key',
              fieldName: '',
              identifier: 'LABEL'
            },
            operator: 'IN',
            values: []
          }
        } as unknown as QlceViewFilterWrapperInput
      ],
      offset: 0,
      limit: 100
    }
  })

  const { data: labelResData } = labelResult

  const labelData = labelResData?.perspectiveFilters?.values

  const fieldIdentifierData = data?.perspectiveFields?.fieldIdentifierData

  const PopoverContent =
    fieldIdentifierData && fieldIdentifierData.length ? (
      <Menu>
        {fieldIdentifierData.map(field => {
          if (field) {
            return (
              <MenuItem className={css.menuItem} key={field.identifier} text={field.identifierName}>
                <GroupByViewSubMenu setGroupBy={setGroupBy} labelData={labelData || []} field={field} />
              </MenuItem>
            )
          }
          return null
        })}
      </Menu>
    ) : /* istanbul ignore next */ undefined

  return (
    <Layout.Horizontal
      spacing="small"
      style={{
        alignItems: 'center'
      }}
    >
      <Text font={{ variation: FontVariation.SMALL }} color={Color.GREY_400}>
        {getString('ce.perspectives.createPerspective.preview.groupBy')}
      </Text>
      <Popover
        disabled={fetching}
        position={Position.BOTTOM_LEFT}
        modifiers={{
          arrow: { enabled: false },
          flip: { enabled: true },
          keepTogether: { enabled: true },
          preventOverflow: { enabled: true }
        }}
        content={PopoverContent}
      >
        <Container
          background={Color.GREY_100}
          className={cx(css.groupBySelect, { [css.groupBySelectLoading]: fetching })}
        >
          {fetching ? (
            <Icon name="spinner" />
          ) : (
            <Text font={{ variation: FontVariation.SMALL }} background={Color.GREY_100} rightIcon="chevron-down">
              {groupBy.fieldName}
            </Text>
          )}
        </Container>
      </Popover>
      {showBusinessMappingButton ? (
        <RbacButton
          minimal
          icon="plus"
          intent="primary"
          permission={{
            permission: PermissionIdentifier.EDIT_CCM_COST_CATEGORY,
            resource: {
              resourceType: ResourceType.CCM_COST_CATEGORY
            }
          }}
          onClick={() => setDrawerOpen(true)}
          text={getString('ce.businessMapping.newButton')}
        />
      ) : null}
      <FlexExpander />
      <Icon
        name="timeline-bar-chart"
        size={18}
        onClick={() => {
          setChartType(ViewChartType.StackedTimeSeries)
        }}
        color={chartType === ViewChartType.StackedTimeSeries ? Color.PRIMARY_6 : Color.GREY_500}
      />
      <Icon
        name="timeline-area-chart"
        size={20}
        onClick={() => {
          setChartType(ViewChartType.StackedLineChart)
        }}
        color={chartType === ViewChartType.StackedLineChart ? Color.PRIMARY_6 : Color.GREY_500}
      />
      <Drawer
        autoFocus
        enforceFocus
        hasBackdrop
        usePortal
        canOutsideClickClose
        canEscapeKeyClose
        position={Position.RIGHT}
        isOpen={drawerOpen}
        onClose={
          /* istanbul ignore next */ () => {
            setDrawerOpen(false)
          }
        }
      >
        <BusinessMappingBuilder
          selectedBM={{}}
          onSave={
            /* istanbul ignore next */ () => {
              refetch({
                requestPolicy: 'cache-and-network'
              })
              setDrawerOpen(false)
            }
          }
        />
      </Drawer>
    </Layout.Horizontal>
  )
}

export default GroupByView
