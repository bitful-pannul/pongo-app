import { Text, View, Image, Pressable, Linking } from "react-native";
import { window } from "../../../constants/Layout";
import useColors from "../../../hooks/useColors";
import { IMAGE_URL_REGEX, splitByImage, splitByUrl, SPLIT_BY_URL_REGEX } from "../../../util/string";
import ScaledImage from "./ScaledImage";

interface ContentProps {
  content: string;
  color: string;
  isOwn: boolean;
  depth?: number;
}

export default function Content({ content, color, isOwn, depth = 0 }: ContentProps) {
  const { link } = useColors()
  const { width } = window
  const textStyle = { color, fontSize: 16, flexShrink: 1 }
  const linkStyle = { color: isOwn ? 'rgb(220,220,255)' : link, fontSize: 16, flexShrink: 1 }

  const hasImage = IMAGE_URL_REGEX.test(content)

  if (hasImage) {
    const contentWithImages = splitByImage(content)

    return (
      <View style={{ display: 'flex', flexDirection: 'column', width: '100%', flexGrow: 1 }}>
        {contentWithImages.map((c, i) => (
          IMAGE_URL_REGEX.test(c) ?
            <Pressable onPress={() => Linking.openURL(c)} key={`${i}-i-${depth}`}>
              <ScaledImage uri={c} width={width * 0.84 - 56} height={400} />
            </Pressable> :
            <Content isOwn={isOwn} content={c} color={color} depth={depth + 1} key={`${i}-i-${depth}`} />
        ))}
      </View>
    )
  }

  return (
    <Text style={textStyle}>
      {splitByUrl(content).map((c, i) => SPLIT_BY_URL_REGEX.test(c) ?
        <Pressable onPress={() => Linking.openURL(c)} key={`${i}-${depth}`}>
          <Text style={linkStyle}>{c.toLowerCase()}</Text>
        </Pressable> :
        <Text style={textStyle} key={`${i}-${depth}`}>{c}</Text>
      )}
    </Text>
  )  
}
