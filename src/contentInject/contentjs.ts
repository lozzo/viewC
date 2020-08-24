import { Selector } from '../lib/selector'
import { getMsgSender } from '../lib/messages'
import { colorInfoLog } from '../lib/utils'
;(async () => {
  colorInfoLog('contentjs', 'Init', 'init.....')
  let selector: Selector
  const msgSender = await getMsgSender('contentJs')
  msgSender.on('startSelect', () => {
    selector = new Selector()
    selector.on('Csspath', (x: string) => {
      console.log(x)
    })
    selector.startSelect()
  })
  msgSender.on('stopSelect', () => {
    selector.overSelect()
  })
})()
