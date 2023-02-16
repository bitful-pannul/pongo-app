import { Pressable } from "react-native";
import useContactState from "../../state/useContactState";
import { light_gray } from "../../constants/Colors";
import Col from "../spacing/Col";
import Row from "../spacing/Row";
import Avatar from "./Avatar";
import ShipName from "./ShipName";
import useColors from "../../hooks/useColors";

interface ShipRowProps {
  ship: string
  onPress: (ship: string) => () => void
}

export default function ShipRow({ ship, onPress }: ShipRowProps) {
  const { contacts } = useContactState()
  const { color } = useColors()

  return (
    <Pressable onPress={onPress(ship)} style={{ width: '100%' }}>
      <Row style={{ width: '100%', paddingVertical: 12, paddingLeft: '10%', borderTopWidth: 1, borderBottomWidth: 1, borderColor: light_gray }}>
        <Avatar size="large" ship={ship} />
        <Col style={{ marginLeft: 8 }}>
          <ShipName name={ship} showAlias style={{ fontSize: 20, fontWeight: '600', color }} />
          {contacts[ship]?.nickname ? (
            <ShipName name={ship} />
          ) : null}
        </Col>
      </Row>
    </Pressable>
  )

}
