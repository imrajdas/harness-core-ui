/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

/* eslint-disable */
/**
 * This file is auto-generated. Please do not modify this file manually.
 * Use the command `yarn strings` to regenerate this file.
 */
import common from '@common/strings/strings.en.yaml'
import notifications from '@notifications/strings/strings.en.yaml'
import auditTrail from '@audit-trail/strings/strings.en.yaml'
import rbac from '@rbac/strings/strings.en.yaml'
import governance from '@governance/strings/strings.en.yaml'
import sto from '@sto/strings/strings.en.yaml'
import et from '@et/strings/strings.en.yaml'
import delegates from '@delegates/strings/strings.en.yaml'
import secrets from '@secrets/strings/strings.en.yaml'
import filestore from '@filestore/strings/strings.en.yaml'
import variables from '@variables/strings/strings.en.yaml'
import authSettings from '@auth-settings/strings/strings.en.yaml'
import connectors from '@connectors/strings/strings.en.yaml'
import userProfile from '@user-profile/strings/strings.en.yaml'
import gitsync from '@gitsync/strings/strings.en.yaml'
import dashboards from '@dashboards/strings/strings.en.yaml'
import projectsOrgs from '@projects-orgs/strings/strings.en.yaml'
import pipeline from '@pipeline/strings/strings.en.yaml'
import templatesLibrary from '@templates-library/strings/strings.en.yaml'
import triggers from '@triggers/strings/strings.en.yaml'
import cd from '@cd/strings/strings.en.yaml'
import ce from '@ce/strings/strings.en.yaml'
import cf from '@cf/strings/strings.en.yaml'
import chaos from '@chaos/strings/strings.en.yaml'
import ci from '@ci/strings/strings.en.yaml'
import cv from '@cv/strings/strings.en.yaml'
import stoSteps from '@sto-steps/strings/strings.en.yaml'
import gitops from '@gitops/strings/strings.en.yaml'

export default function languageLoader() {
  return {
    common,
    notifications,
    auditTrail,
    rbac,
    governance,
    sto,
    et,
    delegates,
    secrets,
    filestore,
    variables,
    authSettings,
    connectors,
    userProfile,
    gitsync,
    dashboards,
    projectsOrgs,
    pipeline,
    templatesLibrary,
    triggers,
    cd,
    ce,
    cf,
    chaos,
    ci,
    cv,
    stoSteps,
    gitops
  }
}
