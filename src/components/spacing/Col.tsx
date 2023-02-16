import { View as DefaultView } from 'react-native';
import { View } from '../Themed';

type ViewProps = DefaultView['props'];

export default function Col(props: ViewProps) {
  return <View {...props} style={[{ display: 'flex', flexDirection: 'column' }, props.style]}>
    {props.children}
  </View>
}
