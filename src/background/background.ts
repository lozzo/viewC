import { colorInfoLog } from '@/lib/utils'
import { getMsgSender } from '@/lib/messages'
import { ProxyMsg, ChromeProxyCtl } from '@/lib/chromePorxy'
;(async () => {
  colorInfoLog('background', 'info', 'init.....')
  const sender = await getMsgSender<ProxyMsg>('backgroundJs')
  const proxyCtl = new ChromeProxyCtl(sender)
  chrome.webRequest.onAuthRequired.addListener(
    async (details, callback) => {
      if (callback && details.isProxy) {
        const proxyInfo = await proxyCtl.getProxyInfo()
        console.info('dlog-background:12', proxyInfo)
        callback({
          authCredentials: {
            username: proxyInfo.auth?.user!,
            password: proxyInfo.auth?.password!
          }
        })
      }
    },
    { urls: ['<all_urls>'] },
    ['asyncBlocking']
  )
})()
