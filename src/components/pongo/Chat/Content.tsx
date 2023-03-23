import { useMemo } from "react";
import { Text, View, Pressable, Linking, StyleSheet } from "react-native";
import { A } from '@expo/html-elements';
import * as Clipboard from 'expo-clipboard'

import { isIos, isWeb } from "../../../constants/Layout";
import {
  IMAGE_URL_REGEX,
  AUDIO_URL_REGEX,
  SPLIT_BY_URL_REGEX,
  CODE_REGEX,
  BOLD_REGEX,
  ITALIC_REGEX,
  splitByRegex,
  REPLACE_ITALIC_REGEX,
  REPLACE_BOLD_REGEX,
  REPLACE_CODE_REGEX
} from "../../../util/string";
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
    linkStyle: { color, fontSize: 16, flexShrink: 1, textDecorationLine: 'underline' },
    code: { fontFamily: isIos ? 'Courier New' : 'monospace', backgroundColor: 'rgba(127, 127, 127, 0.5)' },
    italic: { fontStyle: 'italic' },
    bold: { fontWeight: 'bold' },
  }), [color])

  if (AUDIO_URL_REGEX.test(content)) {
    // For some reason this console statement is necessary
    console.log(1, `"${content}"`, AUDIO_URL_REGEX.test(content))
    return <AudioPlayer color={color} uri={content} />
  }

  if (IMAGE_URL_REGEX.test(content)) {
    const contentWithImages = splitByRegex(content, IMAGE_URL_REGEX)

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

  if (CODE_REGEX.test(content)) {
    return (
      <>
        {splitByRegex(content, CODE_REGEX).map((c, i) => CODE_REGEX.test(c) ?
          <Text {...{ onLongPress }} onPress={() => Clipboard.setStringAsync(c.replace(REPLACE_CODE_REGEX, ''))} style={[styles.textStyle, styles.code]}>
            {c.replace(REPLACE_CODE_REGEX, '')}
          </Text>:
          <Content {...{ onLongPress, delayLongPress }} content={c} color={color} depth={depth + 1} key={`${i}-i-${depth}`} />
        )}
      </>
    )
  }
  
  if (BOLD_REGEX.test(content)) {
    return (
      <>
        {splitByRegex(content, BOLD_REGEX).map((c, i) => BOLD_REGEX.test(c) ?
          <Text {...{ onLongPress, delayLongPress }} style={[styles.textStyle, styles.bold]}>{c.replace(REPLACE_BOLD_REGEX, '')}</Text>:
          <Content {...{ onLongPress, delayLongPress }} content={c} color={color} depth={depth + 1} key={`${i}-i-${depth}`} />
        )}
      </>
    )
  }

  if (ITALIC_REGEX.test(content)) {
    return (
      <>
        {splitByRegex(content, ITALIC_REGEX).map((c, i) => ITALIC_REGEX.test(c) ?
          <Text {...{ onLongPress, delayLongPress }} style={[styles.textStyle, styles.italic]}>{c.replace(REPLACE_ITALIC_REGEX, '')}</Text>:
          <Content {...{ onLongPress, delayLongPress }} content={c} color={color} depth={depth + 1} key={`${i}-i-${depth}`} />
        )}
      </>
    )
  }

  return (
    <>
      {splitByRegex(content, SPLIT_BY_URL_REGEX).map((c, i) => SPLIT_BY_URL_REGEX.test(c) ?
        <A href={c} key={`${i}-${depth}`} style={styles.linkStyle} target='_blank'>{c}</A>:
        <Text {...{ onLongPress, delayLongPress }} style={styles.textStyle} key={`${i}-${depth}`}>{c}</Text>
      )}
    </>
  )  
}
