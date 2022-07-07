/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

export const DelegateTypes = {
  KUBERNETES_CLUSTER: 'K8sCluster',
  DOCKER: 'DOCKER',
  ECS: 'ECS',
  LINUX: 'LINUX'
}

export const POLL_INTERVAL = 2 /* sec */ * 1000 /* ms */
export const TIME_OUT = 5 * 60 * 1000

export enum DelegateStatus {
  ENABLED = 'ENABLED',
  WAITING_FOR_APPROVAL = 'WAITING_FOR_APPROVAL',
  DISABLED = 'DISABLED',
  DELETED = 'DELETED'
}

export enum EnvironmentType {
  PROD = 'PROD',
  NON_PROD = 'NON_PROD'
}

export const fullSizeContentStyle: React.CSSProperties = {
  position: 'fixed',
  top: '135px',
  left: '270px',
  width: 'calc(100% - 270px)',
  height: 'calc(100% - 135px)'
}

export enum TroubleShootingTypes {
  VERIFY_PODS_COMEUP = 'VERIFY_PODS_COMEUP',
  VERIFY_HARNESS_SASS = 'VERIFY_HARNESS_SASS',
  CURL_HARNESS_IO = 'CURL_HARNESS_IO',
  DO_YOU_HAVE_PROXY = 'DO_YOU_HAVE_PROXY',
  CHECK_PROXY = 'CHECK_PROXY',
  VERIFY_EVENTS = 'VERIFY_EVENTS',
  CHECK_CLUSTER_PERMISSION = 'CHECK_CLUSTER_PERMISSION',
  CONTAINER_FAILED_START = 'CONTAINER_FAILED_START',
  CHECK_CLUSTER_CONFIG = 'CHECK_CLUSTER_CONFIG',
  CAN_CLUSTER_CONNECT_TO_REGISTRY = 'CAN_CLUSTER_CONNECT_TO_REGISTRY',
  CHECK_FIREWALL_PORTS = 'CHECK_FIREWALL_PORTS',
  GOOD_TO_GO = 'GOOD_TO_GO',
  CONTACT_HARNESS_SUPPORT = 'CONTACT_HARNESS_SUPPORT',
  VERIFY_CONTAINER_STATUS = 'VERIFY_CONTAINER_STATUS',
  CONTAINER_RUNNING = 'CONTAINER_RUNNING',
  CONTAINER_NOT_RUNNING = 'CONTAINER_NOT_RUNNING'
}

export const DelegateSize = {
  LAPTOP: 'LAPTOP',
  SMALL: 'SMALL',
  MEDIUM: 'MEDIUM',
  LARGE: 'LARGE'
}

export const isHelmDelegateEnabled = (isEnabled = false): boolean => {
  return isEnabled
}
