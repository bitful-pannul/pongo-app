import 'intl';
import 'intl/locale-data/jsonp/en';
import 'intl/locale-data/jsonp/de';
import { patp2dec, isValidPatp } from 'urbit-ob'
import { darken, hasBadContrast, lighten, parseToHsla } from 'color2k';
import { addSig } from './string';

export const formatAmount = (amount: number) => new Intl.NumberFormat('en-US').format(amount);

export const intToRGB = (value: number) => {
  //credit to https://stackoverflow.com/a/2262117/2737978 for the idea of how to implement
  let blue = Math.floor(value % 256);
  let green = Math.floor(value / 256 % 256);
  let red = Math.floor(value / 256 / 256 % 256);

  if (Math.abs(blue - green) < 70 && Math.abs(green - red) < 70 && Math.abs(red - blue) < 70) {
    blue = (blue + 40) % 256
    green = Math.abs(green + 80) % 256
    red = Math.abs(red + 160) % 256
  }

  return "rgb(" + red + "," + green + "," + blue + ")";
}

export function themeAdjustColor(color: string, theme: string /* light | dark */): string {
  const hsla = parseToHsla(color)
  const lightness = hsla[2]

  if (lightness <= 0.2 && theme === 'dark') {
    return lighten(color, 0.2 - lightness)
  }

  if (lightness >= 0.8 && theme === 'light') {
    return darken(color, lightness - 0.8)
  }

  return color
}

export const getShipColor = (ship: string, theme: string) => {
  return isValidPatp(addSig(ship)) ? themeAdjustColor(intToRGB(patp2dec(addSig(ship))), theme) : 'black'
}

export const fromUd = (amount?: string) => amount ? Number(amount.replace(/\./g, '')) : 0

export const numToUd = (num: string | number) => Number(num).toLocaleString('de-DE')
