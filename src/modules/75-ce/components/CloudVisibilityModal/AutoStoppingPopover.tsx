/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import { Text, Icon, Layout } from '@harness/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { Classes, Popover, PopoverInteractionKind, Position } from '@blueprintjs/core'
import { String, useStrings } from 'framework/strings'
import type { StringsMap } from 'stringTypes'

const AutoStoppingPopover = () => {
  const { getString } = useStrings()

  const features: (keyof StringsMap)[] = useMemo(
    () => [
      'ce.cloudIntegration.autoStoppingModal.popover.feat1',
      'ce.cloudIntegration.autoStoppingModal.popover.feat2',
      'ce.cloudIntegration.autoStoppingModal.popover.feat3',
      'ce.cloudIntegration.autoStoppingModal.popover.feat4',
      'ce.cloudIntegration.autoStoppingModal.popover.feat5'
    ],
    []
  )

  return (
    <Popover
      popoverClassName={Classes.DARK}
      position={Position.BOTTOM_LEFT}
      interactionKind={PopoverInteractionKind.HOVER}
      content={
        <Layout.Vertical width={436} padding={'medium'} spacing={'medium'}>
          <Text font={{ variation: FontVariation.BODY }} color={Color.WHITE}>
            <String stringID="ce.cloudIntegration.autoStoppingModal.popover.title" useRichText />
          </Text>
          <div>
            {features.map(feature => (
              <Text
                key={feature}
                color={Color.WHITE}
                font={{ variation: FontVariation.BODY }}
                icon="tick"
                iconProps={{ size: 12, color: Color.GREEN_700, margin: { right: 'medium' } }}
              >
                {getString(feature)}
              </Text>
            ))}
          </div>
          <Text font={{ variation: FontVariation.BODY }} color={Color.WHITE}>
            <String stringID="ce.cloudIntegration.costVisibilityDialog.popover.permissions" useRichText />
          </Text>
        </Layout.Vertical>
      }
    >
      <Icon name="info" color={Color.PRIMARY_7} size={20} margin={{ left: 'xsmall' }} />
    </Popover>
  )
}

export default AutoStoppingPopover
