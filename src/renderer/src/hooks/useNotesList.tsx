import { notesAtom, selectedNoteIndexAtom } from '@/store'
import { useAtomValue, useSetAtom } from 'jotai'

export const useNoteList = ({ onSelect }: { onSelect?: () => void }) => {
  const notes = useAtomValue(notesAtom)
  const selectedNoteIndex = useAtomValue(selectedNoteIndexAtom)
  const setSelectedNoteIndex = useSetAtom(selectedNoteIndexAtom)

  const handleNoteSelect = (index: number) => () => {
    setSelectedNoteIndex(index)

    if (onSelect) {
      onSelect()
    }
  }

  return { notes, selectedNoteIndex, handleNoteSelect }
}
