import { TouchableOpacity, Linking, StyleSheet, View, Text, Image } from 'react-native'
import { uq_purple } from '../../constants/Colors'

const UqbarExperience = () => {
  const styles = StyleSheet.create({
    link: {
      marginTop: 32,
    },
    content: {
      display: 'flex',
      flexDirection: 'row'
    },
    logo: {
      height: 24,
      width: 24,
      marginRight: 12,
    },
    text: {
      color: uq_purple,
      fontSize: 20,
      fontWeight: '600',
    }
  })

  return (
    <TouchableOpacity onPress={() => Linking.openURL('https://uqbar.network')} style={styles.link}>
      <View style={styles.content}>
        <Image style={styles.logo} source={require('../../../assets/images/escape-icon.png')} />
        <Text style={styles.text}>An Uqbar Experience</Text>
      </View>
    </TouchableOpacity>
  )
}

export default UqbarExperience
