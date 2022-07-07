/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import cx from 'classnames'
import { defaultTo } from 'lodash-es'

import { Container, Dialog, Heading, Text, Views } from '@harness/uicore'
import { useModalHook } from '@harness/use-modal'
import { Color, FontVariation } from '@harness/design-system'

import { useGetEnvironmentListV2 } from 'services/cd-ng'
import { useStrings } from 'framework/strings'

import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'

import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import routes from '@common/RouteDefinitions'

import { NewEditEnvironmentModal } from '@cd/components/PipelineSteps/DeployEnvStep/DeployEnvStep'

import { PageStoreContext } from './PageTemplate/PageContext'
import PageTemplate from './PageTemplate/PageTemplate'
import { Sort, SortFields } from './PageTemplate/utils'
import EnvironmentTabs from './EnvironmentTabs'
import EnvironmentsList from './EnvironmentsList/EnvironmentsList'
import EnvironmentsGrid from './EnvironmentsGrid/EnvironmentsGrid'
import EnvironmentsFilters from './EnvironmentsFilters/EnvironmentsFilters'

import EmptyContentImg from './EmptyContent.svg'

import css from './Environments.module.scss'

export function Environments() {
  const [view, setView] = useState(Views.LIST)

  const { getString } = useStrings()
  const history = useHistory()
  const { accountId, orgIdentifier, projectIdentifier, module } = useParams<ProjectPathProps & ModulePathParams>()

  const [showCreateModal, hideCreateModal] = useModalHook(
    /* istanbul ignore next */ () => (
      <Dialog
        isOpen={true}
        enforceFocus={false}
        canEscapeKeyClose
        canOutsideClickClose
        onClose={hideCreateModal}
        title={
          <>
            <Text font={{ variation: FontVariation.H3 }} margin={{ bottom: 'small' }}>
              {getString('newEnvironment')}
            </Text>
            <Text font={{ variation: FontVariation.SMALL }} color={Color.GREY_500}>
              {getString('cd.environment.createSubTitle')}
            </Text>
          </>
        }
        isCloseButtonShown
        className={cx('padded-dialog', css.dialogStylesEnv)}
      >
        <Container>
          <NewEditEnvironmentModal
            data={{ name: '', identifier: '', accountId, orgIdentifier, projectIdentifier }}
            isEdit={false}
            isEnvironment
            onCreateOrUpdate={values => {
              hideCreateModal()
              history.push(
                routes.toEnvironmentDetails({
                  accountId,
                  orgIdentifier,
                  projectIdentifier,
                  module,
                  environmentIdentifier: defaultTo(values.identifier, ''),
                  sectionId: 'CONFIGURATION'
                })
              )
            }}
            closeModal={hideCreateModal}
          />
        </Container>
      </Dialog>
    ),
    [orgIdentifier, projectIdentifier]
  )

  const handleCustomSortChange = /* istanbul ignore next */ (value: string) => {
    return value === SortFields.AZ09
      ? [SortFields.Name, Sort.ASC]
      : value === SortFields.ZA90
      ? [SortFields.Name, Sort.DESC]
      : [SortFields.LastUpdatedAt, Sort.DESC]
  }

  return (
    <PageStoreContext.Provider
      value={{
        view,
        setView
      }}
    >
      <PageTemplate
        title={getString('environments')}
        titleTooltipId="ff_env_heading"
        headerToolbar={<EnvironmentTabs />}
        createButtonProps={{
          text: getString('newEnvironment'),
          dataTestid: 'add-environment',
          permission: {
            permission: PermissionIdentifier.EDIT_ENVIRONMENT,
            resource: {
              resourceType: ResourceType.ENVIRONMENT
            }
          },
          onClick: showCreateModal
        }}
        useGetListHook={useGetEnvironmentListV2}
        emptyContent={
          <>
            <img src={EmptyContentImg} width={220} height={220} />
            <Heading className={css.noEnvHeading} level={2}>
              {getString('cd.noEnvironment.title')}
            </Heading>
            <Text className={css.noEnvText}>{getString('cd.noEnvironment.message')}</Text>
          </>
        }
        ListComponent={EnvironmentsList}
        GridComponent={EnvironmentsGrid}
        sortOptions={[
          {
            label: getString('lastUpdatedSort'),
            value: SortFields.LastUpdatedAt
          },
          {
            label: getString('AZ09'),
            value: SortFields.AZ09
          },
          {
            label: getString('ZA90'),
            value: SortFields.ZA90
          }
        ]}
        defaultSortOption={[SortFields.LastUpdatedAt, Sort.DESC]}
        handleCustomSortChange={handleCustomSortChange}
        filterType={'Environment'}
        FilterComponent={EnvironmentsFilters}
      />
    </PageStoreContext.Provider>
  )
}
