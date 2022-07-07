/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import { Text, Layout, Avatar, Button, ButtonVariation } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useChangePassword } from '@user-profile/modals/useChangePassword/useChangePassword'
import { useUserProfile } from '@user-profile/modals/UserProfile/useUserProfile'
import { useStrings } from 'framework/strings'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { useGetAuthenticationSettings } from 'services/cd-ng'
import type { UsernamePasswordSettings } from 'services/cd-ng'
import { Page } from '@common/components'
import TwoFactorAuthentication from '@user-profile/components/TwoFactorAuthentication/TwoFactorAuthentication'
import useSwitchAccountModal from '@common/modals/SwitchAccount/useSwitchAccountModal'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { addHotJarSuppressionAttribute, useGetCommunity } from '@common/utils/utils'
import { AuthenticationMechanisms } from '@auth-settings/constants/utils'
import UserOverView from './views/UserOverView'
import css from './UserProfile.module.scss'

const UserProfilePage: React.FC = () => {
  const { getString } = useStrings()
  const { accountId } = useParams<AccountPathProps>()
  const { openSwitchAccountModal } = useSwitchAccountModal({})
  const { openUserProfile } = useUserProfile({})
  const { currentUserInfo: user } = useAppStore()
  const isCommunity = useGetCommunity()

  const { data: loginSettingsData, loading: fetchingAuthSettings } = useGetAuthenticationSettings({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const userPasswordSettings = loginSettingsData?.resource?.ngAuthSettings?.find(
    ({ settingsType }) => settingsType === AuthenticationMechanisms.USER_PASSWORD
  ) as UsernamePasswordSettings | undefined

  const passwordStrengthPolicy = userPasswordSettings?.loginSettings?.passwordStrengthPolicy

  const { openPasswordModal } = useChangePassword()

  return (
    <>
      <Page.Body filled className={css.userProfilePage}>
        <Layout.Vertical className={css.details}>
          <Layout.Vertical margin={{ top: 'large' }}>
            <Avatar
              name={user.name || user.email}
              email={user.email}
              size="large"
              hoverCard={false}
              className={css.avatar}
            />
            <Layout.Horizontal
              padding={{ top: 'medium' }}
              flex={{ alignItems: 'baseline', justifyContent: 'flex-start' }}
            >
              <Text
                color={Color.BLACK}
                font={{ size: 'large', weight: 'semi-bold' }}
                lineClamp={1}
                className={css.overflow}
                {...addHotJarSuppressionAttribute()}
              >
                {user.name}
              </Text>
              <Button
                icon="Edit"
                data-testid="editUserProfile"
                variation={ButtonVariation.ICON}
                onClick={() => openUserProfile(user)}
              />
            </Layout.Horizontal>
          </Layout.Vertical>

          <Layout.Vertical padding={{ top: 'huge', bottom: 'huge' }} spacing="medium">
            <Text color={Color.BLACK} font={{ size: 'medium', weight: 'semi-bold' }} padding={{ bottom: 'medium' }}>
              {getString('userProfile.basicInformation')}
            </Text>
            <Text icon="main-email" iconProps={{ padding: { right: 'medium' } }}>
              {user.email}
            </Text>
            <Text icon="lock">
              <Button
                variation={ButtonVariation.LINK}
                onClick={() => openPasswordModal(passwordStrengthPolicy)}
                font={{ weight: 'semi-bold' }}
                disabled={fetchingAuthSettings}
              >
                {getString('userProfile.changePassword')}
              </Button>
            </Text>
            {!isCommunity && (
              <Text icon="people">
                <Button
                  variation={ButtonVariation.LINK}
                  onClick={openSwitchAccountModal}
                  font={{ weight: 'semi-bold' }}
                >
                  {getString('common.switchAccount')}
                </Button>
              </Text>
            )}
          </Layout.Vertical>
          <Layout.Horizontal spacing="huge" padding="large" className={css.authentication} flex>
            <TwoFactorAuthentication
              twoFactorAuthenticationDisabled={!!loginSettingsData?.resource?.twoFactorEnabled || fetchingAuthSettings}
            />
          </Layout.Horizontal>
        </Layout.Vertical>
        <div className={css.overview}>
          <UserOverView />
        </div>
      </Page.Body>
    </>
  )
}

export default UserProfilePage
