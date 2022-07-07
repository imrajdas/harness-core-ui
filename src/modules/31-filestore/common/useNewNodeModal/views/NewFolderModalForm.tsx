/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect } from 'react'
import {
  Container,
  Formik,
  FormikForm as Form,
  ModalErrorHandler,
  ModalErrorHandlerBinding,
  Layout
} from '@harness/uicore'
import * as Yup from 'yup'

import { NameId } from '@common/components/NameIdDescriptionTags/NameIdDescriptionTags'

import { useToaster } from '@common/components'

import { useStrings } from 'framework/strings'
import { NameSchema, IdentifierSchema } from '@common/utils/Validation'
import { FooterRenderer } from '@filestore/common/ModalComponents/ModalComponents'
import { useCreate, useUpdate } from 'services/cd-ng'
import { FileStoreNodeTypes, NewFolderDTO } from '@filestore/interfaces/FileStore'
import { SEARCH_FILES, FILE_STORE_ROOT } from '@filestore/utils/constants'
import type { FileStoreContextState, FileStoreNodeDTO } from '@filestore/components/FileStoreContext/FileStoreContext'

interface NewFolderModalData {
  data?: NewFolderDTO
  editMode: boolean
  onSubmit?: (resourceGroup: NewFolderDTO) => void
  close: () => void
  parentIdentifier: string
  fileStoreContext: FileStoreContextState
  currentNode: FileStoreNodeDTO
  notCurrentNode?: boolean
}

const NewFolderForm: React.FC<NewFolderModalData> = props => {
  const { close, fileStoreContext, editMode, currentNode, notCurrentNode, parentIdentifier } = props
  const { getNode, queryParams, updateCurrentNode } = fileStoreContext
  const [initialValues, setInitialValues] = useState<NewFolderDTO>({
    name: '',
    identifier: '',
    type: FileStoreNodeTypes.FOLDER
  })

  useEffect(() => {
    if (editMode) {
      if (currentNode && !notCurrentNode) {
        setInitialValues({
          name: fileStoreContext.currentNode.name,
          identifier: fileStoreContext.currentNode.identifier,
          type: FileStoreNodeTypes.FOLDER
        })
      } else {
        setInitialValues({
          name: currentNode.name,
          identifier: currentNode.identifier,
          type: FileStoreNodeTypes.FOLDER
        })
      }
    }
  }, [fileStoreContext.currentNode, editMode, notCurrentNode])

  const { mutate: createFolder, loading: createLoading } = useCreate({
    queryParams
  })

  const { mutate: updateFolder, loading: updateLoading } = useUpdate({
    identifier: currentNode.identifier,
    queryParams
  })

  useEffect(() => {
    return () => close()
  }, [])

  const { getString } = useStrings()
  const { showSuccess } = useToaster()
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding>()

  const handleSubmit = async (values: NewFolderDTO): Promise<void> => {
    const { identifier, name, type } = values
    const getConfig: FileStoreNodeDTO = {
      identifier: currentNode?.identifier !== SEARCH_FILES ? currentNode.identifier : FILE_STORE_ROOT,
      name: currentNode.name === SEARCH_FILES ? FILE_STORE_ROOT : editMode ? name : currentNode.name,
      type: FileStoreNodeTypes.FOLDER
    }
    try {
      const data = new FormData()
      data.append('identifier', identifier)
      data.append('name', name)
      data.append('type', type)
      if (currentNode?.type === FileStoreNodeTypes.FOLDER) {
        if (editMode && !notCurrentNode) {
          data.append('parentIdentifier', fileStoreContext?.currentNode?.parentIdentifier as string)
        } else {
          if (fileStoreContext.currentNode.identifier === SEARCH_FILES) {
            data.append('parentIdentifier', parentIdentifier)
          } else {
            data.append('parentIdentifier', fileStoreContext.currentNode.identifier)
          }
        }
      } else {
        data.append('parentIdentifier', fileStoreContext?.currentNode?.parentIdentifier || '')
      }

      if (editMode) {
        const updateResponse = await updateFolder(data as any)
        if (updateResponse.status === 'SUCCESS') {
          updateCurrentNode({
            ...fileStoreContext.currentNode,
            name: notCurrentNode ? fileStoreContext.currentNode.name : name,
            parentName: notCurrentNode ? fileStoreContext.currentNode.name : fileStoreContext.currentNode.parentName,
            children: fileStoreContext.currentNode?.children?.map(node => ({
              ...node,
              parentName: notCurrentNode ? fileStoreContext.currentNode.name : name
            }))
          })

          getNode(getConfig)
          showSuccess(getString('filestore.folderSuccessSaved', { name: values.name }))
        }
      } else {
        const createResponse = await createFolder(data as any)

        if (createResponse.status === 'SUCCESS') {
          showSuccess(getString('filestore.folderSuccessCreated', { name: values.name }))
          if (currentNode.type === FileStoreNodeTypes.FOLDER) {
            getNode(getConfig, {
              setNewCurrentNode: true,
              newNode: { ...createResponse.data, parentName: fileStoreContext.currentNode.name } as FileStoreNodeDTO,
              type: FileStoreNodeTypes.FOLDER
            })
          } else {
            getNode(
              {
                identifier: currentNode.parentIdentifier || '',
                name: currentNode.parentName || '',
                type: FileStoreNodeTypes.FOLDER
              },
              {
                setNewCurrentNode: true,
                newNode: {
                  ...createResponse.data,
                  parentName: fileStoreContext.currentNode.parentName
                } as FileStoreNodeDTO,
                type: FileStoreNodeTypes.FOLDER
              }
            )
          }
        }
      }
      close()
    } catch (e) {
      modalErrorHandler?.showDanger(e.data.message)
    }
  }
  return (
    <Formik<NewFolderDTO>
      initialValues={initialValues}
      enableReinitialize
      formName="newFolder"
      validationSchema={Yup.object().shape({
        name: NameSchema(),
        identifier: IdentifierSchema()
      })}
      onSubmit={values => {
        modalErrorHandler?.hide()
        handleSubmit(values)
      }}
    >
      {() => {
        return (
          <Form style={{ height: '100%' }}>
            <Layout.Vertical style={{ justifyContent: 'space-between' }} height="100%">
              <Container>
                <ModalErrorHandler bind={setModalErrorHandler} />
                <NameId identifierProps={{ isIdentifierEditable: !editMode }} />
              </Container>
              <FooterRenderer
                type="submit"
                onCancel={close}
                confirmText={editMode ? getString('save') : getString('create')}
                cancelText={getString('cancel')}
                loading={editMode ? updateLoading : createLoading}
              />
            </Layout.Vertical>
          </Form>
        )
      }}
    </Formik>
  )
}

export default NewFolderForm
