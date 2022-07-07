/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Button, ButtonVariation, Container, Layout, FormInput, Formik, Collapse, IconName } from '@harness/uicore'
import { useModalHook } from '@harness/use-modal'
import * as yup from 'yup'
import { Dialog } from '@blueprintjs/core'
import { useStrings } from 'framework/strings'
import RbacButton from '@rbac/components/Button/Button'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { useCreateSegment, Tag, CreateSegmentQueryParams } from 'services/cf'
import { useToaster } from '@common/exports'
import { getErrorMessage } from '@cf/utils/CFUtils'
import useActiveEnvironment from '@cf/hooks/useActiveEnvironment'
import css from './NewSegmentButton.module.scss'

const collapseProps = {
  collapsedIcon: 'plus' as IconName,
  expandedIcon: 'minus' as IconName,
  isOpen: false,
  isRemovable: false
}

interface SegmentFormData {
  identifier: string
  name: string
  description: string
  tags: Tag[]
}

export interface NewSegmentButtonProps {
  accountIdentifier: string
  orgIdentifier: string
  projectIdentifier: string
  onCreated: (segmentIdentifier: string) => void
}

export const NewSegmentButton: React.FC<NewSegmentButtonProps> = ({
  accountIdentifier,
  orgIdentifier,
  projectIdentifier,
  onCreated
}) => {
  const { getString } = useStrings()
  const { showError } = useToaster()

  const { mutate: createSegment } = useCreateSegment({
    queryParams: { accountIdentifier, orgIdentifier } as CreateSegmentQueryParams
  })
  const { activeEnvironment } = useActiveEnvironment()

  const handleCreateSegment = (values: SegmentFormData): void => {
    createSegment({
      ...values,
      environment: activeEnvironment,
      project: projectIdentifier
    })
      .then(() => {
        hideModal()
        onCreated(values.identifier)
      })
      .catch(e => {
        showError(getErrorMessage(e), 0, 'cf.create.segment.error')
      })
  }

  const [openModal, hideModal] = useModalHook(() => {
    return (
      <Dialog
        isOpen
        enforceFocus={false}
        onClose={hideModal}
        title={getString('cf.segments.modalTitle')}
        style={{ padding: 'none' }}
        className={css.modal}
      >
        <Formik
          initialValues={{ identifier: '', name: '', description: '', tags: [] }}
          onSubmit={handleCreateSegment}
          formName="newSegmentButton"
          onReset={hideModal}
          validationSchema={yup.object().shape({
            name: yup.string().trim().required(getString('cf.segments.nameRequired')),
            identifier: yup.string().trim().required(getString('cf.segments.idRequired'))
          })}
          validateOnChange
          validateOnBlur
        >
          {formikProps => {
            const handleSubmit = (): void => formikProps.handleSubmit()
            return (
              <Container padding="large">
                <Layout.Vertical spacing="small">
                  <FormInput.InputWithIdentifier
                    inputName="name"
                    inputGroupProps={{ inputGroup: { autoFocus: true } }}
                    idName="identifier"
                    isIdentifierEditable
                    inputLabel={getString('name')}
                  />
                  <div className={css.collapse}>
                    <Collapse {...collapseProps} heading={getString('description')}>
                      <FormInput.TextArea name="description" />
                    </Collapse>
                  </div>
                  {/* <div className={css.collapse}>
                    <Collapse {...collapseProps} heading={getString('tagsLabel')}>
                      <FormInput.TagInput
                        name="tags"
                        label=""
                        items={[]}
                        labelFor={item => item as string}
                        itemFromNewTag={item => item}
                        tagInputProps={{
                          showClearAllButton: true,
                          allowNewTag: true,
                          placeholder: getString('tagsLabel')
                        }}
                      />
                    </Collapse>
                  </div> */}
                  <div style={{ paddingTop: 'var(--spacing-xxxlarge)' }}>
                    <Layout.Horizontal spacing="small" style={{ justifyContent: 'flex-start', alignItems: 'center' }}>
                      <Button
                        variation={ButtonVariation.PRIMARY}
                        text={getString('create')}
                        onClick={handleSubmit}
                        intent="primary"
                      />
                      <Button
                        variation={ButtonVariation.TERTIARY}
                        text={getString('cancel')}
                        onClick={formikProps.handleReset}
                        minimal
                      />
                    </Layout.Horizontal>
                  </div>
                </Layout.Vertical>
              </Container>
            )
          }}
        </Formik>
      </Dialog>
    )
  }, [activeEnvironment])

  return (
    <RbacButton
      icon="plus"
      intent="primary"
      variation={ButtonVariation.PRIMARY}
      text={getString('cf.segments.create')}
      onClick={openModal}
      permission={{
        resource: { resourceType: ResourceType.ENVIRONMENT, resourceIdentifier: activeEnvironment },
        permission: PermissionIdentifier.EDIT_FF_TARGETGROUP
      }}
    />
  )
}
