import moment from "moment"

export const ONE_SECOND = 1000

export const getHoonDate = (d: Date) => `~${d.getFullYear()}.${d.getMonth()}.${d.getDate()}..${d.getHours()}.${d.getMinutes()}.${d.getSeconds()}..${d.getMilliseconds().toString(16)}`

export const padNumber = (number: string) => number.length === 1 ? `0${number}` : number

export const hoonToJSDate = (hoonDate: string) => {
  // "2015-03-25T12:00:00Z"
  const [date, time, ms] = hoonDate.slice(1).split('..')
  if (!date || !time || !ms) {
    return new Date()
  }

  const [year, month, day] = date.split('.')

  if (!day || !month || !year) {
    return new Date()
  }

  const isoDate = `${year}-${padNumber(month)}-${padNumber(day)}T${time.replace(/\./g, ':')}.${parseInt(ms, 16)}Z`
  return new Date(isoDate)
}

export const getHoonSeconds = (increment: string) => Number(increment.slice(2)) * (increment.includes('~m') ? 60 : 1)

export const getRelativeTime = (timestamp: number) =>
  moment(timestamp).calendar(null, {
    sameDay: 'h:mm a',
    nextDay: '[Tomorrow]',
    nextWeek: '[Next] dddd',
    lastDay: 'ddd',
    lastWeek: 'ddd',
    sameElse: 'DD/MM/YYYY'
  })

export const getRelativeDate = (timestamp: number) =>
  new Date(timestamp).getFullYear() !== new Date().getFullYear() ?
  moment(timestamp).format('MMMM Do, YYYY') :
  moment(timestamp).format('MMMM Do')

export const formatRecordTime = (rt: number) => {
  const minutes = Math.floor(rt / (60 * ONE_SECOND))
  const seconds = Math.floor((rt % (60 * ONE_SECOND)) / ONE_SECOND)

  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
}
