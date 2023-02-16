import { View as DefaultView } from 'react-native';
import { View } from '../Themed';

type ViewProps = DefaultView['props'];

export default function Row(props: ViewProps) {
  return <View {...props} style={[{ display: 'flex', flexDirection: 'row', alignItems: 'center' }, props.style]}>
    {props.children}
  </View>
}
