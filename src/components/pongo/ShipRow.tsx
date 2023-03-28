import { StyleSheet, Pressable } from "react-native";
import { light_gray } from "../../constants/Colors";
import Row from "../spacing/Row";
import Avatar from "./Avatar";
import ShipName from "./ShipName";
import useColors from "../../hooks/useColors";
import { addSig } from "../../util/string";
import { useMemo } from "react";

interface ShipRowProps {
  ship: string
  noBorder?: boolean
  onPress: (ship: string) => () => void
}

export default function ShipRow({ ship, noBorder = false, onPress }: ShipRowProps) {
  const { color } = useColors()

  const styles = useMemo(() => StyleSheet.create({
    container: {
      width: '100%',
      paddingVertical: noBorder ? 8 : 12,
      paddingLeft: '10%',
      borderTopWidth: noBorder ? undefined : 1,
      borderBottomWidth: noBorder ? undefined : 1,
      borderColor: light_gray,
    },
    shipName: { fontSize: 20, fontWeight: '600', color, marginLeft: 8 },
  }), [color, noBorder])

  return (
    <Pressable onPress={onPress(ship)} style={{ width: '100%' }}>
      <Row style={styles.container}>
        <Avatar size="large" ship={addSig(ship)} />
        <ShipName name={ship} showAlias style={styles.shipName} />
      </Row>
    </Pressable>
  )

}
