import { colorInfoLog } from '@/lib/utils'
import { getMsgSender } from '@/lib/messages'
import { ProxyMsg, ChromeProxyCtl } from '@/lib/chromePorxy'
;(async () => {
  colorInfoLog('background', 'info', 'init.....')
  const sender = await getMsgSender<ProxyMsg>('backgroundJs')
  const proxyCtl = new ChromeProxyCtl(sender)
  //HTTP proxy auth must be handled via webRequest.onAuthRequired
  //developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onAuthRequired#Proxy_authorization
  //If an extension has the "webRequest", "webRequestBlocking", "proxy", and "<all_urls>" permissions, then it will
  //be able to use onAuthRequired to supply credentials for proxy authorization (but not for normal web authorization).
  //The listener will not be able to cancel system requests or make any other modifications to any system requests.https:
  chrome.webRequest.onAuthRequired.addListener(
    (details, callback) => {
      if (callback && details.isProxy) {
        callback({
          authCredentials: {
            username: 'bbdservice',
            password: 'Bbd2019Spider'
          }
        })
      }
    },
    { urls: ['<all_urls>'] },
    ['asyncBlocking']
  )
})()
