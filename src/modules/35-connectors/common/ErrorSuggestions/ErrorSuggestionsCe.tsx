/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Container, Icon, Layout, Text, IconName } from '@harness/uicore'
import { Color, FontVariation } from '@harness/design-system'
import React from 'react'
import cx from 'classnames'
import { Connectors } from '@connectors/constants'
import { useStrings } from 'framework/strings'
import type { ResponseMessage } from 'services/cd-ng'
import css from '@common/components/ErrorHandler/ErrorHandler.module.scss'

const Suggestions: React.FC<{
  items: ResponseMessage[]
  header: string
  icon: IconName
  connectorType: string
}> = props => {
  const { getString } = useStrings()
  if (!props.items.length) {
    return null
  }
  /* istanbul ignore next */
  const getDocumentIndex = (msg: string) => {
    const docIndex = msg.lastIndexOf('documentation')
    let firstStr = msg
    let secondStr = ''
    if (docIndex >= 0) {
      firstStr = msg.slice(0, docIndex)
      secondStr = msg.slice(docIndex)
    }
    return { firstStr, secondStr }
  }

  /* istanbul ignore next */
  const getDocLink = () => {
    switch (props.connectorType) {
      case Connectors.CE_KUBERNETES:
        return 'https://docs.harness.io/article/ltt65r6k39-set-up-cost-visibility-for-kubernetes'

      case Connectors.CEAWS:
        return 'https://docs.harness.io/article/80vbt5jv0q-set-up-cost-visibility-for-aws'

      case Connectors.CE_AZURE:
        return 'https://docs.harness.io/article/v682mz6qfd-set-up-cost-visibility-for-azure'

      case Connectors.CE_GCP:
        return 'https://docs.harness.io/article/kxnsritjls-set-up-cost-visibility-for-gcp'

      default:
        return 'https://docs.harness.io/article/n8e7rddf8w-cloud-cost-management-overview'
    }
  }

  const docUrl = getDocLink()
  return (
    <Layout.Horizontal margin={{ bottom: 'xlarge' }}>
      <Icon name={props.icon} margin={{ right: 'small' }} />
      <Layout.Vertical className={cx(css.errorListTextContainer, css.shrink)}>
        <Text font={{ variation: FontVariation.SMALL_SEMI }} color={Color.BLACK} margin={{ bottom: 'xsmall' }}>
          {props.header}
        </Text>
        {props.items.map((item, index) => {
          const { firstStr, secondStr } = getDocumentIndex(item.message as string)
          return (
            <Container margin={{ bottom: 'xsmall' }} key={index}>
              <Text color={Color.BLACK} font={{ variation: FontVariation.SMALL }} className={css.text}>
                {firstStr}
                {secondStr ? (
                  /* istanbul ignore next */
                  <a href={docUrl} target="_blank" rel="noreferrer" className={cx(css.link, css.linkSmall)}>
                    {secondStr}
                  </a>
                ) : /* istanbul ignore next */ null}
              </Text>
              {!secondStr ? (
                <Text font={{ variation: FontVariation.SMALL_SEMI }} color={Color.BLACK} margin={{ bottom: 'xsmall' }}>
                  {getString('common.errorHandler.contactLabel')}
                  <a href="mailto:support@harness.io">{getString('common.errorHandler.contactSupport')}</a>
                  {getString('or')}
                  <a href="https://community.harness.io/" target="_blank" rel="noreferrer">
                    {getString('common.errorHandler.communityForum')}
                  </a>
                </Text>
              ) : /* istanbul ignore next */ null}
            </Container>
          )
        })}
      </Layout.Vertical>
    </Layout.Horizontal>
  )
}

export default Suggestions
