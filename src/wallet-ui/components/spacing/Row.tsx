import { View as DefaultView } from 'react-native';
import { View } from '../../../components/Themed';

interface RowProps {
  between?: boolean
}

type ViewProps = RowProps & DefaultView['props'];

export default function Row({
  between,
  ...props
}: ViewProps) {
  const justifyContent = between ? 'space-between' : undefined

  return <View {...props} style={[{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent }, props.style]}>
    {props.children}
  </View>
}
