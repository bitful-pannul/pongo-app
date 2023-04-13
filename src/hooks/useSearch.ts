import { useCallback } from 'react'
import fuzzy from 'fuzzy'
import { isValidPatp } from 'urbit-ob'
import { deSig } from '@urbit/api'
import _ from 'lodash'

import useContactState from '../state/useContactState'
import usePongoStore from '../state/usePongoState'
import { SearchType } from '../types/Pongo'
import { preSig } from '../util/string'
import { ONE_SECOND } from '../util/time'
import { ALL_MESSAGES_UID } from '../constants/Pongo'
import { genRanHex } from '../util/pokur/number'
import { addHexDots } from '../wallet-ui/utils/format'

interface UseSearchProps {
}

export default function useSearch() {
  const { api, set, searchMessages } = usePongoStore()
  const { contacts } = useContactState()

  const search = useCallback((searchType: SearchType, query: string, chatId?: string) => {
    set({ searchTerm: query })

    if (query) {
      if (searchType === 'ship') {
        const sigged = preSig(query)
        const valid = isValidPatp(sigged)
  
        const contactNames = Object.keys(contacts)
  
        // fuzzy search both nicknames and patps fuzzy#filter only supports
        // string comparision, so concat nickname + patp
        const searchSpace = Object.entries(contacts).map(
          ([patp, contact]: any) => `${contact.nickname}${patp}`
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
      } else if (searchType === 'message') {
        console.log(1, !!api)
        if (api) {
          console.log(2, query, chatId)
          const uid = addHexDots(genRanHex(16).replace(/^0*/, ''))
          searchMessages({ uid, phrase: query, onlyIn: chatId?.replace(/\./g, '').replace('0x', '') })
          // _.debounce(() => {
          //   console.log(3)
          
          // }, ONE_SECOND)
        }
      }
    }

  }, [contacts, set])

  return { search }
}
