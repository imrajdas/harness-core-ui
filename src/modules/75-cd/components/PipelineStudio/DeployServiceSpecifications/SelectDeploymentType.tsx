/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Formik, FormikProps } from 'formik'
import { get, noop } from 'lodash-es'
import { Classes, PopoverInteractionKind } from '@blueprintjs/core'
import * as Yup from 'yup'
import { useParams } from 'react-router-dom'
import {
  Card,
  Checkbox,
  Dialog,
  FormError,
  HarnessDocTooltip,
  Icon,
  Layout,
  Popover,
  Text,
  Thumbnail,
  Utils
} from '@harness/uicore'
import { useModalHook } from '@harness/use-modal'
import { Color, FontVariation } from '@harness/design-system'
import cx from 'classnames'
import { useStrings, UseStringsReturn } from 'framework/strings'
import { useGetCommunity } from '@common/utils/utils'
import { errorCheck } from '@common/utils/formikHelpers'
import { StageErrorContext } from '@pipeline/context/StageErrorContext'
import { ServiceDeploymentType } from '@pipeline/utils/stageHelpers'
import { DeployTabs } from '@pipeline/components/PipelineStudio/CommonUtils/DeployStageSetupShellUtils'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import type { StringsMap } from 'framework/strings/StringsContext'
import { CDFirstGenTrial } from './CDFirstGenTrial'
import type { DeploymentTypeItem } from './DeploymentInterface'
import stageCss from '../DeployStageSetupShell/DeployStage.module.scss'
import deployServiceCsss from './DeployServiceSpecifications.module.scss'

export function getServiceDeploymentTypeSchema(
  getString: UseStringsReturn['getString']
): Yup.StringSchema<string | undefined> {
  return Yup.string()
    .oneOf(Object.values(ServiceDeploymentType))
    .required(getString('cd.pipelineSteps.serviceTab.deploymentTypeRequired'))
}

interface SelectServiceDeploymentTypeProps {
  isReadonly: boolean
  shouldShowGitops: boolean
  handleDeploymentTypeChange: (deploymentType: ServiceDeploymentType) => void
  selectedDeploymentType?: ServiceDeploymentType
  viewContext?: string
  handleGitOpsCheckChanged?: (ev: React.FormEvent<HTMLInputElement>) => void
  gitOpsEnabled?: boolean
}

interface CardListProps {
  items: DeploymentTypeItem[]
  isReadonly: boolean
  selectedValue?: string
  onChange: (deploymentType: ServiceDeploymentType) => void
  allowDisabledItemClick?: boolean
}

const DEPLOYMENT_TYPE_KEY = 'deploymentType'

const CardList = ({
  items,
  isReadonly,
  selectedValue,
  onChange,
  allowDisabledItemClick
}: CardListProps): JSX.Element => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange(e.target.value as ServiceDeploymentType)
  }
  return (
    <Layout.Horizontal spacing={'medium'} className={stageCss.cardListContainer}>
      {items.map(item => {
        const itemContent = (
          <Thumbnail
            key={item.value}
            label={item.label}
            value={item.value}
            icon={item.icon}
            disabled={item.disabled || isReadonly}
            selected={item.value === selectedValue}
            onClick={handleChange}
          />
        )
        return (
          <Utils.WrapOptionalTooltip key={item.value} tooltipProps={item.tooltipProps} tooltip={item.tooltip}>
            {allowDisabledItemClick ? (
              <div onClick={() => onChange(item.value as ServiceDeploymentType)}>{itemContent}</div>
            ) : (
              itemContent
            )}
          </Utils.WrapOptionalTooltip>
        )
      })}
    </Layout.Horizontal>
  )
}

const getServerlessDeploymentTypes = (
  getString: (key: keyof StringsMap, vars?: Record<string, any> | undefined) => string,
  SERVERLESS_SUPPORT = false
): DeploymentTypeItem[] => {
  if (SERVERLESS_SUPPORT) {
    return [
      {
        label: getString('pipeline.serviceDeploymentTypes.serverlessAwsLambda'),
        icon: 'service-serverless-aws',
        value: ServiceDeploymentType.ServerlessAwsLambda
      }
      // Keeping these for now. If we do not support these in near future, we will remove these.
      //
      // {
      //   label: getString('pipeline.serviceDeploymentTypes.serverlessAzureFunctions'),
      //   icon: 'service-serverless-azure',
      //   value: ServiceDeploymentType.ServerlessAzureFunctions,
      //   disabled: true
      // },
      // {
      //   label: getString('pipeline.serviceDeploymentTypes.serverlessGoogleFunctions'),
      //   icon: 'service-serverless-gcp',
      //   value: ServiceDeploymentType.ServerlessGoogleFunctions,
      //   disabled: true
      // },
      // {
      //   label: getString('pipeline.serviceDeploymentTypes.awsSAM'),
      //   icon: 'service-aws-sam',
      //   value: ServiceDeploymentType.AmazonSAM,
      //   disabled: true
      // },
      // {
      //   label: getString('pipeline.serviceDeploymentTypes.azureFunctions'),
      //   icon: 'service-azure-functions',
      //   value: ServiceDeploymentType.AzureFunctions,
      //   disabled: true
      // }
    ]
  }
  return []
}

export default function SelectDeploymentType({
  selectedDeploymentType,
  gitOpsEnabled,
  isReadonly,
  viewContext,
  shouldShowGitops,
  handleDeploymentTypeChange,
  handleGitOpsCheckChanged
}: SelectServiceDeploymentTypeProps): JSX.Element {
  const { getString } = useStrings()
  const formikRef = React.useRef<FormikProps<unknown> | null>(null)
  const { subscribeForm, unSubscribeForm } = React.useContext(StageErrorContext)
  const { SERVERLESS_SUPPORT, SSH_NG, AZURE_WEBAPP_NG } = useFeatureFlags()

  const { accountId } = useParams<{
    accountId: string
  }>()
  const [selectedDeploymentTypeInCG, setSelectedDeploymentTypeInCG] = React.useState('')

  // Supported in NG (Next Gen - The one for which you are coding right now)
  const ngSupportedDeploymentTypes: DeploymentTypeItem[] = React.useMemo(() => {
    const baseTypes = [
      {
        label: getString('pipeline.serviceDeploymentTypes.kubernetes'),
        icon: 'service-kubernetes',
        value: ServiceDeploymentType.Kubernetes
      },
      {
        label: getString('pipeline.nativeHelm'),
        icon: 'service-helm',
        value: ServiceDeploymentType.NativeHelm
      }
    ]
    if (SSH_NG) {
      baseTypes.push({
        label: getString('pipeline.serviceDeploymentTypes.ssh'),
        icon: 'secret-ssh',
        value: ServiceDeploymentType.ssh
      })
      baseTypes.push({
        label: getString('pipeline.serviceDeploymentTypes.winrm'),
        icon: 'command-winrm',
        value: ServiceDeploymentType.winrm
      })
    }
    if (AZURE_WEBAPP_NG) {
      baseTypes.push({
        label: 'Azure Web App',
        icon: 'microsoft-azure',
        value: ServiceDeploymentType.AzureWebApps
      })
    }
    return [...baseTypes, ...getServerlessDeploymentTypes(getString, SERVERLESS_SUPPORT)] as DeploymentTypeItem[]
  }, [getString, SERVERLESS_SUPPORT, SSH_NG, AZURE_WEBAPP_NG])

  // Suppported in CG (First Gen - Old Version of Harness App)
  const cgSupportedDeploymentTypes: DeploymentTypeItem[] = React.useMemo(() => {
    const types = [
      {
        label: getString('pipeline.serviceDeploymentTypes.amazonEcs'),
        icon: 'service-ecs',
        value: ServiceDeploymentType.amazonEcs
      },
      {
        label: getString('pipeline.serviceDeploymentTypes.amazonAmi'),
        icon: 'main-service-ami',
        value: ServiceDeploymentType.amazonAmi
      },
      {
        label: getString('pipeline.serviceDeploymentTypes.awsCodeDeploy'),
        icon: 'app-aws-code-deploy',
        value: ServiceDeploymentType.awsCodeDeploy
      },
      {
        label: getString('pipeline.serviceDeploymentTypes.awsLambda'),
        icon: 'app-aws-lambda',
        value: ServiceDeploymentType.awsLambda
      },
      {
        label: getString('pipeline.serviceDeploymentTypes.pcf'),
        icon: 'service-pivotal',
        value: ServiceDeploymentType.pcf
      }
    ]
    if (!SSH_NG) {
      types.splice(3, 0, {
        label: getString('pipeline.serviceDeploymentTypes.ssh'),
        icon: 'secret-ssh',
        value: ServiceDeploymentType.ssh
      })
      types.splice(4, 0, {
        label: getString('pipeline.serviceDeploymentTypes.winrm'),
        icon: 'command-winrm',
        value: ServiceDeploymentType.winrm
      })
    }
    return types as DeploymentTypeItem[]
  }, [getString, SSH_NG])

  const [cgDeploymentTypes, setCgDeploymentTypes] = React.useState(cgSupportedDeploymentTypes)
  const [ngDeploymentTypes, setNgDeploymentTypes] = React.useState(ngSupportedDeploymentTypes)
  const isCommunity = useGetCommunity()
  const hasError = errorCheck(DEPLOYMENT_TYPE_KEY, formikRef?.current)

  const [showCurrentGenSwitcherModal, hideCurrentGenSwitcherModal] = useModalHook(() => {
    return (
      <Dialog
        isOpen={true}
        enforceFocus={false}
        canEscapeKeyClose
        canOutsideClickClose
        onClose={hideCurrentGenSwitcherModal}
        isCloseButtonShown
        style={{
          width: 1200,
          height: 600,
          padding: 0
        }}
      >
        <CDFirstGenTrial
          selectedDeploymentType={cgDeploymentTypes.find(type => type.value === selectedDeploymentTypeInCG)}
          accountId={accountId}
        />
      </Dialog>
    )
  }, [selectedDeploymentTypeInCG])

  React.useEffect(() => {
    if (isCommunity) {
      cgSupportedDeploymentTypes.forEach(deploymentType => {
        deploymentType['disabled'] = true
      })
      setCgDeploymentTypes(cgSupportedDeploymentTypes)
    } else {
      setNgDeploymentTypes(ngSupportedDeploymentTypes)
      cgSupportedDeploymentTypes.forEach(deploymentType => {
        deploymentType['disabled'] = true
        deploymentType['tooltip'] = (
          <div
            className={cx(deployServiceCsss.tooltipContainer, deployServiceCsss.cursorPointer)}
            onClick={() => {
              setSelectedDeploymentTypeInCG(deploymentType.value)
              showCurrentGenSwitcherModal()
            }}
          >
            Use in Continuous Delivery First Generation
          </div>
        )
        deploymentType['tooltipProps'] = { isDark: true }
      })
      setCgDeploymentTypes(cgSupportedDeploymentTypes)
    }
  }, [])

  React.useEffect(() => {
    subscribeForm({ tab: DeployTabs.SERVICE, form: formikRef })
    return () => unSubscribeForm({ tab: DeployTabs.SERVICE, form: formikRef })
  }, [formikRef])

  const renderDeploymentTypes = React.useCallback((): JSX.Element => {
    if (!isCommunity) {
      const tooltipContent = (
        <article className={cx(deployServiceCsss.cdGenerationSelectionTooltip, deployServiceCsss.tooltipContainer)}>
          <section className={deployServiceCsss.cdGenerationSwitchContainer}>
            <div className={cx(deployServiceCsss.cdGenerationSwitcher, deployServiceCsss.cdGenerationSwitcherSelected)}>
              <div className={deployServiceCsss.newText}>NEW</div>
              <Icon className="infoCard.iconClassName" name="cd-solid" size={24} />
              {getString('common.purpose.cd.newGen.title')}
            </div>
            <div
              className={cx(deployServiceCsss.cdGenerationSwitcher, deployServiceCsss.cursorPointer)}
              onClick={() => {
                setSelectedDeploymentTypeInCG('')
                showCurrentGenSwitcherModal()
              }}
            >
              <Icon className={'infoCard.iconClassName'} name="command-approval" size={24} />
              {getString('common.purpose.cd.1stGen.title')}
            </div>
          </section>
          <section className={deployServiceCsss.cdGenerationContent}>
            <Text color={Color.GREY_0} font={{ variation: FontVariation.BODY }}>
              {getString('cd.cdSwitchToFirstGen.description4')}
            </Text>
            <a
              className={deployServiceCsss.learnMore}
              href="https://docs.harness.io/article/1fjmm4by22"
              rel="noreferrer"
              target="_blank"
            >
              {getString('cd.cdSwitchToFirstGen.learnMoreAboutCD1stGen')}
            </a>
          </section>
        </article>
      )
      return (
        <Layout.Horizontal margin={{ top: 'medium' }}>
          <Layout.Vertical padding={viewContext ? { right: 'huge' } : { right: 'small' }}>
            <div className={cx(stageCss.tabSubHeading, 'ng-tooltip-native')}>
              {getString('common.currentlyAvailable')}
            </div>
            <CardList
              items={ngDeploymentTypes}
              isReadonly={isReadonly}
              onChange={handleDeploymentTypeChange}
              selectedValue={selectedDeploymentType}
            />
            {hasError ? (
              <FormError
                name={DEPLOYMENT_TYPE_KEY}
                errorMessage={get(formikRef?.current?.errors, DEPLOYMENT_TYPE_KEY)}
              />
            ) : null}
          </Layout.Vertical>
          {!!viewContext && (
            <Layout.Vertical border={{ left: true }} padding={{ left: 'huge' }}>
              <Layout.Horizontal>
                <div className={deployServiceCsss.comingSoonBanner}>{getString('common.comingSoon')}</div>
                <div
                  className={cx(stageCss.tabSubHeading, deployServiceCsss.currentGenSupported, 'ng-tooltip-native')}
                  data-tooltip-id="supportedInFirstGeneration"
                >
                  {getString('common.currentlySupportedOn')}
                  <a
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                      setSelectedDeploymentTypeInCG('')
                      showCurrentGenSwitcherModal()
                    }}
                    style={{ paddingLeft: '4px' }}
                  >
                    {getString('common.firstGeneration')}
                  </a>
                  <HarnessDocTooltip tooltipId="supportedInFirstGeneration" useStandAlone={true} />
                </div>
                <Popover
                  position="auto"
                  interactionKind={PopoverInteractionKind.HOVER}
                  content={tooltipContent}
                  className={Classes.DARK}
                >
                  <span className={deployServiceCsss.tooltipIcon}>
                    <Icon size={12} name="tooltip-icon" color={Color.PRIMARY_7} />
                  </span>
                </Popover>
              </Layout.Horizontal>
              <CardList
                items={cgDeploymentTypes}
                isReadonly={isReadonly}
                onChange={(deploymentType: string) => {
                  setSelectedDeploymentTypeInCG(deploymentType)
                  showCurrentGenSwitcherModal()
                }}
                selectedValue={selectedDeploymentType}
                allowDisabledItemClick={true}
              />
            </Layout.Vertical>
          )}
        </Layout.Horizontal>
      )
    }
    return (
      <CardList
        items={viewContext ? [...ngSupportedDeploymentTypes, ...cgDeploymentTypes] : [...ngSupportedDeploymentTypes]}
        isReadonly={isReadonly}
        onChange={handleDeploymentTypeChange}
        selectedValue={selectedDeploymentType}
      />
    )
  }, [cgDeploymentTypes, ngSupportedDeploymentTypes, getString, isReadonly, handleDeploymentTypeChange])

  const renderGitops = (): JSX.Element | null => {
    if (shouldShowGitops && selectedDeploymentType === ServiceDeploymentType.Kubernetes) {
      return (
        <Checkbox
          label={getString('common.gitOps')}
          name="gitOpsEnabled"
          checked={gitOpsEnabled}
          onChange={handleGitOpsCheckChanged}
          disabled={isReadonly}
        />
      )
    }
    return null
  }

  return (
    <Formik<{ deploymentType: string; gitOpsEnabled: boolean }>
      onSubmit={noop}
      enableReinitialize={true}
      initialValues={{
        deploymentType: selectedDeploymentType as string,
        gitOpsEnabled: shouldShowGitops ? !!gitOpsEnabled : false
      }}
      validationSchema={Yup.object().shape({
        deploymentType: getServiceDeploymentTypeSchema(getString)
      })}
    >
      {formik => {
        window.dispatchEvent(new CustomEvent('UPDATE_ERRORS_STRIP', { detail: DeployTabs.SERVICE }))
        formikRef.current = formik as FormikProps<unknown> | null
        if (viewContext) {
          return (
            <Card className={stageCss.sectionCard}>
              <div
                className={cx(stageCss.tabSubHeading, 'ng-tooltip-native')}
                data-tooltip-id="stageOverviewDeploymentType"
              >
                {getString('deploymentTypeText')}
                <HarnessDocTooltip tooltipId="stageOverviewDeploymentType" useStandAlone={true} />
              </div>
              {renderDeploymentTypes()}
              {renderGitops()}
            </Card>
          )
        } else {
          return (
            <div className={stageCss.stageView}>
              <div
                className={cx(stageCss.deploymentTypeHeading, 'ng-tooltip-native')}
                data-tooltip-id="stageOverviewDeploymentType"
              >
                {getString('deploymentTypeText')}
                <HarnessDocTooltip tooltipId="stageOverviewDeploymentType" useStandAlone={true} />
              </div>
              {renderDeploymentTypes()}
            </div>
          )
        }
      }}
    </Formik>
  )
}
