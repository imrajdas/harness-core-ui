/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Icon, PopoverPosition } from '@blueprintjs/core'
import { ButtonVariation } from '@harness/uicore'
import React, { ReactElement } from 'react'
import { useStrings } from 'framework/strings'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import RbacOptionsMenuButton from '@rbac/components/RbacOptionsMenuButton/RbacOptionsMenuButton'
import { ResourceType } from '@rbac/interfaces/ResourceType'

import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'

import type { Variation } from 'services/cf'
import useActiveEnvironment from '@cf/hooks/useActiveEnvironment'
import type { VariationColorMap } from '../../types'
export interface AddTargetingButtonProps {
  targetingDropdownVariations: Variation[]
  addVariation: (newVariation: Variation) => void
  variationColorMap: VariationColorMap
  addPercentageRollout: () => void
  featureDisabled?: boolean
  disabled?: boolean
}

const AddTargetingButton = ({
  targetingDropdownVariations,
  variationColorMap,
  addVariation,
  addPercentageRollout
}: AddTargetingButtonProps): ReactElement => {
  const { getString } = useStrings()
  const { activeEnvironment } = useActiveEnvironment()

  const items = [
    ...targetingDropdownVariations.map(variation => ({
      'data-testid': `variation_option_${variation.identifier}`,
      onClick: () => addVariation(variation),
      icon: <Icon icon="full-circle" color={variationColorMap[variation.identifier]} />,
      text: variation.name || variation.identifier,
      permission: {
        resource: { resourceType: ResourceType.ENVIRONMENT, resourceIdentifier: activeEnvironment },
        permission: PermissionIdentifier.EDIT_FF_FEATUREFLAG
      },
      featuresProps: {
        featuresRequest: {
          featureNames: [FeatureIdentifier.MAUS]
        }
      }
    })),
    {
      'data-testid': 'variation_option_percentage_rollout',
      onClick: () => addPercentageRollout(),
      icon: <Icon icon="percentage" />,
      text: getString('cf.featureFlags.percentageRollout'),
      permission: {
        resource: { resourceType: ResourceType.ENVIRONMENT, resourceIdentifier: activeEnvironment },
        permission: PermissionIdentifier.EDIT_FF_FEATUREFLAG
      },
      featuresProps: {
        featuresRequest: {
          featureNames: [FeatureIdentifier.MAUS]
        }
      }
    }
  ]

  return (
    <RbacOptionsMenuButton
      icon="plus"
      rightIcon="chevron-down"
      variation={ButtonVariation.SECONDARY}
      text={getString('cf.featureFlags.rules.addTargeting')}
      items={items}
      tooltipProps={{
        interactionKind: 'click',
        minimal: true,
        position: PopoverPosition.BOTTOM_LEFT
      }}
    />
  )
}

export default AddTargetingButton
