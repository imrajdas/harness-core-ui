/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'
import { Text, FontVariation, Icon, Layout, Button, ButtonVariation, Container } from '@harness/uicore'
import type { IconProps } from '@harness/icons'
import { useStrings } from 'framework/strings'
import type { StringsMap } from 'stringTypes'

import css from './GetStartedWithCD.module.scss'

export default function GetStartedWithCD(): React.ReactElement {
  const { getString } = useStrings()

  const renderBuildPipelineStep = React.useCallback(
    ({ iconProps, label, isLastStep }: { iconProps: IconProps; label: keyof StringsMap; isLastStep?: boolean }) => (
      <Layout.Horizontal flex padding={{ right: 'xsmall' }} spacing="xsmall">
        <Icon name={iconProps.name} size={iconProps.size} className={iconProps.className} />
        <Text font={{ variation: FontVariation.TINY }} padding={{ left: 'xsmall', right: 'xsmall' }}>
          {getString(label)}
        </Text>
        {!isLastStep ? <Icon name="arrow-right" size={10} className={css.arrow} /> : null}
      </Layout.Horizontal>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // const CI_CATALOGUE_ITEMS: { icon: IconName; label: keyof StringsMap; helptext: keyof StringsMap }[][] = [
  //   [
  //     {
  //       icon: 'ci-ti',
  //       label: 'ci.getStartedWithCI.ti',
  //       helptext: 'ci.getStartedWithCI.tiHelpText'
  //     },
  //     {
  //       icon: 'ci-infra-support',
  //       label: 'ci.getStartedWithCI.flexibleInfra',
  //       helptext: 'ci.getStartedWithCI.flexibleInfraHelpText'
  //     }
  //   ],
  //   [
  //     {
  //       icon: 'ci-language',
  //       label: 'ci.getStartedWithCI.languageAgnostic',
  //       helptext: 'ci.getStartedWithCI.languageAgnosticHelpText'
  //     },
  //     {
  //       icon: 'ci-dev-exp',
  //       label: 'ci.getStartedWithCI.devFriendly',
  //       helptext: 'ci.getStartedWithCI.devFriendlyHelpText'
  //     }
  //   ],
  //   [
  //     {
  //       icon: 'ci-parameterization',
  //       label: 'ci.getStartedWithCI.parameterization',
  //       helptext: 'ci.getStartedWithCI.parameterizationHelpText'
  //     },
  //     {
  //       icon: 'ci-gov',
  //       label: 'ci.getStartedWithCI.security',
  //       helptext: 'ci.getStartedWithCI.securityHelpText'
  //     }
  //   ],
  //   [
  //     {
  //       icon: 'ci-execution',
  //       label: 'ci.getStartedWithCI.parallelization',
  //       helptext: 'ci.getStartedWithCI.parallelizationHelpText'
  //     },
  //     {
  //       icon: 'ci-integrated',
  //       label: 'ci.getStartedWithCI.integratedCICD',
  //       helptext: 'ci.getStartedWithCI.integratedCICDHelpText'
  //     }
  //   ]
  // ]

  // const renderCatalogueItem = React.useCallback(
  //   ({ icon, label, helptext }: { icon: IconName; label: keyof StringsMap; helptext: keyof StringsMap }) => (
  //     <Layout.Vertical
  //       key={label}
  //       width="45%"
  //       margin={{ left: 'huge', right: 'huge' }}
  //       padding={{ left: 'medium', right: 'medium' }}
  //     >
  //       <Icon name={icon} size={50} />
  //       <Text font={{ variation: FontVariation.CARD_TITLE }}>{getString(label)}</Text>
  //       <Text font={{ variation: FontVariation.SMALL }}>{getString(helptext)}</Text>
  //     </Layout.Vertical>
  //   ),
  //   []
  // )

  // const Divider = <div className={css.divider}></div>

  return (
    <>
      <Layout.Vertical flex>
        <Layout.Horizontal flex={{ alignItems: 'flex-start' }} className={css.buildYourOwnPipeline}>
          <Layout.Horizontal flex margin={{ bottom: 'huge' }}>
            <Icon name="cd-main" size={50} className={css.cdIcon} />
            <Text font={{ variation: FontVariation.H1_SEMI }}>{'Continous Delivery'}</Text>
          </Layout.Horizontal>
          <Layout.Horizontal>
            <Icon name="ci-build-pipeline" size={40} />
            <Layout.Vertical padding={{ left: 'medium', right: 'medium' }}>
              <Text font={{ variation: FontVariation.H4 }}>{'buildyourOwnPipeline'}</Text>
              <Text font={{ variation: FontVariation.SMALL }} padding={{ top: 'xsmall' }}>
                {'quicklyCreate'}
              </Text>
              <Container padding={{ top: 'small', bottom: 'small' }}>
                <Container className={cx(css.separator, css.horizontal)} />
              </Container>
              <Layout.Horizontal padding={{ top: 'medium' }}>
                {renderBuildPipelineStep({
                  iconProps: {
                    name: 'ci-infra',
                    size: 15,
                    className: cx(css.icon, css.iconPadding)
                  },
                  label: 'ci.getStartedWithCI.configInfra'
                })}
                {renderBuildPipelineStep({
                  iconProps: { name: 'scm', size: 18, className: cx(css.icon, css.paddingXSmall) },
                  label: 'ci.getStartedWithCI.connectRepo'
                })}
                {renderBuildPipelineStep({
                  iconProps: {
                    name: 'repository',
                    size: 14,
                    className: cx(css.icon, css.iconPadding)
                  },
                  label: 'ci.getStartedWithCI.selectRepo'
                })}
                {renderBuildPipelineStep({
                  iconProps: {
                    name: 'ci-build-pipeline',
                    size: 20,
                    className: cx(css.icon, css.iconPaddingSmall)
                  },
                  label: 'ci.getStartedWithCI.buildPipeline',
                  isLastStep: true
                })}
              </Layout.Horizontal>
            </Layout.Vertical>
          </Layout.Horizontal>
          <Button
            variation={ButtonVariation.PRIMARY}
            text={getString('common.createPipeline')}
            // onClick={() => initiateProvisioning()}
          />
        </Layout.Horizontal>

        <Container padding={{ top: 'xxxlarge', bottom: 'huge' }}>
          <Button
            variation={ButtonVariation.PRIMARY}
            href="https://ngdocs.harness.io/category/zgffarnh1m-ci-category"
            target="_blank"
          >
            {getString('pipeline.createPipeline.learnMore')}
          </Button>
        </Container>
      </Layout.Vertical>
    </>
  )
}
