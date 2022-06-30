/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Button, Container, Layout, Text } from '@harness/uicore'
import { Switch } from '@blueprintjs/core'
import { Color, FontVariation } from '@harness/design-system'
import { useHistory, useParams } from 'react-router-dom'
import { isEqual } from 'lodash-es'

import { useStrings } from 'framework/strings'
import { CEView, useUpdatePerspective, ViewPreferences } from 'services/ce'
import routes from '@common/RouteDefinitions'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { USER_JOURNEY_EVENTS } from '@ce/TrackingEventsConstants'

import css from './PerspectivePreferences.module.scss'

interface PerspectivePreferencesProps {
  perspectiveData: CEView
  onPrevButtonClick: () => void
  updatePayload: CEView | null
}

const PerspectivePreferences: React.FC<PerspectivePreferencesProps> = ({
  perspectiveData,
  onPrevButtonClick,
  updatePayload
}) => {
  const { getString } = useStrings()
  const { trackEvent } = useTelemetry()
  const history = useHistory()
  const { perspectiveId, accountId } = useParams<{ perspectiveId: string; accountId: string }>()

  const [preferences, setPreferences] = useState<ViewPreferences | undefined>(perspectiveData.viewPreferences)

  const isClusterDatasource =
    perspectiveData.dataSources?.length === 1 && perspectiveData.dataSources.includes('CLUSTER')

  const { mutate: updatePerspective } = useUpdatePerspective({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const savePerspective = async (): Promise<void> => {
    if (!isEqual(preferences, perspectiveData.viewPreferences)) {
      await updatePerspective({
        ...updatePayload,
        viewPreferences: preferences
      })
    }

    trackEvent(USER_JOURNEY_EVENTS.SAVE_PERSPECTIVE, {
      include_others: preferences?.includeOthers,
      include_unallocated: preferences?.includeUnallocatedCost
    })

    history.push(
      routes.toPerspectiveDetails({
        accountId,
        perspectiveId,
        perspectiveName: perspectiveId
      })
    )
  }

  return (
    <Container className={css.container}>
      <Layout.Vertical
        spacing="medium"
        height="100%"
        padding={{ left: 'large', right: 'xxlarge', bottom: 'xxlarge', top: 'xxlarge' }}
      >
        <Text font={{ variation: FontVariation.H4 }}>{getString('preferences')}</Text>
        <Text
          font={{ variation: FontVariation.H6 }}
          padding={{ bottom: 'small' }}
          border={{ bottom: true, color: Color.GREY_200 }}
        >
          {getString('ce.perspectives.sideNavText')}
        </Text>
        <Container height={'100%'} width={500}>
          <Text color={Color.GREY_500} font={{ variation: FontVariation.SMALL }} margin={{ bottom: 'medium' }}>
            {getString('ce.perspectives.createPerspective.preferences.changeLater')}
          </Text>
          <Switch
            large
            checked={preferences?.includeOthers}
            labelElement={
              <Text className={css.prefLabel} tooltipProps={{ dataTooltipId: 'includeOthers' }}>
                {getString('ce.perspectives.createPerspective.preferences.includeOthers')}
              </Text>
            }
            className={css.labelContainer}
            onChange={() => setPreferences(prevPref => ({ ...prevPref, includeOthers: !prevPref?.includeOthers }))}
          />
          {isClusterDatasource ? (
            <>
              <Switch
                large
                checked={preferences?.includeUnallocatedCost}
                labelElement={
                  <Text className={css.prefLabel} tooltipProps={{ dataTooltipId: 'includeUnallocated' }}>
                    {getString('ce.perspectives.createPerspective.preferences.includeUnallocated')}
                  </Text>
                }
                className={css.labelContainer}
                onChange={() =>
                  setPreferences(prevPref => ({
                    ...prevPref,
                    includeUnallocatedCost: !prevPref?.includeUnallocatedCost
                  }))
                }
              />
            </>
          ) : null}
        </Container>
        <Layout.Horizontal padding={{ top: 'medium' }} spacing="large">
          <Button
            icon="chevron-left"
            text={getString('ce.perspectives.createPerspective.prevButton')}
            onClick={onPrevButtonClick}
          />
          <Button intent="primary" text={getString('ce.perspectives.save')} onClick={savePerspective} />
        </Layout.Horizontal>
      </Layout.Vertical>
    </Container>
  )
}

export default PerspectivePreferences
