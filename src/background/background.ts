import { colorInfoLog } from '../lib/utils'
import { getMsgSender } from '../lib/messages'
import { IM } from '@/consts'
;(async () => {
  colorInfoLog('background', 'info', 'init.....')
  const sender = await getMsgSender<IM>('backgroundJs')
  sender.on('ppp', (x, echo) => {
    colorInfoLog('background', 'msg', x)
    echo(1)
  })
})()
