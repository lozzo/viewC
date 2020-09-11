/**
 * 这个文件设置包含所有的浏览器http网络相关行为
 */

//HTTP proxy auth must be handled via webRequest.onAuthRequired
//https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onAuthRequired#Proxy_authorization
//If an extension has the "webRequest", "webRequestBlocking", "proxy", and "<all_urls>" permissions, then it will
//be able to use onAuthRequired to supply credentials for proxy authorization (but not for normal web authorization).
//The listener will not be able to cancel system requests or make any other modifications to any system requests
// mainfest.json 内 permission 必须包含 '<all_urls>'
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
