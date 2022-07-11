/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Provider } from 'urql'
import { act, fireEvent, render } from '@testing-library/react'
import { fromValue } from 'wonka'
import { TestWrapper } from '@common/utils/testUtils'
import type { CEViewFolder } from 'services/ce'
import PerspectiveFoldersSideNav, { SideNavItem } from '../PerspectiveFoldersSideNav'
import FoldersList from './FoldersList.json'

const responseState = {
  executeQuery: () => {
    return fromValue({})
  }
}

const deleteFolder = jest.fn()
const updateFolder = jest.fn()
const setSelectedFolder = jest.fn()

describe('Test cases for perspective folder side nav', () => {
  test('Should render the folders list as side nav', async () => {
    const { container } = render(
      <TestWrapper>
        <Provider value={responseState as any}>
          <PerspectiveFoldersSideNav
            setSelectedFolder={setSelectedFolder}
            selectedFolderId={''}
            foldersList={FoldersList.data as unknown as CEViewFolder[]}
            setRefetchFolders={jest.fn()}
            foldersLoading={false}
            defaultFolderId={''}
            deleteFolder={jest.fn()}
            updateFolder={jest.fn()}
          />
        </Provider>
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test('Should show loader in case of loading state', async () => {
    const { container } = render(
      <TestWrapper>
        <Provider value={responseState as any}>
          <PerspectiveFoldersSideNav
            setSelectedFolder={setSelectedFolder}
            selectedFolderId={''}
            foldersList={[]}
            setRefetchFolders={jest.fn()}
            foldersLoading={true}
            defaultFolderId={''}
            deleteFolder={jest.fn()}
            updateFolder={jest.fn()}
          />
        </Provider>
      </TestWrapper>
    )

    const spinner = container.querySelector('[data-testid="loader"]')
    expect(spinner).toBeTruthy()
  })

  test('Should delete folder on click of delete icon', async () => {
    const { container, getByText } = render(
      <TestWrapper>
        <Provider value={responseState as any}>
          <PerspectiveFoldersSideNav
            setSelectedFolder={setSelectedFolder}
            selectedFolderId={'yVi1Q8cgQnaq-y1YqmELFQ'}
            foldersList={FoldersList.data as unknown as CEViewFolder[]}
            setRefetchFolders={jest.fn()}
            foldersLoading={false}
            defaultFolderId={''}
            deleteFolder={deleteFolder}
            updateFolder={updateFolder}
          />
        </Provider>
      </TestWrapper>
    )

    const deleteFolderIcon = container.querySelector('[data-testid="deleteFolder"]')
    expect(deleteFolderIcon).toBeDefined()
    act(() => {
      fireEvent.click(deleteFolderIcon!)
    })

    expect(getByText('ce.perspectives.folders.deletedConfirmationDesc')).toBeDefined()

    const deleteButton = getByText('delete')
    expect(deleteButton).toBeDefined()
    act(() => {
      fireEvent.click(deleteButton)
    })
    expect(deleteFolder).toBeCalledWith('yVi1Q8cgQnaq-y1YqmELFQ')
  })

  test('Should pin folder on click of pin icon', async () => {
    const { container } = render(
      <TestWrapper>
        <Provider value={responseState as any}>
          <PerspectiveFoldersSideNav
            setSelectedFolder={setSelectedFolder}
            selectedFolderId={'yVi1Q8cgQnaq-y1YqmELFQ'}
            foldersList={FoldersList.data as unknown as CEViewFolder[]}
            setRefetchFolders={jest.fn()}
            foldersLoading={false}
            defaultFolderId={''}
            deleteFolder={deleteFolder}
            updateFolder={updateFolder}
          />
        </Provider>
      </TestWrapper>
    )

    const pinFolderIcon = container.querySelector('[data-testid="pinFolder"]')
    expect(pinFolderIcon).toBeDefined()
    act(() => {
      fireEvent.click(pinFolderIcon!)
    })
    expect(updateFolder).toBeCalledWith('yVi1Q8cgQnaq-y1YqmELFQ', 'Abhijeet-Test', true)
  })

  test('Edit flow should work', async () => {
    const { container } = render(
      <TestWrapper>
        <Provider value={responseState as any}>
          <PerspectiveFoldersSideNav
            setSelectedFolder={setSelectedFolder}
            selectedFolderId={'yVi1Q8cgQnaq-y1YqmELFQ'}
            foldersList={FoldersList.data as unknown as CEViewFolder[]}
            setRefetchFolders={jest.fn()}
            foldersLoading={false}
            defaultFolderId={''}
            deleteFolder={deleteFolder}
            updateFolder={updateFolder}
          />
        </Provider>
      </TestWrapper>
    )

    const editFolderIcon = container.querySelector('[data-testid="editFolder"]')
    expect(editFolderIcon).toBeDefined()
    act(() => {
      fireEvent.click(editFolderIcon!)
    })
    const folderNameField = container.querySelector('[data-testid="folderNameField"]')
    expect(folderNameField).toBeDefined()

    act(() => {
      fireEvent.blur(folderNameField!)
    })
    expect(updateFolder).toBeCalledWith('yVi1Q8cgQnaq-y1YqmELFQ', 'Abhijeet-Test', true)
  })

  test('Should render side nav item', () => {
    const { container } = render(
      <TestWrapper>
        <SideNavItem
          folderData={{
            uuid: 'yVi1Q8cgQnaq-y1YqmELFQ',
            name: '',
            pinned: false
          }}
          icon={'main-folder'}
          className={'css.sidenav'}
          textClassName={'css.sidenavText'}
          showIcons={false}
          selectedFolderId={'yVi1Q8cgQnaq-y1YqmELFQ'}
          setSelectedFolder={setSelectedFolder}
          onDelete={deleteFolder}
          updateFolder={updateFolder}
        />
      </TestWrapper>
    )

    const liElm = container.querySelector('.link')
    expect(liElm).toBeDefined()
    act(() => {
      fireEvent.click(liElm!)
    })

    expect(setSelectedFolder).toBeCalledWith('yVi1Q8cgQnaq-y1YqmELFQ')

    expect(container).toMatchSnapshot()
  })
})
