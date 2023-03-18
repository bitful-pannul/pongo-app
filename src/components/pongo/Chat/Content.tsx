import { useMemo } from "react";
import { Text, View, Pressable, Linking, StyleSheet } from "react-native";
import { isWeb, window } from "../../../constants/Layout";
import { IMAGE_URL_REGEX, AUDIO_URL_REGEX, splitByImage, splitByUrl, SPLIT_BY_URL_REGEX } from "../../../util/string";
import AudioPlayer from "./AudioPlayer";
import ScaledImage from "./ScaledImage";

interface ContentProps {
  onLongPress?: () => void;
  content: string;
  color: string;
  depth?: number;
  delayLongPress?: number;
}

export default function Content({ onLongPress, content, color, depth = 0, delayLongPress = 200 }: ContentProps) {
  const { width } = window
  const styles = useMemo(() => StyleSheet.create({
    textStyle: { color, fontSize: 16, flexShrink: 1 },
    linkStyle: { color, fontSize: 16, textDecorationLine: 'underline' }
  }), [color])

  if (AUDIO_URL_REGEX.test(content)) {
    // For some reason this console statement is necessary
    // console.log(1, `"${content}"`, AUDIO_URL_REGEX.test(content))
    return <AudioPlayer color={color} uri={content} />
  }

  if (IMAGE_URL_REGEX.test(content)) {
    const contentWithImages = splitByImage(content)

    return (
      <View style={{ display: 'flex', flexDirection: 'column', width: '100%', flexGrow: 1 }}>
        {contentWithImages.map((c, i) => (
          IMAGE_URL_REGEX.test(c) ?
            <Pressable {...{ onLongPress, delayLongPress }} onPress={() => Linking.openURL(c)} key={`${i}-i-${depth}`}>
              <ScaledImage uri={c} width={Math.min(400, width * 0.84 * (isWeb ? 0.75 : 1) - 56)} height={400} />
            </Pressable> :
            <Content {...{ onLongPress, delayLongPress }} content={c} color={color} depth={depth + 1} key={`${i}-i-${depth}`} />
        ))}
      </View>
    )
  }
  
  return (
    <Text style={styles.textStyle}>
      {splitByUrl(content).map((c, i) => SPLIT_BY_URL_REGEX.test(c) ?
        <Text {...{ onLongPress, delayLongPress }} onPress={() => Linking.openURL(c)} key={`${i}-${depth}`} style={styles.linkStyle}>{c.toLowerCase()}</Text>:
        <Text style={styles.textStyle} key={`${i}-${depth}`}>{c}</Text>
      )}
    </Text>
  )  
}
