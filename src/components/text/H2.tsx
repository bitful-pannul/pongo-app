import { Text, TextProps } from '../Themed';

interface H2Props {
  text: string
}

type Props = H2Props & TextProps;

export default function H2({ text, style, ...props }: Props) {
  return <Text {...props} style={[{
    fontSize: 24,
    fontWeight: '600',
  }, style]}>
    {text}
  </Text>
}
