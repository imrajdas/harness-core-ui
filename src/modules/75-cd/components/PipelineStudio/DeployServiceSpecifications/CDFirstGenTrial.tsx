/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Button, Container, Layout, Text, useToaster } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import cdImage from '@cd/modals/images/cd.png'
import { useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import { ModuleName } from 'framework/types/ModuleName'
import { Experiences } from '@common/constants/Utils'
import { returnLaunchUrl } from '@common/utils/routeUtils'
import { useUpdateAccountDefaultExperienceNG } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import type { DeploymentTypeItem } from './DeploymentInterface'
import css from './DeployServiceSpecifications.module.scss'

interface PropsInterface {
  selectedDeploymentType?: DeploymentTypeItem
  accountId: string
}

export const CDFirstGenTrial: React.FC<PropsInterface> = ({ selectedDeploymentType, accountId }) => {
  const { getString } = useStrings()
  const { showError } = useToaster()
  const { licenseInformation } = useLicenseStore()
  const isTrialAccount = licenseInformation[ModuleName.CD]?.licenseType === 'TRIAL'
  const title = selectedDeploymentType?.label
    ? `${selectedDeploymentType.label} is available on Harness CD First Generation`
    : 'Harness CD First Generation'

  const { mutate: updateDefaultExperience, loading: updatingDefaultExperience } = useUpdateAccountDefaultExperienceNG({
    accountIdentifier: accountId
  })

  async function handleUpdateDefaultExperience(): Promise<void> {
    const updatedDefaultExperience = Experiences.CG
    try {
      await updateDefaultExperience({
        defaultExperience: updatedDefaultExperience
      })
    } catch (error) {
      showError(error.data?.message || getString('somethingWentWrong'))
    }
  }

  return (
    <Layout.Vertical style={{ height: '100%' }}>
      <Layout.Horizontal style={{ height: '100%' }}>
        <Container
          className={css.left}
          width="50%"
          style={{
            background: `transparent url(${cdImage}) no-repeat`
          }}
        />
        <Container padding="xxxlarge" width={'50%'}>
          <Text
            margin={{ top: 'xxxlarge', right: 'xxxlarge' }}
            padding={{ top: 'large' }}
            color={Color.GREY_800}
            font={{ size: 'large', weight: 'bold' }}
          >
            {title}
          </Text>
          <div className={css.cdFirstGenTrialContent}>
            <Text padding={{ top: 'large' }}>{getString('cd.cdSwitchToFirstGen.description1')}</Text>
            <Text padding={{ top: 'large' }}>{getString('cd.cdSwitchToFirstGen.description2')}</Text>
            <Text
              padding={{ top: 'large' }}
              icon="tooltip-icon"
              iconProps={{
                size: 12,
                color: Color.GREY_800,
                padding: { right: 'small', top: 'small', bottom: 'small' }
              }}
            >
              {getString('cd.cdSwitchToFirstGen.description3')}
            </Text>
            <Button
              margin={{ top: 'xxlarge' }}
              disabled={updatingDefaultExperience}
              intent="primary"
              onClick={async () => {
                if (isTrialAccount) {
                  await handleUpdateDefaultExperience()
                  window.location.href = returnLaunchUrl(`#/account/${accountId}/onboarding`)
                } else {
                  window.location.href = returnLaunchUrl(`#/account/${accountId}/dashboard`)
                }
              }}
              data-testid="continueCg"
            >
              {isTrialAccount ? getString('cd.cdSwitchToFirstGen.startWith14DayTrial') : getString('cd.cdLaunchText')}
            </Button>
            <Text padding={{ top: 'xxxlarge' }}>
              {
                <a href="https://docs.harness.io/article/1fjmm4by22" rel="noreferrer" target="_blank">
                  {getString('cd.cdSwitchToFirstGen.learnMoreAboutCD1stGen')}
                </a>
              }
            </Text>
          </div>
        </Container>
      </Layout.Horizontal>
    </Layout.Vertical>
  )
}
