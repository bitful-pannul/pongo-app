import { useMemo } from "react";
import { Text, View, Image, Pressable, Linking, StyleSheet } from "react-native";
import { window } from "../../../constants/Layout";
import useColors from "../../../hooks/useColors";
import { IMAGE_URL_REGEX, splitByImage, splitByUrl, SPLIT_BY_URL_REGEX } from "../../../util/string";
import ScaledImage from "./ScaledImage";

interface ContentProps {
  content: string;
  color: string;
  depth?: number;
}

export default function Content({ content, color, depth = 0 }: ContentProps) {
  const { width } = window
  const styles = useMemo(() => StyleSheet.create({
    textStyle: { color, fontSize: 16, flexShrink: 1 },
    linkStyle: { color, fontSize: 16, textDecorationLine: 'underline' }
  }), [color])

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
            <Content content={c} color={color} depth={depth + 1} key={`${i}-i-${depth}`} />
        ))}
      </View>
    )
  }

  return (
    <Text style={styles.textStyle}>
      {splitByUrl(content).map((c, i) => SPLIT_BY_URL_REGEX.test(c) ?
        <Text onPress={() => Linking.openURL(c)} key={`${i}-${depth}`} style={styles.linkStyle}>{c.toLowerCase()}</Text>:
        <Text style={styles.textStyle} key={`${i}-${depth}`}>{c}</Text>
      )}
    </Text>
  )  
}
