export const uq_vvlightpurple = '#ecedfd';
export const uq_vlightpurple = '#d9dcfc';
export const uq_lightpurple = '#c7cafa';
export const uq_purple = '#727bf2';
export const uq_darkpurple_transparent = 'rgba(87, 97, 239, 0.2)';
export const uq_darkpurple = '#5761ef';
export const midnightpurp = '#0a1170';
export const forgottenpurp = '#45475e';

export const uq_vlightpink = '#fbeff0';
export const uq_lightpink = '#f3ced2';
export const uq_pink = '#dd7c8a';
export const uq_darkpink = '#cd3c52';
export const blush = '#d55d6f';

export const apocyan = '#cef3ef';
export const lapocyan = '#effbfa';
export const celeste = '#adebe5';
export const lturq = '#6bdbd0';
export const turq = '#3acfc0';
export const celadon = '#21897e';
export const deep_jungle = '#14524c';
export const old_mint = '#659792';

export const goldenrod = '#dba206';
export const saffron = '#f8c630';
export const laffron = '#fad975';
export const cornsilk = '#fef4d8';

export const washed_gray = 'rgba(0, 0, 0, 0.03)';
export const light_gray = 'rgba(0, 0, 0, 0.1)';
export const light_wight = 'rgba(255,255,255, 0.5)';
export const medium_gray = 'rgba(0, 0, 0,  0.2)';
export const dark_gray = 'rgba(0, 0, 0,  0.5)';
export const dark_gray_solid = 'rgba(50, 50, 50, 1)';
export const charcoal = '#333';

export const gray_overlay = 'rgba(130, 130, 130, 0.4)';
export const gray_overlay_transparent = 'rgba(130, 130, 130, 0)';

// Need to account for the purple background in Chat
export const blue_overlay = 'rgba(96, 160, 255, 0.7)';
export const blue_overlay_transparent = 'rgba(96, 160, 255, 0)';

const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export default {
  light: {
    color: '#000',
    link: 'rgb(100,100,255)',
    backgroundColor: '#fff',
    shadedBackground: 'rgba(0,0,0,0.3)',
    chatBackground: uq_darkpurple_transparent,
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    ownChatBackground: uq_purple,
  },
  dark: {
    color: '#fff',
    link: 'rgb(150,150,255)',
    backgroundColor: '#000',
    shadedBackground: 'rgba(0,0,0,0.7)',
    chatBackground: uq_darkpurple_transparent,
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
    ownChatBackground: uq_darkpurple,
  },
};
