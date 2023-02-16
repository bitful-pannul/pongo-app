import { View as DefaultView } from 'react-native';
import { View } from '../../../components/Themed';

interface ColProps {
  center?: boolean;
}

type ViewProps = ColProps & DefaultView['props'];

export default function Col({
  center,
  ...props
}: ViewProps) {
  const centerStyle = center ? {justifyContent: 'center'} : undefined

  return <View {...props} style={[{ display: 'flex', flexDirection: 'column' }, centerStyle as any, props.style]}>
    {props.children}
  </View>
}
