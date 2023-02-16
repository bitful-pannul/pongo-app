// https://www.npmjs.com/package/react-native-popup-menu
import { TouchableOpacity } from 'react-native';
import { uq_darkpink, uq_pink } from '../../constants/Colors';
import Row from '../spacing/Row';
import { Text, View } from '../Themed';

interface TagEntryProps {
  tag: string;
  style?: any;
  textStyle?: any;
  children?: any;
  onPress: () => void;
}

export default function TagEntry({ tag, style, textStyle, children = null, onPress }: TagEntryProps) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Row style={[{
        padding: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
        backgroundColor: uq_pink,
      }, style]}>
        {children}
        <Text style={[{
          fontSize: 18,
          color: 'white',
          fontWeight: '600',
        }, textStyle]}>{tag}</Text>
      </Row>
    </TouchableOpacity>
  )
}
