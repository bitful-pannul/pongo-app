export const MENTION_REGEX = /((^[@][A-Za-z-]*?$)|(\s[@][A-Za-z-]*?$))(?!\s)/gm
export const HAS_MENTION_REGEX = /~([a-z]{6}\-[a-z]{6}\-[a-z]{6}\-[a-z]{6}($|\s)|[a-z]{6}\-[a-z]{6}($|\s)|[a-z]{6}($|\s)|[a-z]{3}($|\s))/gmi
export const URBIT_APP_LINK = /^urbit:\/\/apps\/.*$/i
