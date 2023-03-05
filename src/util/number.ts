import 'intl';
import 'intl/locale-data/jsonp/en';
import { patp2dec, isValidPatp } from 'urbit-ob'
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

export const getShipColor = (ship: string) => {
  return isValidPatp(addSig(ship)) ? intToRGB(patp2dec(addSig(ship))) : 'black'
}

export const fromUd = (amount?: string) => amount ? Number(amount.replace(/\./g, '')) : 0
