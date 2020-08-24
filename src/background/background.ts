import { colorInfoLog } from '../lib/utils'
import { getMsgSender } from '../lib/messages'
;(async () => {
  colorInfoLog('background', 'info', 'init.....')
  const sender = await getMsgSender('backgroundJs')
  sender.on('xx', (x: any) => {
    colorInfoLog('background', 'msg', x)
  })
})()
