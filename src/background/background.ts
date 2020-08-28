import { colorInfoLog } from '../lib/utils'
import { getMsgSender } from '../lib/messages'
import { CommonMsg } from '@/consts'
;(async () => {
  colorInfoLog('background', 'info', 'init.....')
  const sender = await getMsgSender<CommonMsg>('backgroundJs')
  sender.on('ping', (x) => {
    colorInfoLog('background', 'msg', x)
  })
})()
