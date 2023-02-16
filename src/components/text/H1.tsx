import { Text as DefaultText } from 'react-native';
import { Text, TextProps } from '../Themed';

interface H1Props {
  text: string
}

type Props = H1Props & TextProps;

export default function H1({ text, style, ...props }: Props) {
  return <Text {...props} style={[{
    fontSize: 32,
    fontWeight: '600',
  }, style]}>
    {text}
  </Text>
}
