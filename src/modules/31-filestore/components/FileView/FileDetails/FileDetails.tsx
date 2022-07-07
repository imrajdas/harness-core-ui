/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */
import React, { useContext, useEffect, useState } from 'react'
import { Button, Container, Formik, FormikForm, Layout, Text, Icon, ButtonVariation, useToaster } from '@harness/uicore'
import { Spinner } from '@blueprintjs/core'
import { Color } from '@harness/design-system'

import { get } from 'lodash-es'
import type { StringsMap } from 'stringTypes'

import { useStrings } from 'framework/strings'
import { useDownloadFile, useCreate, useUpdate } from 'services/cd-ng'
import { FileStoreContext } from '@filestore/components/FileStoreContext/FileStoreContext'
import { FileStoreNodeTypes } from '@filestore/interfaces/FileStore'
import useUploadFile, { UPLOAD_EVENTS } from '@filestore/common/useUpload/useUpload'
import {
  getFileUsageNameByType,
  getLanguageType,
  getFSErrorByType,
  checkSupportedMime
} from '@filestore/utils/FileStoreUtils'
import MonacoEditor from '@common/components/MonacoEditor/MonacoEditor'
import useNewNodeModal from '@filestore/common/useNewNodeModal/useNewNodeModal'
import { ExtensionType, FSErrosType, LanguageType, FILE_STORE_ROOT } from '@filestore/utils/constants'

import RbacButton from '@rbac/components/Button/Button'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { usePermission } from '@rbac/hooks/usePermission'

import WrongFormatView from './WrongFormatView'
import css from '../FileView.module.scss'

interface FileDetailsProps {
  handleError: (error: string) => void
}

function FileDetails({ handleError }: FileDetailsProps): React.ReactElement {
  const fileStoreContext = useContext(FileStoreContext)
  const {
    currentNode,
    updateCurrentNode,
    isCachedNode,
    queryParams,
    isModalView,
    setTempNodes,
    setUnsavedNodes,
    unsavedNodes
  } = fileStoreContext

  const [errorMessage, setErrorMessage] = useState('')
  const [value, setValue] = useState('')
  const [language, setLanguage] = useState<string>(LanguageType.TEXT)
  const [isUnsupported, setIsUnsupported] = useState<boolean>(false)
  const { getString } = useStrings()
  const { showSuccess, showError } = useToaster()
  const [initialContent, setInitialContent] = useState(currentNode.content)

  const nodeFormModal = useNewNodeModal({
    type: FileStoreNodeTypes.FILE,
    parentIdentifier: currentNode?.parentIdentifier ? currentNode.parentIdentifier : FILE_STORE_ROOT,
    tempNode: isCachedNode(currentNode.identifier),
    editMode: true,
    currentNode,
    fileStoreContext
  })

  const uploadNewFile = useUploadFile({
    isBtn: true,
    eventMethod: UPLOAD_EVENTS.REPLACE
  })

  useEffect(() => {
    if (isCachedNode(currentNode.identifier) && errorMessage === FSErrosType.UNSUPPORTED_FORMAT) {
      setIsUnsupported(true)
    } else {
      setIsUnsupported(false)
    }
  }, [errorMessage, isCachedNode, setIsUnsupported, currentNode])

  useEffect(() => {
    setErrorMessage('')
    if (currentNode?.content && isCachedNode(currentNode.identifier)) {
      setValue(currentNode.content)
    }
    if (!currentNode.content) {
      setValue('')
    }
    if (currentNode?.mimeType) {
      if (!checkSupportedMime(currentNode.mimeType as ExtensionType) && !!isCachedNode(currentNode.identifier)) {
        setErrorMessage(FSErrosType.UNSUPPORTED_FORMAT)
        return
      } else {
        setErrorMessage('')
      }
      setLanguage(getLanguageType(currentNode.mimeType))
    }
  }, [currentNode, setErrorMessage, isCachedNode])

  const { mutate: createNode } = useCreate({
    queryParams
  })

  const {
    data,
    loading: downloadLoading,
    error
  } = useDownloadFile({
    identifier: currentNode.identifier,
    queryParams
  })

  React.useEffect(() => {
    if (currentNode?.initialContent) {
      setInitialContent(currentNode.initialContent)
    }
  }, [currentNode.initialContent])

  React.useEffect(() => {
    if (error?.status && !isCachedNode(currentNode.identifier)) {
      handleError(FSErrosType.DELETED_NODE)
    } else {
      handleError('')
    }
  }, [error])

  const { mutate: updateNode, loading: saveLoading } = useUpdate({
    identifier: currentNode.identifier,
    queryParams
  })

  const [canEdit] = usePermission(
    {
      resource: {
        resourceType: ResourceType.FILE,
        resourceIdentifier: currentNode.identifier
      },
      permissions: [PermissionIdentifier.EDIT_FILE]
    },
    [errorMessage, isCachedNode, setIsUnsupported, currentNode]
  )

  const handleSubmit = async (values: any): Promise<void> => {
    if (!currentNode.fileUsage) {
      setErrorMessage(FSErrosType.FILE_USAGE)
      return
    }
    const formData = new FormData()

    const defaultMimeType = currentNode?.mimeType ? currentNode.mimeType : ExtensionType.TEXT

    formData.append('type', FileStoreNodeTypes.FILE)
    formData.append('content', values.fileEditor)
    formData.append('mimeType', defaultMimeType)
    formData.append('name', currentNode.name)
    formData.append('identifier', currentNode.identifier)
    formData.append('fileUsage', currentNode.fileUsage as string)
    formData.append('parentIdentifier', currentNode.parentIdentifier as string)
    if (currentNode?.tags) {
      formData.append('tags', JSON.stringify(currentNode.tags))
    }
    if (currentNode?.description) {
      formData.append('description', currentNode.description)
    }
    try {
      if (!isCachedNode(currentNode?.identifier)) {
        const responseUpdate = await updateNode(formData as any)
        if (responseUpdate.status === 'SUCCESS') {
          showSuccess(getString('filestore.fileSuccessSaved', { name: currentNode.name }))
          setUnsavedNodes([])
        }
      } else {
        const response = await createNode(formData as any)

        if (response.status === 'SUCCESS') {
          setTempNodes([])
          setUnsavedNodes([])
          showSuccess(getString('filestore.fileSuccessCreated', { name: currentNode.name }))
        }
      }
      setInitialContent(values.fileEditor)
    } catch (e) {
      showError(e.data.message)
    }
  }

  useEffect(() => {
    if (data && !isCachedNode(currentNode?.identifier)) {
      ;(data as unknown as Response)
        .clone()
        .text()
        .then((content: string) => {
          setValue(content)
          setInitialContent(content)
          updateCurrentNode({
            ...currentNode,
            content
          })
        })
    }
  }, [data, isCachedNode, currentNode.identifier])

  return (
    <Container style={{ width: '100%', height: '100%' }} className={css.fileDetails}>
      {downloadLoading && !isCachedNode(currentNode.identifier) ? (
        <Container flex={{ justifyContent: 'center', alignItems: 'center' }} style={{ width: '100%', height: '100%' }}>
          <Spinner />
        </Container>
      ) : (
        <Formik
          enableReinitialize
          initialValues={{
            fileEditor: value
          }}
          formName="editor-file-store"
          onSubmit={values => {
            handleSubmit(values)
          }}
        >
          {formikProps => {
            return (
              <FormikForm>
                <Layout.Horizontal
                  className={css.fileEditPanel}
                  padding="medium"
                  flex={{ justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Container
                    padding="small"
                    className={css.fileInfoContainer}
                    flex={{ justifyContent: 'space-between' }}
                  >
                    <Container
                      className={css.fileName}
                      flex={{ justifyContent: 'space-between', alignItems: 'center' }}
                      padding={{ right: 'small' }}
                    >
                      <Text
                        font={{ size: 'normal', weight: 'bold' }}
                        margin={{ right: 'small' }}
                        color={Color.GREY_1000}
                        tooltip={currentNode.name}
                        style={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {currentNode.name}
                      </Text>
                      <Icon name="file" />
                    </Container>
                    <Container padding={{ left: 'small' }} flex={{ justifyContent: 'space-between' }}>
                      <Container flex>
                        <Text>{getString('filestore.view.fileUsage')}:</Text>
                        <Text margin={{ left: 'small' }} color={Color.GREY_700}>
                          {currentNode?.fileUsage ? getFileUsageNameByType(currentNode.fileUsage) : 'Undefined'}
                        </Text>
                      </Container>
                      {!isUnsupported && canEdit && (
                        <Icon
                          style={{ cursor: 'pointer' }}
                          name="Edit"
                          margin={{ left: 'medium' }}
                          onClick={() => {
                            updateCurrentNode({ ...currentNode, content: get(formikProps.values, 'fileEditor') })
                            nodeFormModal.onClick()
                          }}
                        />
                      )}
                    </Container>
                  </Container>
                  <Container flex>
                    {errorMessage && (
                      <Text margin={{ right: 'large' }} font={{ size: 'small' }} color={Color.ORANGE_900}>
                        {errorMessage && getString(getFSErrorByType(errorMessage as FSErrosType) as keyof StringsMap)}
                      </Text>
                    )}
                    {!isUnsupported && (
                      <>
                        <RbacButton
                          type="submit"
                          variation={ButtonVariation.PRIMARY}
                          text={getString('save')}
                          permission={{
                            permission: PermissionIdentifier.EDIT_FILE,
                            resource: {
                              resourceType: ResourceType.FILE
                            }
                          }}
                          disabled={!get(formikProps.values, 'fileEditor') || saveLoading}
                          loading={saveLoading}
                        />
                        <RbacButton
                          margin={{ left: 'small', right: 'small' }}
                          variation={ButtonVariation.TERTIARY}
                          text={getString('cancel')}
                          permission={{
                            permission: PermissionIdentifier.EDIT_FILE,
                            resource: {
                              resourceType: ResourceType.FILE
                            }
                          }}
                          onClick={() => {
                            formikProps.setFieldValue('fileEditor', initialContent)
                            setUnsavedNodes([])
                          }}
                          disabled={saveLoading}
                        />
                      </>
                    )}
                    {isCachedNode(currentNode.identifier) && (
                      <Button
                        variation={ButtonVariation.SECONDARY}
                        icon="syncing"
                        onClick={uploadNewFile.onClick}
                        title={uploadNewFile.label}
                        text={uploadNewFile.label}
                        margin={{ left: 'small' }}
                      />
                    )}
                  </Container>
                </Layout.Horizontal>
                {!isUnsupported && (
                  <MonacoEditor
                    height={!isModalView ? window.innerHeight - 218 : 400}
                    value={get(formikProps.values, 'fileEditor')}
                    language={language}
                    options={{
                      fontFamily: "'Roboto Mono', monospace",
                      fontSize: 14,
                      minimap: {
                        enabled: false
                      },
                      readOnly: false,
                      scrollBeyondLastLine: false,
                      lineNumbers: 'on',
                      glyphMargin: false,
                      folding: false,
                      lineDecorationsWidth: 60,
                      wordWrap: 'on',
                      scrollbar: {
                        verticalScrollbarSize: 0
                      },
                      renderLineHighlight: 'none',
                      wordWrapBreakBeforeCharacters: '',
                      lineNumbersMinChars: 0
                    }}
                    onChange={txt => {
                      if (!unsavedNodes[0] && initialContent !== txt && !isCachedNode(currentNode.identifier)) {
                        setUnsavedNodes([currentNode])
                      }
                      if (initialContent === txt) {
                        setUnsavedNodes([])
                      }
                      formikProps.setFieldValue('fileEditor', txt)
                    }}
                    {...({ name: 'testeditor' } as any)} // this is required for test cases
                  />
                )}
              </FormikForm>
            )
          }}
        </Formik>
      )}
      {isUnsupported && <WrongFormatView />}
    </Container>
  )
}

export default FileDetails
