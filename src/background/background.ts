import { colorInfoLog } from '@/lib/utils'
import { getMsgSender } from '@/lib/messages'
import { ProxyMsg, ChromeProxyCtl } from '@/lib/chromePorxy'
;(async () => {
  colorInfoLog('background', 'info', 'init.....')
  const sender = await getMsgSender<ProxyMsg>('backgroundJs')
  const proxyCtl = new ChromeProxyCtl(sender)
  
})()
