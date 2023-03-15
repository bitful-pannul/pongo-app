import { useCallback, useEffect, useState } from "react";
import { BarCodeScanner, BarCodeScannerResult } from "expo-barcode-scanner";
import { StyleSheet, Text, View } from "react-native";
import Button from "../form/Button";
import useHandshakeStore from "../../state/useHandshakeState";

const QrCodeScanner: React.FC<{ onScan: (text: string) => void }> = ({
  onScan,
}) => {
  const { set } = useHandshakeStore()
  const [hasPermission, setHasPermission] = useState(false);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    };
    getBarCodeScannerPermissions();
  }, []);
  
  const handleBarCodeScanned = useCallback(({ type, data }: BarCodeScannerResult) => {
    setScanned(true);
    // alert(`Bar code with type ${type} and data ${data} has been scanned!`);
    onScan(data);
  }, []);

  const resetScan = useCallback(() => {
    set({ verifyError: undefined })
    setScanned(false)
  }, [])

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera. Please enable in Settings {'>'} Apps {'>'} Pongo</Text>;
  }

  function toggle() {
    // const i = cameras.indexOf(cam);
    // const i2 = i === cameras.length - 1 ? 0 : i + 1;
    // if (scanner) scanner.stop();
    // startCamera(cameras[i2]);
  }

  const styles = StyleSheet.create({
    wrapper: {
      width: 320,
      height: 320,
      alignSelf: 'center',
      marginTop: 16,
    },
  });

  return (
    <View style={styles.wrapper}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={{ height: 16 }} />
      {scanned && (
        <Button title={"Tap to Scan Again"} onPress={resetScan} />
      )}
      {/* <Button title="toggle" onPress={toggle}>
        Change Camera
      </Button> */}
    </View>
  );
};

export default QrCodeScanner;
