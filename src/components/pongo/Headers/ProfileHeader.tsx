import { View } from "react-native";
import useDimensions from "../../../hooks/useDimensions";
import H3 from "../../text/H3";
import Avatar from "../Avatar";
import useColors from "../../../hooks/useColors";
import { getShipColor } from "../../../util/number";

interface ProfileHeaderProps {
  name: string;
  showAvatar?: boolean;
}

export default function ProfileHeader({ name, showAvatar = false }: ProfileHeaderProps) {
  const { cWidth } = useDimensions()
  const { theme } = useColors()

  return (
    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', maxWidth: cWidth * 0.7 - 32 }}>
      {showAvatar && <>
        <Avatar ship={name} size='default' color={getShipColor(name, theme)} />
        <View style={{ width: 8 }} />
      </>}
      <H3
        style={{ color: 'white' }}
        text={name}
        numberOfLines={1}
      />
    </View>
  )
}
