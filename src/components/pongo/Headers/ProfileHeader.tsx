import { View } from "react-native";
import { isIos, window } from "../../../constants/Layout";
import H3 from "../../text/H3";
import Avatar from "../Avatar";

interface ProfileHeaderProps {
  name: string;
  showAvatar?: boolean;
}

export default function ProfileHeader({ name, showAvatar = false }: ProfileHeaderProps) {
  const { width } = window

  return (
    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', maxWidth: width * 0.7 - 32 }}>
      {showAvatar && <>
        <Avatar ship={name} size='default' />
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
