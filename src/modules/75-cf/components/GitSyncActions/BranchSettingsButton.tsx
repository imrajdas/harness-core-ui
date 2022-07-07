/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { ReactElement } from 'react'
import cx from 'classnames'

import { PopoverPosition } from '@blueprintjs/core'
import { Text, Container, Button, Icon } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useFFGitSyncContext } from '@cf/contexts/ff-git-sync-context/FFGitSyncContext'
import SettingsMenu from './SettingsMenu'
import BranchStatusIcon from './BranchStatusIcon'
import css from './GitSyncActions.module.scss'

interface BranchSettingsProps {
  isLoading?: boolean
  isSettingsOpen: boolean
  setIsSettingsOpen: (isOpen: boolean) => void
}

const BranchSettingsButton = ({ isSettingsOpen, setIsSettingsOpen, isLoading }: BranchSettingsProps): ReactElement => {
  const { gitRepoDetails } = useFFGitSyncContext()

  return (
    <Button
      noStyling
      className={cx(css.branchActionButton, isSettingsOpen && css.branchActionButtonActive)}
      tooltipProps={{
        fill: true,
        interactionKind: 'click',
        minimal: true,
        position: PopoverPosition.BOTTOM_LEFT,
        isOpen: isSettingsOpen,
        onInteraction: nextOpenState => setIsSettingsOpen(nextOpenState)
      }}
      tooltip={<SettingsMenu />}
      onClick={e => e.preventDefault()}
    >
      <Container className={css.branchActionButtonWrapper}>
        <Icon name="git-new-branch" size={15} />
        <Text color={Color.GREY_900}>{gitRepoDetails?.branch}</Text>
        <BranchStatusIcon isSettingsOpen={isSettingsOpen} isLoading={isLoading} />
      </Container>
    </Button>
  )
}

export default BranchSettingsButton
