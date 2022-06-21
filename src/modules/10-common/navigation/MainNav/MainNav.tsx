/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useLayoutEffect } from 'react'
import cx from 'classnames'
import { NavLink as Link, useParams } from 'react-router-dom'
import type { NavLinkProps } from 'react-router-dom'
import { Text, Icon, Layout, Avatar } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { String } from 'framework/strings'
import { useAppStore } from 'framework/AppStore/AppStoreContext'

import paths from '@common/RouteDefinitions'

import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { ResourceCenter } from '@common/components/ResourceCenter/ResourceCenter'
import css from './MainNav.module.scss'

const commonLinkProps: Partial<NavLinkProps> = {
  activeClassName: css.active,
  className: cx(css.navLink)
}

export default function L1Nav(): React.ReactElement {
  const params = useParams<ProjectPathProps>()
  const {
    CDNG_ENABLED,
    CVNG_ENABLED,
    CING_ENABLED,
    CENG_ENABLED,
    CFNG_ENABLED,
    CHAOS_ENABLED,
    SECURITY,
    RESOURCE_CENTER_ENABLED,
    NG_DASHBOARDS
  } = useFeatureFlags()

  const { currentUserInfo: user } = useAppStore()

  useLayoutEffect(() => {
    // main nav consists of two UL sections with classname "css.navList"
    const items = Array.from(document.querySelectorAll(`.${css.navList}`))
    // add the real height of both sections
    // real height is needed because number of items can change based on feature flags, license etc
    const minNavHeight = items.reduce((previousValue, listitem) => {
      return previousValue + listitem.getBoundingClientRect().height
    }, 0)
    // set the CSS variable defined in src/modules/10-common/layouts/layouts.module.scss
    const root = document.querySelector(':root') as HTMLElement
    root.style.setProperty('--main-nav-height', `${minNavHeight}px`)
  })

  return (
    <nav className={css.main}>
      <ul className={css.navList}>
        <li className={css.navItem}>
          <Link {...commonLinkProps} to={paths.toHome(params)}>
            <Layout.Vertical flex={{ align: 'center-center' }} spacing="small">
              <Icon name="harness" size={30} />
              <Text
                font={{ weight: 'semi-bold', align: 'center' }}
                padding={{ bottom: 'xsmall' }}
                color={Color.WHITE}
                className={css.text}
              >
                <String stringID="common.home" />
              </Text>
            </Layout.Vertical>
          </Link>
        </li>
        {CHAOS_ENABLED && (
          <li className={css.navItem}>
            <Link {...commonLinkProps} to={paths.toChaos(params)}>
              <Layout.Vertical flex={{ align: 'center-center' }} spacing="small">
                <Icon name="command-stop" size={30} />
                <Text
                  font={{ weight: 'semi-bold', align: 'center' }}
                  padding={{ bottom: 'xsmall' }}
                  color={Color.WHITE}
                  className={css.text}
                >
                  <String stringID="common.chaosText" />
                </Text>
              </Layout.Vertical>
            </Link>
          </li>
        )}
        {CDNG_ENABLED && (
          <li className={css.navItem}>
            <Link {...commonLinkProps} to={paths.toCD(params)}>
              <Layout.Vertical flex={{ align: 'center-center' }} spacing="small">
                <Icon name="cd-main" size={30} />
                <Text
                  font={{ weight: 'semi-bold', align: 'center' }}
                  padding={{ bottom: 'xsmall' }}
                  color={Color.WHITE}
                  className={css.text}
                >
                  <String stringID="deploymentsText" />
                </Text>
              </Layout.Vertical>
            </Link>
          </li>
        )}
        {CING_ENABLED && (
          <li className={css.navItem}>
            <Link {...commonLinkProps} to={paths.toCI(params)}>
              <Layout.Vertical flex={{ align: 'center-center' }} spacing="small">
                <Icon name="ci-main" size={30} />
                <Text
                  font={{ weight: 'semi-bold', align: 'center' }}
                  padding={{ bottom: 'xsmall' }}
                  color={Color.WHITE}
                  className={css.text}
                >
                  <String stringID="buildsText" />
                </Text>
              </Layout.Vertical>
            </Link>
          </li>
        )}
        {CFNG_ENABLED && (
          <li className={css.navItem}>
            <Link {...commonLinkProps} to={paths.toCF(params)}>
              <Layout.Vertical flex={{ align: 'center-center' }} spacing="small">
                <Icon name="cf-main" size={30} />
                <Text
                  font={{ weight: 'semi-bold', align: 'center' }}
                  padding={{ bottom: 'xsmall' }}
                  color={Color.WHITE}
                  className={css.text}
                >
                  <String stringID="featureFlagsText" />
                </Text>
              </Layout.Vertical>
            </Link>
          </li>
        )}
        {CENG_ENABLED && (
          <li className={css.navItem}>
            <Link {...commonLinkProps} to={paths.toCE(params)}>
              <Layout.Vertical flex={{ align: 'center-center' }} spacing="small">
                <Icon name="ce-main" size={30} />
                <Text
                  font={{ weight: 'semi-bold', align: 'center' }}
                  padding={{ bottom: 'xsmall' }}
                  color={Color.WHITE}
                  className={css.text}
                >
                  <String stringID="cloudCostsText" />
                </Text>
              </Layout.Vertical>
            </Link>
          </li>
        )}
        {CVNG_ENABLED && (
          <li className={css.navItem}>
            <Link {...commonLinkProps} to={paths.toCV(params)}>
              <Layout.Vertical flex={{ align: 'center-center' }} spacing="small">
                <Icon name="cv-main" size={30} />
                <Text
                  font={{ weight: 'semi-bold', align: 'center' }}
                  padding={{ bottom: 'xsmall' }}
                  color={Color.WHITE}
                  className={css.text}
                >
                  <String stringID="common.purpose.cv.serviceReliability" />
                </Text>
              </Layout.Vertical>
            </Link>
          </li>
        )}
        {SECURITY && (
          <li className={css.navItem}>
            <Link {...commonLinkProps} to={paths.toSTO(params)}>
              <Layout.Vertical flex={{ align: 'center-center' }} spacing="small">
                <Icon name="sto-color-filled" size={30} />
                <Text
                  font={{ weight: 'semi-bold', align: 'center' }}
                  padding={{ bottom: 'xsmall' }}
                  color={Color.WHITE}
                  className={css.text}
                >
                  <String stringID="common.purpose.sto.continuous" />
                </Text>
              </Layout.Vertical>
            </Link>
          </li>
        )}
      </ul>
      <ul className={css.navList}>
        {RESOURCE_CENTER_ENABLED && (
          <li className={css.navItem}>
            <ResourceCenter />
          </li>
        )}
        {NG_DASHBOARDS && (
          <li className={css.navItem}>
            <Link
              className={cx(css.navLink, css.settings, css.hoverNavLink)}
              activeClassName={css.active}
              to={paths.toCustomDashboard(params)}
            >
              <Layout.Vertical flex spacing="xsmall">
                <Icon name="dashboard" size={20} />
                <Text font={{ size: 'xsmall', align: 'center' }} color={Color.WHITE} className={css.hoverText}>
                  <String stringID="common.dashboards" />
                </Text>
              </Layout.Vertical>
            </Link>
          </li>
        )}
        <li className={css.navItem}>
          <Link
            className={cx(css.navLink, css.settings, css.hoverNavLink)}
            activeClassName={css.active}
            to={paths.toAccountSettings(params)}
          >
            <Layout.Vertical flex spacing="xsmall">
              <Icon name="nav-settings" size={20} />
              <Text font={{ size: 'xsmall', align: 'center' }} color={Color.WHITE} className={css.hoverText}>
                <String stringID="common.accountSettings" />
              </Text>
            </Layout.Vertical>
          </Link>
        </li>
        <li className={css.navItem}>
          <Link
            className={cx(css.navLink, css.userLink, css.hoverNavLink)}
            activeClassName={css.active}
            to={paths.toUser(params)}
          >
            <Layout.Vertical flex spacing="xsmall">
              <Avatar name={user.name || user.email} email={user.email} size="small" hoverCard={false} />
              <Text font={{ size: 'xsmall', align: 'center' }} color={Color.WHITE} className={css.hiddenText}>
                <String stringID="common.myProfile" />
              </Text>
            </Layout.Vertical>
          </Link>
        </li>
      </ul>
    </nav>
  )
}
