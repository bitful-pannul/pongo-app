import { Text as DefaultText } from 'react-native';
import { Text, TextProps } from '../Themed';

interface H3Props {
  text: string
}

type Props = H3Props & TextProps;

export default function H3({ text, style, ...props }: Props) {
  return <Text {...props} style={[{
    fontSize: 20,
    fontWeight: '600',
  }, style]}>
    {text}
  </Text>
}
