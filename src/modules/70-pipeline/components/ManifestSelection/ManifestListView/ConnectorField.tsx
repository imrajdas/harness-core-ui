/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container, Text, Icon, Color, MultiTypeInputType, getMultiTypeFromValue } from '@harness/uicore'
import { ManifestIconByType } from '../Manifesthelper'
import type { ManifestStores } from '../ManifestInterface'
import css from '../ManifestSelection.module.scss'

interface ConnectorFieldPropType {
  manifestStore: ManifestStores
  connectorRef: string
  connectorColor: string
  connectorName: string | undefined
}
function ConnectorField({
  manifestStore,
  connectorRef,
  connectorName,
  connectorColor
}: ConnectorFieldPropType): React.ReactElement {
  return (
    <div className={css.connectorNameField}>
      {connectorRef ? (
        <>
          <Icon padding={{ right: 'small' }} name={ManifestIconByType[manifestStore]} size={18} />
          <Text
            tooltip={
              <Container className={css.borderRadius} padding="medium">
                <div>
                  <Text font="small" color={Color.GREY_100}>
                    {connectorName}
                  </Text>
                  <Text font="small" color={Color.GREY_300}>
                    {connectorRef}
                  </Text>
                </div>
              </Container>
            }
            tooltipProps={{ isDark: true }}
            alwaysShowTooltip
            className={css.connectorName}
            lineClamp={1}
          >
            {connectorName ?? connectorRef}
          </Text>
          {getMultiTypeFromValue(connectorRef) === MultiTypeInputType.FIXED && (
            <Icon name="full-circle" size={8} color={connectorColor} />
          )}
        </>
      ) : (
        <Text>{manifestStore}</Text>
      )}
    </div>
  )
}

export default ConnectorField
