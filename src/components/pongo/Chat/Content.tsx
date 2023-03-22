import { useMemo } from "react";
import { Text, View, Pressable, Linking, StyleSheet } from "react-native";
import { A } from '@expo/html-elements';

import { isWeb } from "../../../constants/Layout";
import { IMAGE_URL_REGEX, AUDIO_URL_REGEX, splitByImage, splitByUrl, SPLIT_BY_URL_REGEX } from "../../../util/string";
import AudioPlayer from "./AudioPlayer";
import ScaledImage from "./ScaledImage";
import useDimensions from "../../../hooks/useDimensions";

interface ContentProps {
  onLongPress?: () => void;
  content: string;
  color: string;
  depth?: number;
  delayLongPress?: number;
}

export default function Content({ onLongPress, content, color, depth = 0, delayLongPress = 200 }: ContentProps) {
  const { cWidth } = useDimensions()
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
            (isWeb ? (
              <A href={c} key={`${i}-i-${depth}`} target='_blank'>
                <ScaledImage uri={c} width={Math.min(400, cWidth * 0.84 - 56)} height={400} />
              </A>
            ) : (
              <Pressable {...{ onLongPress, delayLongPress }} onPress={() => Linking.openURL(c)} key={`${i}-i-${depth}`}>
                <ScaledImage uri={c} width={Math.min(400, cWidth * 0.84 - 56)} height={400} />
              </Pressable>
            ))
             :
            <Content {...{ onLongPress, delayLongPress }} content={c} color={color} depth={depth + 1} key={`${i}-i-${depth}`} />
        ))}
      </View>
    )
  }
  
  return (
    <Text style={styles.textStyle}>
      {splitByUrl(content).map((c, i) => SPLIT_BY_URL_REGEX.test(c) ?
        <A href={c} key={`${i}-${depth}`} style={styles.linkStyle} target='_blank'>{c}</A>:
        <Text {...{ onLongPress, delayLongPress }} style={styles.textStyle} key={`${i}-${depth}`}>{c}</Text>
      )}
    </Text>
  )  
}
