/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { ReactNode } from 'react'
import type { CellProps } from 'react-table'
import moment from 'moment'
import { CircularPercentageChart, Text } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import cx from 'classnames'
import formatCost from '@ce/utils/formatCost'
import {
  QlceViewFieldInputInput,
  QlceViewAggregateOperation,
  QlceViewEntityStatsDataPoint,
  ClusterData,
  StorageDetails,
  InstanceDetails
} from 'services/ce/services'
import CostTrend from '@ce/common/CostTrend'
import { CE_COLOR_CONST } from '../CEChart/CEChartOptions'
import css from './PerspectiveGrid.module.scss'

export type AggregationFunction = {
  operationType: QlceViewAggregateOperation
  columnName: string
}

export type GridData = Omit<
  QlceViewEntityStatsDataPoint,
  'clusterData' | 'storageDetails' | 'instanceDetails' | '__typename'
> &
  Omit<ClusterData, '__typename'> & { legendColor: string }

export const addLegendColorToRow = (data: QlceViewEntityStatsDataPoint[]): GridData[] => {
  let idx = 0
  const colors = new Map()

  return data.map(({ name, id, clusterData = {}, storageDetails = {}, instanceDetails = {}, ...rest }) => {
    const key = id
    if (!colors.has(key)) {
      colors.set(key, CE_COLOR_CONST[idx % CE_COLOR_CONST.length])
      idx++
    }

    return {
      name,
      id,
      legendColor: colors.get(key),
      ...(clusterData as ClusterData),
      ...(storageDetails as StorageDetails),
      ...(instanceDetails as InstanceDetails),
      ...rest
    }
  })
}

const SUM = QlceViewAggregateOperation.Sum
const MAX = QlceViewAggregateOperation.Max
const MIN = QlceViewAggregateOperation.Min

const AGGREGATE_COST = { operationType: SUM, columnName: 'cost' }

const AGGREGATE_CPU_BILLING_AMOUNT = { operationType: SUM, columnName: 'cpuBillingAmount' }
const AGGREGATE_CPU_UNALLOCATED_COST = { operationType: SUM, columnName: 'cpuUnallocatedCost' }
const AGGREGATE_CPU_ACTUAL_IDLE_COST = { operationType: SUM, columnName: 'cpuActualIdleCost' }

const AGGREGATE_MEMORY_BILLING_AMOUNT = { operationType: SUM, columnName: 'memoryBillingAmount' }
const AGGREGATE_MEMORY_UNALLOCATED_COST = { operationType: SUM, columnName: 'memoryUnallocatedCost' }
const AGGREGATE_MEMORY_ACTUAL_IDLE_COST = { operationType: SUM, columnName: 'memoryActualIdleCost' }

const AGGREGATE_STORAGE_COST = { operationType: SUM, columnName: 'storageCost' }
const AGGREGATE_STORAGE_UNALLOCATED_COST = { operationType: SUM, columnName: 'storageUnallocatedCost' }
const AGGREGATE_STORAGE_ACTUAL_IDLE_COST = { operationType: SUM, columnName: 'storageActualIdleCost' }
const AGGREGATE_STORAGE_UTILIZATION_VALUE = { operationType: MAX, columnName: 'storageUtilizationValue' }
const AGGREGATE_STORAGE_REQUEST = { operationType: MAX, columnName: 'storageRequest' }

const AGGREGATE_UNALLOCATED_COST = { operationType: SUM, columnName: 'unallocatedcost' }
const AGGREGATE_ACTUAL_IDLE_COST = { operationType: SUM, columnName: 'actualidlecost' }
const AGGREGATE_SYSTEM_COST = { operationType: SUM, columnName: 'systemcost' }
const AGGREGATE_NETWORK_COST = { operationType: SUM, columnName: 'networkcost' }

const AGGREGATION_START_TIME_MAX = { operationType: MAX, columnName: 'startTime' }
const AGGREGATION_START_TIME_MIN = { operationType: MIN, columnName: 'startTime' }

const AGGREGATE_FUNCTION_TYPE1 = [
  AGGREGATE_COST,
  AGGREGATE_CPU_ACTUAL_IDLE_COST,
  AGGREGATE_CPU_BILLING_AMOUNT,
  AGGREGATE_CPU_UNALLOCATED_COST,
  AGGREGATE_MEMORY_BILLING_AMOUNT,
  AGGREGATE_MEMORY_UNALLOCATED_COST,
  AGGREGATE_MEMORY_ACTUAL_IDLE_COST,
  AGGREGATE_STORAGE_COST,
  AGGREGATE_STORAGE_UNALLOCATED_COST,
  AGGREGATE_STORAGE_ACTUAL_IDLE_COST,
  AGGREGATE_UNALLOCATED_COST,
  AGGREGATE_ACTUAL_IDLE_COST
]
const AGGREGATE_FUNCTION_TYPE2 = [AGGREGATE_COST, AGGREGATE_ACTUAL_IDLE_COST]
const AGGREGATE_FUNCTION_DEFAULT = [AGGREGATE_COST]

const AGGREGATE_FUNCTION_NODE = [
  AGGREGATE_COST,
  AGGREGATE_CPU_ACTUAL_IDLE_COST,
  AGGREGATE_CPU_BILLING_AMOUNT,
  AGGREGATE_CPU_UNALLOCATED_COST,
  AGGREGATE_MEMORY_BILLING_AMOUNT,
  AGGREGATE_MEMORY_UNALLOCATED_COST,
  AGGREGATE_MEMORY_ACTUAL_IDLE_COST,
  AGGREGATE_UNALLOCATED_COST,
  AGGREGATE_ACTUAL_IDLE_COST,
  AGGREGATE_SYSTEM_COST,
  AGGREGATE_NETWORK_COST,
  AGGREGATE_STORAGE_UNALLOCATED_COST
]

const AGGREGATE_FUNCTION_COST_AND_TIME = [AGGREGATE_COST, AGGREGATION_START_TIME_MAX, AGGREGATION_START_TIME_MIN]
const AGGREGATE_FUNCTION_STORAGE = [
  AGGREGATE_COST,
  AGGREGATE_STORAGE_COST,
  AGGREGATE_STORAGE_UNALLOCATED_COST,
  AGGREGATE_STORAGE_ACTUAL_IDLE_COST,
  AGGREGATE_STORAGE_UTILIZATION_VALUE,
  AGGREGATE_STORAGE_REQUEST
]

export const AGGREGATE_FUNCTION: Record<string, AggregationFunction[]> = {
  namespace: AGGREGATE_FUNCTION_TYPE1,
  clusterName: AGGREGATE_FUNCTION_TYPE1,
  workloadName: AGGREGATE_FUNCTION_TYPE1,
  appName: AGGREGATE_FUNCTION_TYPE2,
  serviceName: AGGREGATE_FUNCTION_TYPE2,
  envName: AGGREGATE_FUNCTION_TYPE2,
  cloudProvider: AGGREGATE_FUNCTION_TYPE2,
  cloudServiceName: AGGREGATE_FUNCTION_TYPE2,
  launchType: AGGREGATE_FUNCTION_TYPE2,
  taskId: AGGREGATE_FUNCTION_TYPE2,
  'labels.value': AGGREGATE_FUNCTION_TYPE2,
  instanceName: AGGREGATE_FUNCTION_NODE,
  storage: AGGREGATE_FUNCTION_STORAGE,

  COST_AND_TIME: AGGREGATE_FUNCTION_COST_AND_TIME,
  CLUSTER: AGGREGATE_FUNCTION_TYPE1,
  DEFAULT: AGGREGATE_FUNCTION_DEFAULT
}

const GRID_EFFICIENCY_SCORE = {
  CRICLE_SIZE: 30,
  THRESHOLD: {
    RED: 0,
    ORANGE: 50,
    GREEN: 80
  }
}

// Cell Renderers
const RenderNameCell = ({ row }: CellProps<GridData>): ReactNode => {
  const { legendColor, name } = row.original
  const columns = row.cells.length

  return (
    <div className={css.nameCell}>
      <span className={css.legendColorCtn}>
        <span style={{ background: legendColor }} className={css.legendColor}></span>
      </span>
      <Text lineClamp={1} className={cx({ [css.name]: columns > DEFAULT_COLS.length })}>
        {name}
      </Text>
    </div>
  )
}

export const RenderCostCell = (props: CellProps<GridData>): JSX.Element => <span>{formatCost(+props.value)}</span>

export const RenderPercentageCell = (props: CellProps<GridData>): JSX.Element => <span>{props.value}%</span>

const RenderCostTrendCell = (props: CellProps<GridData>): JSX.Element => {
  return <CostTrend value={+props.value} downIcon="arrow-down" upIcon="arrow-up" iconSize={12} />
}

export const RenderDateCell = (item: Record<string, any>) => {
  return item.value ? <div>{moment.utc(item.value).format(`MMM DD, YYYY hh:mm a`)}</div> : '-'
}

const RenderEfficiencyScoreCell = (props: CellProps<GridData>) => {
  const score = props.value
  if (score <= 0) {
    return '—'
  }

  let color = Color.GREEN_600
  if (score > GRID_EFFICIENCY_SCORE.THRESHOLD.RED && score < GRID_EFFICIENCY_SCORE.THRESHOLD.ORANGE) {
    color = Color.RED_900
  } else if (score >= GRID_EFFICIENCY_SCORE.THRESHOLD.ORANGE && score < GRID_EFFICIENCY_SCORE.THRESHOLD.GREEN) {
    color = Color.ORANGE_500
  }

  return (
    <div className={css.efficiencyScore}>
      <div className={css.stack}>
        <CircularPercentageChart size={GRID_EFFICIENCY_SCORE.CRICLE_SIZE} value={score} color={color} font="small" />
      </div>
    </div>
  )
}

export type Column = {
  Header: string
  accessor: string
  className?: string
  width?: number
  // tells if we can hide this column from the table. For example— costTrend, name, totalCost are not hideable.
  hideable?: boolean
  sticky?: 'left' | 'right'
  Cell?: (props: CellProps<GridData>) => ReactNode
}

export const COLUMNS: Record<string, Column> = {
  NAME: {
    Header: 'Name',
    accessor: 'name',
    className: 'name',
    width: 250,
    hideable: false,
    sticky: 'left',
    Cell: RenderNameCell
  },
  CLUSTER_NAME: {
    Header: 'Cluster',
    accessor: 'clusterName',
    width: 200
  },
  IDLE_COST: {
    Header: 'Idle cost',
    accessor: 'idleCost',
    width: 200,
    className: 'idle-cost cost-column',
    Cell: RenderCostCell
  },
  TOTAL_COST: {
    Header: 'Total cost',
    accessor: 'totalCost',
    width: 200,
    hideable: false,
    Cell: RenderCostCell
  },
  COST: {
    Header: 'Total cost',
    accessor: 'cost',
    width: 200,
    hideable: false,
    sticky: 'left',
    Cell: RenderCostCell
  },
  COST_TREND: {
    Header: 'Cost trend',
    accessor: 'costTrend',
    width: 200,
    hideable: false,
    className: 'cost-trend cost-column',
    Cell: RenderCostTrendCell
  },
  UNALLOCATED_COST: {
    Header: 'Unallocated Cost',
    accessor: 'unallocatedCost',
    width: 200,
    className: 'unallocated-cost cost-column',
    Cell: RenderCostCell
  },
  STORAGE_COST: {
    Header: 'Storage total cost',
    accessor: 'storageCost',
    width: 200,
    className: 'storage-total-cost cost-column',
    Cell: RenderCostCell
  },
  STORAGE_ACTUAL_IDLE_COST: {
    Header: 'Storage idle cost',
    accessor: 'storageActualIdleCost',
    width: 200,
    className: 'storage-idle-cost cost-column',
    Cell: RenderCostCell
  },
  STORAGE_UNALLOCATED_COST: {
    Header: 'Storage unallocated cost',
    accessor: 'storageUnallocatedCost',
    width: 225,
    className: 'storage-unallocated-cost  cost-column',
    Cell: RenderCostCell
  },
  MEMORY_BILLING_AMOUNT: {
    Header: 'Memory total cost',
    accessor: 'memoryBillingAmount',
    width: 200,
    className: 'memory-total-cost cost-column',
    Cell: RenderCostCell
  },
  MEMORY_ACTUAL_IDLE_COST: {
    Header: 'Memory Idle Cost',
    accessor: 'memoryActualIdleCost',
    width: 200,
    className: 'workload-memory-idle-cost cost-column',
    Cell: RenderCostCell
  },
  MEMORY_UNALLOCATED_COST: {
    Header: 'Memory unallocated cost',
    accessor: 'memoryUnallocatedCost',
    width: 200,
    className: 'memory-unallocated-cost cost-column',
    Cell: RenderCostCell
  },
  CPU_BILLING_AMOUNT: {
    Header: 'CPU total cost',
    accessor: 'cpuBillingAmount',
    width: 200,
    className: 'cpu-total-cost cost-column',
    Cell: RenderCostCell
  },
  CPU_ACTUAL_IDLE_COST: {
    Header: 'CPU idle cost',
    accessor: 'cpuActualIdleCost',
    width: 200,
    className: 'workload-cpu-idle-cost cost-column',
    Cell: RenderCostCell
  },
  CPU_UNALLOCATED_COST: {
    Header: 'CPU unallocated cost',
    accessor: 'cpuUnallocatedCost',
    width: 200,
    className: 'cpu-unallocated-cost cost-column',
    Cell: RenderCostCell
  },
  NAMESPACE: {
    Header: 'Namespace',
    accessor: 'namespace',
    width: 200,
    className: 'workload-namespace'
  },
  WORKLOAD: {
    Header: 'Workload',
    accessor: 'workloadName',
    width: 200,
    className: 'workload-name'
  },
  WORKLOAD_TYPE: {
    Header: 'Workload Type',
    accessor: 'workloadType',
    width: 200,
    className: 'workloadType'
  },
  APPLICATION_NAME: {
    Header: 'Application',
    accessor: 'appName',
    width: 200,
    className: 'name'
  },
  SERVICE: {
    Header: 'Service',
    accessor: 'serviceName',
    width: 200,
    className: 'service'
  },
  ENVIRONMENT: {
    Header: 'Environment',
    accessor: 'envName',
    width: 200,
    className: 'environment'
  },
  CLOUD_PROVIDER: {
    Header: 'Cloud provider',
    accessor: 'cloudProvider',
    width: 200,
    className: 'clour-provider'
  },
  ECS_SERVICE: {
    Header: 'ECS Service',
    accessor: 'cloudServiceName',
    width: 200,
    className: 'ecs-service'
  },
  ECS_LAUNCH_TYPE: {
    Header: 'ECS Launch Type',
    accessor: 'launchType',
    width: 200
  },
  ECS_LAUNCH_TYPE_ID: {
    Header: 'ECS Launch Type ID',
    accessor: 'launchType',
    width: 200
  },
  ECS_TASK: {
    Header: 'ECS Task',
    accessor: 'taskId',
    width: 200
  },
  ECS_TASK_ID: {
    Header: 'ECS Task ID',
    accessor: 'taskId',
    width: 200
  },
  REGION: {
    Header: 'Region',
    accessor: 'region',
    width: 200,
    className: 'region'
  },
  WORKLOAD_IDLE_COST: {
    Header: 'Idle cost',
    accessor: 'idleCost',
    width: 200,
    className: 'workload-idle-cost cost-column',
    Cell: RenderCostCell
  },
  CPU_UTILIZATION: {
    Header: 'CPU utilization',
    accessor: 'avgCpuUtilization',
    width: 200,
    className: 'workload-cpu-utilization',
    Cell: RenderPercentageCell
  },
  MEMORY_UTILIZATION: {
    Header: 'Memory utilization',
    accessor: 'avgMemoryUtilization',
    width: 200,
    className: 'workload-avg-memory-utilization',
    Cell: RenderPercentageCell
  },
  CREATION_TIME: {
    Header: 'Creation Time',
    accessor: 'createTime',
    width: 200,
    // type: DATE_TIME_COLUMN,
    // className: COST_COLUMN_CLASSNAME
    Cell: RenderDateCell
  },
  DELETION_TIME: {
    Header: 'Deletion Time',
    accessor: 'deleteTime',
    width: 200,
    // type: DATE_TIME_COLUMN,
    // className: COST_COLUMN_CLASSNAME
    Cell: RenderDateCell
  },
  CPU_REQUESTED: {
    Header: 'CPU Requested (vCPU)',
    accessor: 'cpuRequested',
    width: 200
    // className: COST_COLUMN_CLASSNAME
    // renderer: cpuCostRenderer
  },
  MEMORY_REQUESTED: {
    Header: 'Memory Requested (GB)',
    accessor: 'memoryRequested',
    width: 200
    // className: COST_COLUMN_CLASSNAME
    // renderer: memoryRenderer
  },
  AWS_REGION: {
    Header: 'AWS Region',
    accessor: 'region',
    width: 200,
    className: 'name'
  },
  AWS_UNBLEDNDED_COST: {
    Header: 'Total Cost',
    accessor: 'awsUnblendedCost',
    width: 200
    // className: TOTAL_COST_CLASSNAME
    // renderer: costRenderer
  },
  AWS_BLEDNDED_COST: {
    Header: 'Blended Cost',
    accessor: 'awsBlendedCost',
    width: 200
    // className: TOTAL_COST_CLASSNAME
    // renderer: costRenderer
  },
  AWS_ACCOUNT: {
    Header: 'Account',
    accessor: 'awsLinkedAccount',
    width: 200,
    className: 'name'
  },
  AWS_SERVICE: {
    Header: 'Service',
    accessor: 'awsService',
    width: 200,
    className: 'name'
  },
  AWS_INSTANCE_TYPE: {
    Header: 'Instance Type',
    accessor: 'awsInstanceType',
    width: 200,
    className: 'name'
  },
  AWS_USAGE_TYPE: {
    Header: 'Usage Type',
    accessor: 'awsUsageType',
    width: 200,
    className: 'name'
  },
  GCP_TOTAL_COST: {
    Header: 'Total Cost',
    accessor: 'gcpTotalCost',
    width: 200
    // className: TOTAL_COST_CLASSNAME
    // renderer: costRenderer
  },
  GCP_SUB_TOTAL: {
    Header: 'Sub Total',
    accessor: 'gcpSubTotalCost',
    width: 200,
    className: 'gcp-sub-total cost-column'
    // renderer: costRenderer
  },
  GCP_DISCOUNT: {
    Header: 'Discount',
    accessor: 'gcpDiscount',
    width: 200,
    className: 'gcp-discount cost-column'
    // renderer: discountRenderer
  },
  GCP_PROJECT_ID: {
    Header: 'Project ID',
    accessor: 'gcpProjectId',
    width: 200,
    className: 'name'
  },
  GCP_PRODUCT: {
    Header: 'Product',
    accessor: 'gcpProduct',
    width: 200,
    className: 'name'
  },
  GCP_SKU: {
    Header: 'SKU ID',
    accessor: 'gcpSkuId',
    width: 200,
    className: 'name'
  },
  GCP_SKU_DESC: {
    Header: 'SKU Name',
    accessor: 'gcpSkuDescription',
    width: 200,
    className: 'name'
  },
  GCP_LABEL_ID: {
    Header: 'Label',
    accessor: 'gcpLabel',
    width: 200,
    className: 'gcpLabel'
  },
  EFFICIENCY_SCORE: {
    Header: 'Efficiency Score',
    accessor: 'efficiencyScore',
    width: 200,
    className: 'cost-column efficiency-score',
    Cell: RenderEfficiencyScoreCell
  },
  INSTANCE_NAME: {
    Header: 'Instance Name',
    accessor: 'instanceName',
    width: 200,
    className: 'instance-name'
  },
  CLAIM_NAME: {
    Header: 'Claim Name',
    accessor: 'claimName',
    width: 200,
    className: 'name'
  },
  STORAGE_CLASS: {
    Header: 'Storage Class',
    accessor: 'storageClass',
    width: 200,
    className: 'name'
  },
  CAPACITY: {
    Header: 'Capacity (GB)',
    accessor: 'capacity',
    width: 200
  },
  STORAGE_UTILIZATION_VALUE: {
    Header: 'Storage Utilization (GB)',
    accessor: 'storageUtilizationValue',
    width: 200
  },
  VOLUME_TYPE: {
    Header: 'Volume type',
    accessor: 'volumeType',
    width: 200,
    className: 'name'
  },
  STORAGE_REQUEST: {
    accessor: 'storageRequest',
    width: 200,
    Header: 'Storage request'
  },
  INSTANCE_ID: {
    accessor: 'instanceId',
    width: 200,
    Header: 'Instance ID'
  },
  CLAIM_NAMESPACE: {
    accessor: 'claimNamespace',
    width: 200,
    Header: 'Claim Namespace'
  },
  CLUSTER_ID: {
    accessor: 'clusterId',
    width: 200,
    Header: 'Cluster ID'
  },
  NODEPOOL_NAME: {
    accessor: 'nodePoolName',
    width: 200,
    Header: 'Node Pool Name'
  },
  CLOUD_PROVIDER_INSTANCE_ID: {
    accessor: 'cloudProviderInstanceId',
    width: 200,
    Header: 'Cloud Provider Instance ID'
  },
  POD_CAPACITY: {
    accessor: 'podCapacity',
    width: 200,
    Header: 'POD Capacity'
  },
  SYSTEM_COST: {
    accessor: 'systemCost',
    width: 200,
    Header: 'System Cost'
  },
  INSTANCE_CATEGORY: {
    accessor: 'instanceCategory',
    width: 200,
    Header: 'Instance Category'
  },
  MACHINE_TYPE: {
    accessor: 'machineType',
    width: 200,
    Header: 'Machine Type'
  },
  MEMORY_ALLOCATABLE: {
    accessor: 'memoryAllocatable',
    width: 200,
    Header: 'Memory Allocatable'
  },
  CPU_ALLOCATABLE: {
    accessor: 'cpuAllocatable',
    width: 200,
    Header: 'CPU Allocatable'
  }
}

export const CLUSTER_COLS = [
  COLUMNS.NAME,
  COLUMNS.COST,
  COLUMNS.COST_TREND,
  COLUMNS.IDLE_COST,
  COLUMNS.EFFICIENCY_SCORE,
  COLUMNS.UNALLOCATED_COST,
  COLUMNS.STORAGE_COST,
  COLUMNS.STORAGE_ACTUAL_IDLE_COST,
  COLUMNS.STORAGE_UNALLOCATED_COST,
  COLUMNS.MEMORY_BILLING_AMOUNT,
  COLUMNS.MEMORY_ACTUAL_IDLE_COST,
  COLUMNS.MEMORY_UNALLOCATED_COST,
  COLUMNS.CPU_BILLING_AMOUNT,
  COLUMNS.CPU_ACTUAL_IDLE_COST,
  COLUMNS.CPU_UNALLOCATED_COST
]

export const NAMESPACE_COLS = [
  COLUMNS.NAME,
  COLUMNS.COST,
  COLUMNS.COST_TREND,
  COLUMNS.NAMESPACE,
  COLUMNS.IDLE_COST,
  COLUMNS.STORAGE_COST,
  COLUMNS.STORAGE_ACTUAL_IDLE_COST,
  COLUMNS.STORAGE_UNALLOCATED_COST,
  COLUMNS.MEMORY_BILLING_AMOUNT,
  COLUMNS.MEMORY_ACTUAL_IDLE_COST,
  COLUMNS.MEMORY_UNALLOCATED_COST,
  COLUMNS.CPU_BILLING_AMOUNT,
  COLUMNS.CPU_ACTUAL_IDLE_COST,
  COLUMNS.CPU_UNALLOCATED_COST
]

export const NAMESPACE_ID_COLS = [
  COLUMNS.NAME,
  COLUMNS.COST,
  COLUMNS.COST_TREND,
  COLUMNS.NAMESPACE,
  COLUMNS.CLUSTER_NAME,
  COLUMNS.IDLE_COST,
  COLUMNS.STORAGE_COST,
  COLUMNS.STORAGE_ACTUAL_IDLE_COST,
  COLUMNS.STORAGE_UNALLOCATED_COST,
  COLUMNS.MEMORY_BILLING_AMOUNT,
  COLUMNS.MEMORY_ACTUAL_IDLE_COST,
  COLUMNS.MEMORY_UNALLOCATED_COST,
  COLUMNS.CPU_BILLING_AMOUNT,
  COLUMNS.CPU_ACTUAL_IDLE_COST,
  COLUMNS.CPU_UNALLOCATED_COST
]

export const WORKLOAD_COLS = [
  COLUMNS.NAME,
  COLUMNS.COST,
  COLUMNS.COST_TREND,
  COLUMNS.WORKLOAD,
  COLUMNS.IDLE_COST,
  COLUMNS.STORAGE_COST,
  COLUMNS.STORAGE_ACTUAL_IDLE_COST,
  COLUMNS.STORAGE_UNALLOCATED_COST,
  COLUMNS.MEMORY_BILLING_AMOUNT,
  COLUMNS.MEMORY_ACTUAL_IDLE_COST,
  COLUMNS.MEMORY_UNALLOCATED_COST,
  COLUMNS.CPU_BILLING_AMOUNT,
  COLUMNS.CPU_ACTUAL_IDLE_COST,
  COLUMNS.CPU_UNALLOCATED_COST
]

export const WORKLOAD_ID_COLS = [
  COLUMNS.NAME,
  COLUMNS.COST,
  COLUMNS.COST_TREND,
  COLUMNS.WORKLOAD,
  COLUMNS.WORKLOAD_TYPE,
  COLUMNS.NAMESPACE,
  COLUMNS.CLUSTER_NAME,
  COLUMNS.IDLE_COST,
  COLUMNS.STORAGE_COST,
  COLUMNS.STORAGE_ACTUAL_IDLE_COST,
  COLUMNS.STORAGE_UNALLOCATED_COST,
  COLUMNS.MEMORY_BILLING_AMOUNT,
  COLUMNS.MEMORY_ACTUAL_IDLE_COST,
  COLUMNS.MEMORY_UNALLOCATED_COST,
  COLUMNS.CPU_BILLING_AMOUNT,
  COLUMNS.CPU_ACTUAL_IDLE_COST,
  COLUMNS.CPU_UNALLOCATED_COST
]

export const APPLICATION_COLS = [
  COLUMNS.NAME,
  COLUMNS.COST,
  COLUMNS.COST_TREND,
  COLUMNS.EFFICIENCY_SCORE,
  COLUMNS.APPLICATION_NAME,
  COLUMNS.IDLE_COST
]

export const SERVICE_COLS = [COLUMNS.NAME, COLUMNS.COST, COLUMNS.COST_TREND, COLUMNS.SERVICE, COLUMNS.IDLE_COST]

export const ENVIRONMENT_COLS = [COLUMNS.NAME, COLUMNS.COST, COLUMNS.COST_TREND, COLUMNS.ENVIRONMENT, COLUMNS.IDLE_COST]

export const CLOUD_PROVIDER_COLS = [
  COLUMNS.NAME,
  COLUMNS.COST,
  COLUMNS.COST_TREND,
  COLUMNS.CLOUD_PROVIDER,
  COLUMNS.IDLE_COST
]

export const ECS_SERVICE_COLS = [COLUMNS.NAME, COLUMNS.COST, COLUMNS.COST_TREND, COLUMNS.ECS_SERVICE, COLUMNS.IDLE_COST]

export const ECS_SERVICE_ID_COLS = [
  COLUMNS.NAME,
  COLUMNS.COST,
  COLUMNS.COST_TREND,
  COLUMNS.ECS_SERVICE,
  COLUMNS.IDLE_COST,
  COLUMNS.CLUSTER_NAME,
  COLUMNS.ECS_LAUNCH_TYPE
]

export const ECS_LAUNCH_TYPE_COLS = [
  COLUMNS.NAME,
  COLUMNS.COST,
  COLUMNS.COST_TREND,
  COLUMNS.IDLE_COST,
  COLUMNS.ECS_LAUNCH_TYPE
]

export const ECS_LAUNCH_TYPE_ID_COLS = [
  COLUMNS.NAME,
  COLUMNS.COST,
  COLUMNS.COST_TREND,
  COLUMNS.IDLE_COST,
  COLUMNS.CLUSTER_NAME,
  COLUMNS.ECS_LAUNCH_TYPE_ID
]

export const ECS_TASK_COLS = [COLUMNS.NAME, COLUMNS.COST, COLUMNS.COST_TREND, COLUMNS.ECS_TASK, COLUMNS.IDLE_COST]

export const ECS_TASK_ID_COLS = [
  COLUMNS.NAME,
  COLUMNS.COST,
  COLUMNS.COST_TREND,
  COLUMNS.ECS_TASK_ID,
  COLUMNS.IDLE_COST,
  COLUMNS.ECS_SERVICE,
  COLUMNS.CLUSTER_NAME,
  COLUMNS.ECS_LAUNCH_TYPE_ID
]

export const PODS_COLUMNS: Column[] = [
  { ...COLUMNS.NAME },
  { ...COLUMNS.CREATION_TIME, sticky: 'left' },
  COLUMNS.DELETION_TIME,
  COLUMNS.CPU_REQUESTED,
  COLUMNS.MEMORY_REQUESTED,
  COLUMNS.TOTAL_COST,
  COLUMNS.IDLE_COST,
  { ...COLUMNS.WORKLOAD, accessor: 'workload' },
  COLUMNS.NAMESPACE
]

export const NODE_COLS = [
  COLUMNS.NAME,
  COLUMNS.CLUSTER_NAME,
  COLUMNS.TOTAL_COST,
  COLUMNS.IDLE_COST,
  COLUMNS.UNALLOCATED_COST,
  COLUMNS.INSTANCE_CATEGORY,
  COLUMNS.MEMORY_ALLOCATABLE,
  COLUMNS.CPU_ALLOCATABLE,
  COLUMNS.MACHINE_TYPE,
  COLUMNS.SYSTEM_COST,
  COLUMNS.CREATION_TIME,
  COLUMNS.DELETION_TIME,
  COLUMNS.CPU_BILLING_AMOUNT,
  COLUMNS.MEMORY_BILLING_AMOUNT,
  COLUMNS.MEMORY_ACTUAL_IDLE_COST,
  COLUMNS.CPU_ACTUAL_IDLE_COST,
  COLUMNS.MEMORY_UNALLOCATED_COST,
  COLUMNS.CPU_UNALLOCATED_COST
]

export const STORAGE_COLS = [
  COLUMNS.NAME,
  COLUMNS.INSTANCE_ID,
  COLUMNS.INSTANCE_NAME,
  COLUMNS.CLAIM_NAME,
  COLUMNS.CLUSTER_NAME,
  COLUMNS.CLUSTER_ID,
  COLUMNS.STORAGE_CLASS,
  COLUMNS.VOLUME_TYPE,
  COLUMNS.CLOUD_PROVIDER,
  COLUMNS.REGION,
  COLUMNS.STORAGE_COST,
  COLUMNS.STORAGE_ACTUAL_IDLE_COST,
  COLUMNS.STORAGE_UNALLOCATED_COST,
  COLUMNS.CAPACITY,
  COLUMNS.STORAGE_REQUEST,
  COLUMNS.STORAGE_UTILIZATION_VALUE,
  COLUMNS.CREATION_TIME,
  COLUMNS.DELETION_TIME
]

export const LABELS_COLS = [COLUMNS.NAME, COLUMNS.COST, COLUMNS.COST_TREND, COLUMNS.IDLE_COST]

export const DEFAULT_COLS: Column[] = [
  {
    Header: 'Name',
    accessor: 'name',
    className: 'name',
    width: 250,
    hideable: false,
    Cell: RenderNameCell
  },
  {
    Header: 'Total cost',
    accessor: 'cost',
    width: 200,
    hideable: false,
    Cell: RenderCostCell
  },
  {
    Header: 'Cost trend',
    accessor: 'costTrend',
    width: 200,
    hideable: false,
    className: 'cost-trend cost-column',
    Cell: RenderCostTrendCell
  }
]

export const GroupByMapping: Record<string, Column[]> = {
  Namespace: NAMESPACE_COLS,
  Workload: WORKLOAD_COLS,
  Application: APPLICATION_COLS,
  Service: SERVICE_COLS,
  Environment: ENVIRONMENT_COLS,
  'Cluster Name': CLUSTER_COLS,
  'Namespace Id': NAMESPACE_ID_COLS,
  'Workload Id': WORKLOAD_ID_COLS,
  'Cloud Provider': CLOUD_PROVIDER_COLS,
  'ECS Service': ECS_SERVICE_COLS,
  'ECS Service Id': ECS_SERVICE_ID_COLS,
  'ECS Launch Type': ECS_LAUNCH_TYPE_COLS,
  'ECS Launch Type Id': ECS_LAUNCH_TYPE_ID_COLS,
  'ECS Task': ECS_TASK_COLS,
  'ECS Task Id': ECS_TASK_ID_COLS,
  Pod: PODS_COLUMNS,
  Node: NODE_COLS,
  Storage: STORAGE_COLS
}

export const getGridColumnsByGroupBy = (groupBy: QlceViewFieldInputInput, isClusterOnly: boolean): Column[] => {
  const { fieldName, identifier } = groupBy

  if (!isClusterOnly) {
    return DEFAULT_COLS
  }

  if (identifier === 'LABEL') {
    return LABELS_COLS
  }

  return GroupByMapping[fieldName] || DEFAULT_COLS
}
