import { stringRenderer, sigil } from '@tlon/sigil-js';
import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { getShipColor } from '../util/number';
import { deSig } from '../util/string';

export const foregroundFromBackground = (background: string) => {
  const rgb = {
    r: parseInt(background.slice(1, 3), 16),
    g: parseInt(background.slice(3, 5), 16),
    b: parseInt(background.slice(5, 7), 16)
  };
  const brightness = (299 * rgb.r + 587 * rgb.g + 114 * rgb.b) / 1000;
  const whiteBrightness = 255;

  return whiteBrightness - brightness < 50 ? 'black' : 'white';
};

interface SigilProps {
  color?: string;
  ship: string;
  size?: number;
  svgClass?: string;
  foreground?: string;
  padding?: number;
  icon?: boolean;
}

export const Sigil = memo(
  ({
    foreground = '',
    ship,
    size = 24,
    color = getShipColor(ship),
    svgClass = '',
    icon = false,
    padding = size / 8,
  }: SigilProps) => {
    const innerSize = size - 2 * padding;
    const foregroundColor = foreground
      ? foreground
      : foregroundFromBackground(color);

    const cleanShip = deSig(ship)
    const first = cleanShip[0]?.toUpperCase()
    const fourth = cleanShip[3]?.toUpperCase()
    const seventh = cleanShip[7]?.toUpperCase()
    const tenth = cleanShip[10]?.toUpperCase()

    return ship.length > 14 ? (
      <View style={{
        backgroundColor: color,
        borderRadius: icon ? 2 : 0,
        height: size,
        width: size,
      }} />
    ) : (
      <View style={{
        borderRadius: icon ? 2 : 0,
        height: size,
        width: size,
        backgroundColor: color,
        padding,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', width: '100%' }}>
          <Text style={{ fontSize: size / 3, fontWeight: '600', color: foregroundColor }}>{first}</Text>
          {Boolean(fourth) && <Text style={{ fontSize: size / 3, fontWeight: '600', color: foregroundColor }}>{fourth}</Text>}
        </View>
        {Boolean(seventh && tenth) && (
          <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', width: '100%' }}>
            <Text style={{ fontSize: size / 3, fontWeight: '600', color: foregroundColor }}>{seventh}</Text>
            <Text style={{ fontSize: size / 3, fontWeight: '600', color: foregroundColor }}>{tenth}</Text>
          </View>
        )}
        {/* <SvgXml
          width="100%"
          height="100%"
          xml={sigil({
            patp: ship,
            renderer: stringRenderer,
            size: innerSize,
            icon,
            colors: [color, foregroundColor],
            class: svgClass
          })}
        /> */}
      </View>
    );
  }
);

Sigil.displayName = 'Sigil';

export default Sigil;
