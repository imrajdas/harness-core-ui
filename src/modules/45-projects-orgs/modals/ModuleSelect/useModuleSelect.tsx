/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback } from 'react'
import { Button, Card, Container, Icon, Layout, Text, ButtonVariation, useToaster } from '@wings-software/uicore'
import { FontVariation } from '@harness/design-system'
import { useModalHook } from '@harness/use-modal'
import { Dialog, IDialogProps } from '@blueprintjs/core'
import { useHistory, useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'
import { Module, ModuleName } from 'framework/types/ModuleName'
import { getModuleLink } from '@projects-orgs/components/ModuleListCard/ModuleListCard'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { getModuleDescriptionsForModuleSelectionDialog, getModuleFullLengthTitle } from '@projects-orgs/utils/utils'
import { getModuleIcon, useGetCommunity, isOnPrem } from '@common/utils/utils'
import {
  Project,
  StartFreeLicenseQueryParams,
  StartTrialDTO,
  startFreeLicensePromise,
  startTrialLicensePromise,
  ResponseModuleLicenseDTO
} from 'services/cd-ng'
import ModuleSelectionFactory from '@projects-orgs/factories/ModuleSelectionFactory'
import { handleUpdateLicenseStore, useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import { Editions, ModuleLicenseType } from '@common/constants/SubscriptionTypes'
import routes from '@common/RouteDefinitions'
import css from './useModuleSelect.module.scss'

export interface UseModuleSelectModalProps {
  onSuccess?: () => void
  onCloseModal?: () => void
}
export type RenderElementOnModuleSelection = { [K in ModuleName]?: JSX.Element }
export interface UseModuleSelectModalReturn {
  openModuleSelectModal: (projectData: Project) => void
  closeModuleSelectModal: () => void
}
interface InfoCards {
  name: ModuleName
}
interface GoToModuleBtnProps {
  selectedModuleName: ModuleName
  projectData: Project
}
interface ModulesRoutesMap extends GoToModuleBtnProps {
  search?: string
  accountId: string
  freePlanEnabled?: boolean
}
interface UpdateLicneseStoreAndGotoModulePageProps {
  planData: ResponseModuleLicenseDTO
  experienceType: ModuleLicenseType
}
const getModulesWithSubscriptionsRoutesMap = ({
  selectedModuleName,
  projectData,
  search = '',
  accountId,
  freePlanEnabled = false
}: ModulesRoutesMap): Map<ModuleName, any> => {
  const cdCiPath = {
    pathname: routes.toPipelineStudio({
      orgIdentifier: projectData.orgIdentifier || '',
      projectIdentifier: projectData.identifier,
      pipelineIdentifier: '-1',
      accountId,
      module: selectedModuleName.toLowerCase() as Module
    }),
    search: `modal=${freePlanEnabled ? ModuleLicenseType.FREE : ModuleLicenseType.TRIAL}`
  }
  return new Map([
    [
      ModuleName.CE,
      {
        pathname: routes.toModuleTrialHome({
          accountId,
          module: selectedModuleName.toLocaleLowerCase() as Module
        }),
        search: search
      }
    ],
    [
      ModuleName.CF,
      {
        pathname: routes.toCFOnboarding({
          orgIdentifier: projectData?.orgIdentifier || '',
          projectIdentifier: projectData.identifier,
          accountId
        })
      }
    ],
    [ModuleName.CD, cdCiPath],
    [ModuleName.CI, cdCiPath],
    [
      ModuleName.STO,
      {
        pathname: routes.toSTOProjectOverview({
          orgIdentifier: projectData?.orgIdentifier || '',
          projectIdentifier: projectData.identifier,
          accountId
        })
      }
    ]
  ])
}

const GoToModuleBtn: React.FC<GoToModuleBtnProps> = props => {
  const { getString } = useStrings()
  const { showError } = useToaster()
  const { licenseInformation, updateLicenseStore } = useLicenseStore()
  const { FREE_PLAN_ENABLED } = useFeatureFlags()
  const history = useHistory()
  const { selectedModuleName, projectData } = props
  const { accountId } = useParams<AccountPathProps>()
  const updateLicenseStoreAndGotoModulePage = ({
    planData,
    experienceType
  }: UpdateLicneseStoreAndGotoModulePageProps): void => {
    handleUpdateLicenseStore(
      { ...licenseInformation },
      updateLicenseStore,
      selectedModuleName.toLowerCase() as Module,
      planData?.data
    )
    const moudleRoutePathMap = getModulesWithSubscriptionsRoutesMap({
      selectedModuleName,
      projectData,
      accountId,
      search: `?experience=${experienceType}&&modal=${experienceType}`,
      freePlanEnabled: FREE_PLAN_ENABLED
    })
    history.push(moudleRoutePathMap.get(selectedModuleName))
  }
  const startFreeLicense = (): void => {
    startFreeLicensePromise({
      body: undefined,
      queryParams: {
        accountIdentifier: accountId,
        moduleType: selectedModuleName as StartFreeLicenseQueryParams['moduleType']
      }
    })
      .then(planData => {
        updateLicenseStoreAndGotoModulePage({ planData, experienceType: ModuleLicenseType.FREE })
      })
      .catch(err => {
        showError(err)
      })
  }
  const startTrialLicense = (): void => {
    startTrialLicensePromise({
      body: {
        moduleType: selectedModuleName as StartTrialDTO['moduleType'],
        edition: Editions.ENTERPRISE
      },
      queryParams: { accountIdentifier: accountId }
    })
      .then(planData => {
        updateLicenseStoreAndGotoModulePage({ planData, experienceType: ModuleLicenseType.TRIAL })
      })
      .catch(err => {
        showError(err)
      })
  }
  const getBtnText = (): string => {
    if (
      !licenseInformation[selectedModuleName] &&
      getModulesWithSubscriptionsRoutesMap({ selectedModuleName, projectData, accountId }).has(selectedModuleName) &&
      !isOnPrem()
    ) {
      if (FREE_PLAN_ENABLED) {
        return getString('common.startFreePlan')
      }
      return getString('common.startTrial')
    }
    return getString('projectsOrgs.goToModuleBtn')
  }
  return (
    <Button
      text={getBtnText()}
      variation={ButtonVariation.PRIMARY}
      onClick={() => {
        if (
          projectData &&
          projectData.orgIdentifier &&
          (isOnPrem() ||
            licenseInformation[selectedModuleName] ||
            !getModulesWithSubscriptionsRoutesMap({ selectedModuleName, projectData, accountId }).has(
              selectedModuleName
            ))
        ) {
          history.push(
            getModuleLink({
              module: selectedModuleName,
              orgIdentifier: projectData?.orgIdentifier,
              projectIdentifier: projectData.identifier,
              accountId
            })
          )
        } else {
          if (FREE_PLAN_ENABLED) {
            startFreeLicense()
          } else {
            startTrialLicense()
          }
        }
      }}
    ></Button>
  )
}
export const useModuleSelectModal = ({
  onSuccess,
  onCloseModal
}: UseModuleSelectModalProps): UseModuleSelectModalReturn => {
  const { getString } = useStrings()
  const history = useHistory()
  const { accountId } = useParams<AccountPathProps>()

  const [selectedModuleName, setSelectedModuleName] = React.useState<ModuleName>()
  const [projectData, setProjectData] = React.useState<Project>()

  const { CDNG_ENABLED, CVNG_ENABLED, CING_ENABLED, CENG_ENABLED, CFNG_ENABLED, SECURITY } = useFeatureFlags()
  const modalProps: IDialogProps = {
    isOpen: true,
    enforceFocus: false,
    style: {
      width: 1100,
      borderLeft: 0,
      paddingBottom: 0,
      position: 'relative',
      overflow: 'auto'
    }
  }
  const infoCards: InfoCards[] = []

  if (CDNG_ENABLED) {
    infoCards.push({
      name: ModuleName.CD
    })
  }
  if (CING_ENABLED) {
    infoCards.push({
      name: ModuleName.CI
    })
  }
  if (CFNG_ENABLED) {
    infoCards.push({
      name: ModuleName.CF
    })
  }
  if (CENG_ENABLED) {
    infoCards.push({
      name: ModuleName.CE
    })
  }
  if (CVNG_ENABLED) {
    infoCards.push({
      name: ModuleName.CV
    })
  }
  if (SECURITY) {
    infoCards.push({
      name: ModuleName.STO
    })
  }

  const [showModal, hideModal] = useModalHook(
    () => (
      <Dialog
        onClose={() => {
          onSuccess?.()
          onCloseModal?.()
          hideModal()
        }}
        {...modalProps}
        title={
          <Container padding={{ left: 'xxlarge', top: 'xxlarge' }}>
            <Text font={{ variation: FontVariation.H3 }}>{getString('projectsOrgs.moduleSelectionTitle')}</Text>
          </Container>
        }
      >
        <Layout.Horizontal padding="huge">
          <Layout.Horizontal className={css.cardsContainer}>
            {infoCards.map(module => {
              const desc = getModuleDescriptionsForModuleSelectionDialog(module.name)
              return (
                <Card
                  className={css.card}
                  key={module.name}
                  interactive
                  selected={module.name === selectedModuleName}
                  onClick={() => {
                    setSelectedModuleName(module.name)
                  }}
                >
                  <Layout.Vertical spacing="small">
                    <Layout.Horizontal flex spacing="small">
                      <Icon name={getModuleIcon(module.name)} size={35}></Icon>
                      <Text font={{ variation: FontVariation.H6 }}>
                        {getString(getModuleFullLengthTitle(module.name))}
                      </Text>
                    </Layout.Horizontal>
                    <Text font={{ variation: FontVariation.SMALL }}>{desc && getString(desc)}</Text>
                  </Layout.Vertical>
                </Card>
              )
            })}
          </Layout.Horizontal>
          <Container className={css.moduleActionDiv} padding={{ left: 'huge' }}>
            {selectedModuleName
              ? ModuleSelectionFactory.getModuleSelectionEle(selectedModuleName) || (
                  <Layout.Vertical spacing="medium">
                    <Text font={{ variation: FontVariation.H4 }}>
                      {getString(getModuleFullLengthTitle(selectedModuleName))}
                    </Text>
                    {projectData && selectedModuleName ? (
                      <GoToModuleBtn selectedModuleName={selectedModuleName} projectData={projectData} />
                    ) : null}
                  </Layout.Vertical>
                )
              : null}
          </Container>
        </Layout.Horizontal>
      </Dialog>
    ),
    [selectedModuleName]
  )

  const open = useCallback(
    (projectDataLocal: Project) => {
      setProjectData(projectDataLocal)
      showModal()
    },
    [showModal]
  )
  const communityEditionCDHomeRedirect = (projectDataLocal: Project): void => {
    if (projectDataLocal?.orgIdentifier) {
      history.push(
        getModuleLink({
          module: ModuleName.CD,
          orgIdentifier: projectDataLocal?.orgIdentifier,
          projectIdentifier: projectDataLocal.identifier,
          accountId
        })
      )
    }
  }
  const isCommunity = useGetCommunity()

  return {
    openModuleSelectModal: (projectDataLocal: Project) => {
      if (isCommunity) {
        communityEditionCDHomeRedirect(projectDataLocal)
      } else {
        open(projectDataLocal)
      }
    },
    closeModuleSelectModal: hideModal
  }
}
