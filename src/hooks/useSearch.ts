import { useCallback } from 'react'
import fuzzy from 'fuzzy'
import { isValidPatp } from 'urbit-ob'
import { deSig } from '@urbit/api'
import useContactState from '../state/useContactState'
import usePongoStore from '../state/usePongoState'
import { SearchType } from '../types/Pongo'
import { preSig } from '../util/string'

interface UseSearchProps {
}

export default function useSearch() {
  const { set } = usePongoStore()
  const { contacts } = useContactState()

  const search = useCallback((searchType: SearchType, query: string) => {
    set({ searchTerm: query })

    if (searchType === 'ship') {
      const sigged = preSig(query)
      const valid = isValidPatp(sigged)

      const contactNames = Object.keys(contacts)

      // fuzzy search both nicknames and patps fuzzy#filter only supports
      // string comparision, so concat nickname + patp
      const searchSpace = Object.entries(contacts).map(
        ([patp, contact]) => `${contact.nickname}${patp}`
      )

      if (valid && !contactNames.includes(sigged)) {
        contactNames.push(sigged)
        searchSpace.push(sigged)
      }

      const fuzzyNames = fuzzy
        .filter(query, searchSpace)
        .sort((a, b) => {
          const filter = deSig(query) || ''
          const left = deSig(a.string)?.startsWith(filter)
            ? a.score + 1
            : a.score
          const right = deSig(b.string)?.startsWith(filter)
            ? b.score + 1
            : b.score

          return right - left
        })
        .map((result) => contactNames[result.index])

      const searchResults = fuzzyNames.slice(0, 20)

      set({ searchResults })
    }
  }, [contacts, set])

  return { search }
}
