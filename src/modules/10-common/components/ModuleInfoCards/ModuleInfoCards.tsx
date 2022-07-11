/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Text, Icon, IconName, Heading, Card, Layout } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import cx from 'classnames'
import { useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'
import type { Module } from '@common/interfaces/RouteInterfaces'
import type { StringsMap } from 'stringTypes'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import css from './ModuleInfoCards.module.scss'
interface InfoCards {
  [key: string]: Array<ModuleInfoCard>
}

interface ModuleInfoCardsProps {
  module: Module
  selectedInfoCard: ModuleInfoCard | undefined
  setSelectedInfoCard: (moduleInfoCard: ModuleInfoCard) => void
  style?: React.CSSProperties
  className?: string
  fontColor?: string
}
type FooterProps = {
  title: string
  icons: {
    name: string
    enabled: boolean
  }[]
}
export interface ModuleInfoCard {
  icon: IconName
  iconClassName?: string
  title: string
  subtitle?: string
  description: string
  route?: () => string
  isNgRoute?: boolean
  isNew?: boolean
  footer?: FooterProps
  disabled?: boolean
}

const INFO_CARD_STYLES: { [key: string]: string } = {
  cd: css.cd
}

export const getInfoCardsProps = (accountId: string, CDNG_ENABLED = true): InfoCards => {
  return {
    cd: [
      {
        icon: 'command-approval',
        iconClassName: css.commandApproval,
        title: 'common.purpose.cd.1stGen.title',
        description: 'common.purpose.cd.1stGen.description',
        route: () => `${window.location.href.split('/ng/')[0]}/#/account/${accountId}/onboarding`,
        footer: {
          title: 'common.purpose.cd.supportedStack',
          icons: [
            {
              name: 'app-aws-code-deploy',
              enabled: true
            },
            {
              name: 'service-aws-lamda',
              enabled: true
            },
            {
              name: 'main-service-ami',
              enabled: true
            },
            {
              name: 'app-kubernetes',
              enabled: true
            },
            {
              name: 'command-winrm',
              enabled: true
            },
            {
              name: 'service-pivotal',
              enabled: true
            },
            {
              name: 'app-aws-lambda',
              enabled: true
            }
          ]
        }
      },
      {
        icon: 'cd-solid',
        iconClassName: css.cdMain,
        title: 'common.purpose.cd.newGen.title',
        description: 'common.purpose.cd.newGen.description',
        isNgRoute: true,
        disabled: !CDNG_ENABLED,
        isNew: true,
        footer: {
          title: 'common.purpose.cd.supportedStack',
          icons: [
            {
              name: 'app-kubernetes',
              enabled: true
            },
            {
              name: 'app-aws-code-deploy',
              enabled: false
            },
            {
              name: 'service-aws-lamda',
              enabled: false
            },
            {
              name: 'main-service-ami',
              enabled: false
            },
            {
              name: 'command-winrm',
              enabled: false
            },
            {
              name: 'service-pivotal',
              enabled: false
            },
            {
              name: 'app-aws-lambda',
              enabled: false
            }
          ]
        }
      }
    ]
  }
}

const Footer = ({ footer, fontColor }: { footer: FooterProps; fontColor: string }): React.ReactElement => {
  const { getString } = useStrings()
  const { title, icons } = footer
  return (
    <Layout.Vertical padding={{ top: 'large' }}>
      <Text className={css.footerTitle} color={fontColor}>
        {getString(title as keyof StringsMap)}
      </Text>
      <Layout.Horizontal spacing="small">
        {icons.map(icon =>
          icon.enabled ? (
            <Text key={icon.name} icon={icon.name as IconName} className={css.enabled} />
          ) : (
            <Text
              key={icon.name}
              icon={icon.name as IconName}
              tooltip="coming soon"
              iconProps={{ style: { opacity: '0.5' } }}
            />
          )
        )}
      </Layout.Horizontal>
    </Layout.Vertical>
  )
}

const getCardKey = ({ key1, key2 }: { key1?: string; key2?: string }): string => `${key1} ${key2}`

const ModuleInfoCards: React.FC<ModuleInfoCardsProps> = props => {
  const { module, selectedInfoCard, setSelectedInfoCard, style } = props
  const { getString } = useStrings()
  const { CDNG_ENABLED } = useFeatureFlags()

  const { accountId } = useParams<{
    accountId: string
  }>()

  const fontColor = props.fontColor ? props.fontColor : Color.BLACK

  const getModuleInfoCards = (infoCard: ModuleInfoCard, infoCardStyle: string): React.ReactElement => {
    const cardKey = getCardKey({ key1: infoCard.title, key2: infoCard.subtitle })

    function handleCardClick(): void {
      if (!infoCard.disabled) {
        setSelectedInfoCard(infoCard)
      }
    }

    const selected = getCardKey({ key1: selectedInfoCard?.title, key2: selectedInfoCard?.subtitle }) === cardKey

    return (
      <Card
        key={cardKey}
        disabled={infoCard.disabled}
        selected={selected}
        className={cx(css.card, css.infoCard, infoCardStyle, props.className)}
        onClick={handleCardClick}
      >
        <Layout.Horizontal spacing="small" padding={{ bottom: 'large' }}>
          <Icon className={infoCard.iconClassName} name={infoCard.icon} size={40} />
          <div>
            <Layout.Horizontal spacing="small">
              <Text font="xsmall" color={fontColor} className={css.title}>
                {getString(infoCard.title as keyof StringsMap)}
              </Text>
              {infoCard.isNew && (
                <Text
                  className={css.new}
                  background={Color.PRIMARY_5}
                  width={48}
                  height={22}
                  color={Color.WHITE}
                  border={{ radius: 0 }}
                  font={{ align: 'center', size: 'small', weight: 'light' }}
                  margin={{ left: 30 }}
                >
                  {getString('common.new').toUpperCase()}
                </Text>
              )}
            </Layout.Horizontal>
            {infoCard.subtitle && (
              <Text font={{ size: 'medium' }} color={fontColor}>
                {getString(infoCard.subtitle as keyof StringsMap)}
              </Text>
            )}
          </div>
        </Layout.Horizontal>
        <Text font="small" padding={{ bottom: 'small' }} color={fontColor}>
          {getString(infoCard.description as keyof StringsMap)}
        </Text>
        {infoCard.footer && <Footer footer={infoCard.footer} fontColor={fontColor} />}
      </Card>
    )
  }

  const infoCardProps = getInfoCardsProps(accountId, CDNG_ENABLED)[module]

  const infoCardStyle = INFO_CARD_STYLES[module]

  const infoCards = infoCardProps?.map(cardProps => getModuleInfoCards(cardProps, infoCardStyle))

  if (!infoCardProps) {
    return <></>
  }

  return (
    <>
      <Layout.Horizontal flex={{ justifyContent: 'space-between' }}>
        <Heading color={Color.BLACK} font={{ size: 'medium', weight: 'bold' }} padding={{ top: 'xlarge' }}>
          {getString('common.purpose.howToProceed')}
        </Heading>
      </Layout.Horizontal>
      <Layout.Horizontal spacing="small" style={{ ...style }}>
        {infoCards}
      </Layout.Horizontal>
      <a
        className={css.compareVersion}
        href="https://docs.harness.io/article/1fjmm4by22-harness-first-gen-vs-harness-next-gen"
        target="_blank"
        rel="noreferrer"
      >
        {getString('common.purpose.compare')}
      </a>
    </>
  )
}

export default ModuleInfoCards
