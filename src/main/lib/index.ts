import { appDirectoryName, fileEncoding, fileExtension } from '@shared/constants'
import { ensureDir, stat, readdir, readFile, writeFile, remove } from 'fs-extra'
import { homedir } from 'os'
import { NoteInfo } from '@shared/models'
import { CreateNote, GetNotes, ReadNotes } from '@shared/types'
import { dialog } from 'electron'
import { isEmpty } from 'lodash'
import path from 'path'
import welcomeNoteFile from '../../../resources/welcomeNote.md?asset'

export const getRootDir = () => {
  return `${homedir()}/${appDirectoryName}`
}

export const getNotes: GetNotes = async () => {
  const rootDir = getRootDir()
  await ensureDir(rootDir)

  const noteFileNames = await readdir(rootDir, { encoding: fileEncoding, withFileTypes: false })

  const notes = noteFileNames.filter((fileName) => fileName.endsWith(fileExtension))

  if (isEmpty(notes)) {
    console.info('No notes found')
    const content = await readFile(welcomeNoteFile, { encoding: fileEncoding })
    await writeFile(`${rootDir}/Welcome${fileExtension}`, content, { encoding: fileEncoding })
    notes.push('Welcome.md')
  }

  return Promise.all(notes.map(getNoteInfoFromFileName))
}

export const getNoteInfoFromFileName = async (fileName: string): Promise<NoteInfo> => {
  const fileStats = await stat(`${getRootDir()}/${fileName}`)
  return {
    title: fileName.replace(/\.md$/, ''),
    lastEditTime: fileStats.mtimeMs
  }
}

export const readNote: ReadNotes = async (fileName) => {
  const rootDir = getRootDir()
  return await readFile(`${rootDir}/${fileName}${fileExtension}`, { encoding: fileEncoding })
}

export const writeNote = async (filename, content) => {
  const rootDir = getRootDir()
  console.info(`Writing to note ${filename}`)
  return writeFile(`${rootDir}/${filename}${fileExtension}`, content, { encoding: fileEncoding })
}

export const createNote: CreateNote = async () => {
  const rootDir = getRootDir()

  await ensureDir(rootDir)

  const { filePath, canceled } = await dialog.showSaveDialog({
    title: 'Create Note',
    defaultPath: `${rootDir}/Untitled${fileExtension}`,
    buttonLabel: 'Create',
    properties: ['showOverwriteConfirmation'],
    showsTagField: false,
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  })

  if (canceled || !filePath) {
    console.info('Note creation canceled')
    return false
  }

  const { name: filename, dir: parentDir } = path.parse(filePath)

  if (parentDir !== rootDir) {
    console.info('Note creation canceled')
    await dialog.showMessageBox({
      type: 'error',
      title: 'Creation Failed',
      message: `All notes must be saved under ${rootDir}. Please choose a different location.`
    })

    return false
  }
  console.info(`Creating note ${filePath}`)
  await writeFile(filePath, '', { encoding: fileEncoding })

  return filename
}

export const deleteNote = async (filename: string): Promise<boolean> => {
  const rootDir = getRootDir()
  const { response } = await dialog.showMessageBox({
    type: 'warning',
    title: 'Delete Note',
    message: `Are you sure you want to delete ${filename}?`,
    buttons: ['Delete', 'Cancel'],
    defaultId: 1,
    cancelId: 1
  })

  if (response === 1) {
    console.info('Note deletion canceled')
    return false
  }

  console.info(`Deleting note ${filename}`)
  await remove(`${rootDir}/${filename}${fileExtension}`)
  return true
}
