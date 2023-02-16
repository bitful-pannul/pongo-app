import { HeaderBackButton } from '@react-navigation/elements'
import { useNavigation } from '@react-navigation/native'
import usePongoStore from '../../state/usePongoState'
import { uq_purple } from '../../constants/Colors'

export default function NavBackButton() {
  const { set } = usePongoStore()
  const navigation = useNavigation()

  return (
    <HeaderBackButton
      labelVisible={false}
      tintColor={'white'}
      onPress={() => {
        set({ isSearching: false, searchResults: [], messages: [] })
        navigation.goBack()
      }}
    />
  )
}
