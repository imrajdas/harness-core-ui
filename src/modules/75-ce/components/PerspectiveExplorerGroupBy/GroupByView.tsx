/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { TextInput, Button } from '@wings-software/uicore'
import { Popover, Position, PopoverInteractionKind, Classes, MenuItem } from '@blueprintjs/core'
import cx from 'classnames'
import { useStrings } from 'framework/strings'
import {
  ViewFieldIdentifier,
  QlceViewFieldInputInput,
  Maybe,
  QlceViewFieldIdentifierData,
  QlceViewField
} from 'services/ce/services'
import type { setGroupByFn } from '@ce/types'
import { usePermission } from '@rbac/hooks/usePermission'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import css from './GroupByView.module.scss'

interface BaseGroupByProps {
  groupBy: QlceViewFieldInputInput
  setGroupBy: setGroupByFn
}

interface GroupByDropDownProps {
  data: QlceViewFieldIdentifierData
  setGroupBy: setGroupByFn
  isBusinessMapping: boolean
  openBusinessMappingDrawer: () => void
  canAddCostCategory: boolean
}

export const GroupByDropDown: React.FC<GroupByDropDownProps> = ({
  data,
  setGroupBy,
  isBusinessMapping,
  openBusinessMappingDrawer,
  canAddCostCategory
}) => {
  const { getString } = useStrings()

  const values = data.values.filter(val => val) as QlceViewField[]

  return (
    <>
      <ul className={css.groupByList}>
        {values.map((value, index) => {
          const onClick: () => void = () => {
            setGroupBy({
              identifier: data.identifier,
              identifierName: data.identifierName,
              fieldId: value.fieldId,
              fieldName: value.fieldName
            })
          }
          return (
            <li key={`fieldName-${index}`} className={cx(css.groupByListItems, Classes.POPOVER_DISMISS)}>
              <MenuItem text={value.fieldName} onClick={onClick} />
            </li>
          )
        })}
      </ul>
      {isBusinessMapping ? (
        <Button
          icon="plus"
          disabled={!canAddCostCategory}
          text={getString('ce.businessMapping.newButton')}
          onClick={openBusinessMappingDrawer}
          minimal
          intent="primary"
        />
      ) : null}
    </>
  )
}

interface GroupByViewProps extends BaseGroupByProps {
  field: QlceViewFieldIdentifierData
  openBusinessMappingDrawer: () => void
}

export const GroupByView: React.FC<GroupByViewProps> = ({ field, setGroupBy, groupBy, openBusinessMappingDrawer }) => {
  const isBusinessMapping = field.identifier === ViewFieldIdentifier.BusinessMapping
  const [canViewCostCategory, canAddCostCategory] = usePermission(
    {
      resource: {
        resourceType: ResourceType.CCM_COST_CATEGORY
      },
      permissions: [PermissionIdentifier.VIEW_CCM_COST_CATEGORY, PermissionIdentifier.EDIT_CCM_COST_CATEGORY]
    },
    []
  )
  return (
    <Popover
      key={`identifierName-${field.identifierName}`}
      interactionKind={PopoverInteractionKind.CLICK}
      position={Position.BOTTOM_LEFT}
      modifiers={{
        arrow: { enabled: false },
        flip: { enabled: true },
        keepTogether: { enabled: true },
        preventOverflow: { enabled: true }
      }}
      usePortal={false}
      disabled={isBusinessMapping && !canViewCostCategory}
      content={
        <GroupByDropDown
          openBusinessMappingDrawer={openBusinessMappingDrawer}
          isBusinessMapping={isBusinessMapping}
          canAddCostCategory={canAddCostCategory}
          setGroupBy={setGroupBy}
          data={field}
        />
      }
    >
      {groupBy.identifier === field.identifier ? (
        <div className={cx(css.groupByItems, css.activeItem)}>{`${field.identifierName}: ${groupBy.fieldName}`}</div>
      ) : (
        <div className={cx(css.groupByItems, { [css.disabledPopover]: isBusinessMapping && !canViewCostCategory })}>
          {field.identifierName}
        </div>
      )}
    </Popover>
  )
}

interface LabelDropDownProps {
  setGroupBy: setGroupByFn
  data: Maybe<string>[]
}

export const LabelDropDown: React.FC<LabelDropDownProps> = ({ data, setGroupBy }) => {
  const values = data.filter(val => val) as string[]
  const [searchText, setSearchText] = useState('')

  const filteredResults = values.filter(val => val.includes(searchText))
  return (
    <section className={css.labelDropDownContainer}>
      <TextInput
        className={css.search}
        autoFocus
        placeholder="Search Value"
        onChange={e => {
          const event = e as any
          const value = event.target.value
          setSearchText(value)
        }}
      />
      <ul className={css.groupByList}>
        {filteredResults.map(value => {
          const onClick: () => void = () => {
            setGroupBy({
              identifier: ViewFieldIdentifier.Label,
              identifierName: 'Label',
              fieldId: 'labels.value',
              fieldName: value
            })
          }
          return (
            <li key={`fieldName-${value}`} className={cx(css.groupByListItems, Classes.POPOVER_DISMISS)}>
              <MenuItem text={value} onClick={onClick} />
            </li>
          )
        })}
      </ul>
      {!filteredResults.length ? <div className={css.noResults}>No results found</div> : null}
    </section>
  )
}

interface LabelViewProps extends BaseGroupByProps {
  labelData: Maybe<string>[]
}

export const LabelView: React.FC<LabelViewProps> = ({ setGroupBy, labelData, groupBy }) => {
  return (
    <Popover
      key={`identifier-name-label`}
      interactionKind={PopoverInteractionKind.CLICK}
      position={Position.BOTTOM_LEFT}
      modifiers={{
        arrow: { enabled: false },
        flip: { enabled: true },
        keepTogether: { enabled: true },
        preventOverflow: { enabled: true }
      }}
      usePortal={false}
      content={<LabelDropDown setGroupBy={setGroupBy} data={labelData} />}
    >
      {groupBy.identifier === 'LABEL' ? (
        <div className={cx(css.groupByItems, css.activeItem)}>{`Label: ${groupBy.fieldName}`}</div>
      ) : (
        <div className={css.groupByItems}>Label</div>
      )}
    </Popover>
  )
}

interface CommonGroupByViewProps extends BaseGroupByProps {
  value: QlceViewField
}

const CommonGroupByView: React.FC<CommonGroupByViewProps> = ({ groupBy, setGroupBy, value }) => {
  return groupBy.identifier === ViewFieldIdentifier.Common && groupBy.fieldId === value.fieldId ? (
    <div className={cx(css.groupByItems, css.activeItem)}>{value.fieldName}</div>
  ) : (
    <div
      className={css.groupByItems}
      key={`common-${value.fieldId}`}
      onClick={() => {
        setGroupBy({
          identifier: ViewFieldIdentifier.Common,
          identifierName: 'Common',
          fieldId: value.fieldId,
          fieldName: value.fieldName
        })
      }}
    >
      {value.fieldName}
    </div>
  )
}

interface GroupByComponentProps extends BaseGroupByProps {
  labelData: Maybe<string>[]
  fieldIdentifierData: Maybe<QlceViewFieldIdentifierData>[]
  openBusinessMappingDrawer: () => void
}

const GroupByComponent: React.FC<GroupByComponentProps> = ({
  labelData,
  fieldIdentifierData,
  groupBy,
  setGroupBy,
  openBusinessMappingDrawer
}) => {
  const { getString } = useStrings()
  const commonFields = fieldIdentifierData?.filter(
    field => field && field.identifier === ViewFieldIdentifier.Common
  ) as QlceViewFieldIdentifierData[]
  const otherFields = fieldIdentifierData?.filter(
    field => field && field.identifier !== ViewFieldIdentifier.Common
  ) as QlceViewFieldIdentifierData[]

  return (
    <section className={css.groupByContainer}>
      <label className={css.groupByLabel}> {getString('ce.perspectives.createPerspective.preview.groupBy')}</label>
      <div className={css.groupBys}>
        {otherFields.map(field => {
          return field.values.length ? (
            <GroupByView
              openBusinessMappingDrawer={openBusinessMappingDrawer}
              field={field}
              setGroupBy={setGroupBy}
              groupBy={groupBy}
            />
          ) : null
        })}
        {commonFields.length
          ? commonFields[0].values.map(value => {
              if (value) {
                if (value.fieldId === 'label') {
                  return <LabelView setGroupBy={setGroupBy} labelData={labelData} groupBy={groupBy} />
                } else {
                  return <CommonGroupByView groupBy={groupBy} setGroupBy={setGroupBy} value={value} />
                }
              }
            })
          : null}
      </div>
    </section>
  )
}

export default GroupByComponent
