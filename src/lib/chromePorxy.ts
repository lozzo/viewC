import { MessageSender, Imsg } from '@/lib/messages'
import { EventEmitter } from '@/lib/event'
import axios from 'axios'

const toInt = (x: any) => {
  return parseInt(x)
}
export enum ProxyType {
  'noneProxy' = 'noneProxy',
  'system' = 'system',
  'auto' = 'auto',
  'manual' = 'manual'
}
interface IPorxy {
  type: ProxyType
  proxy?: string
}

interface IParsedProxy {
  scheme: 'http' | 'https' | 'socks5' | 'socks4'
  host: string
  port: number
  auth?: {
    user: string
    password: string
  }
}

export interface ProxyInfo extends Partial<IParsedProxy> {
  proxyType: ProxyType
}

interface proxySetResp {
  ok: boolean
  msg?: string
}

interface onlineProxyResp {
  proxy: string
  error?: string
}
export interface ProxyMsg {
  proxySet: Imsg<IPorxy, proxySetResp>
  proxyGet: Imsg<any, ProxyInfo>
}

// 设置代理的地方
export class ChromeProxyCtl extends EventEmitter {
  private sender: MessageSender<ProxyMsg>
  private proxyInfo?: ProxyInfo
  constructor(sender: MessageSender<ProxyMsg>) {
    super()
    this.sender = sender
    this.sender.on('proxySet', async (data, echo) => {
      const ok = await this.setProxy(data.data)
      echo(ok)
    })

    this.sender.on('proxyGet', async (data, echo) => {
      let info = await this.getProxyInfo()
      info = info !== undefined ? info : { proxyType: ProxyType.noneProxy }
      echo(info)
    })

    chrome.webRequest.onAuthRequired.addListener(
      async (details, callback) => {
        if (callback && details.isProxy) {
          const proxyInfo = await this.getProxyInfo()
          callback({
            authCredentials: {
              username: proxyInfo!.auth?.user!,
              password: proxyInfo!.auth?.password!
            }
          })
        }
      },
      { urls: ['<all_urls>'] },
      ['asyncBlocking']
    )
  }

  async setProxy(proxyOptions: IPorxy): Promise<proxySetResp> {
    return new Promise(async (resv, rej) => {
      // 如果是系统代理或者直连
      let config
      let parsedProxy: IParsedProxy | undefined = undefined
      if (proxyOptions.type === ProxyType.noneProxy || proxyOptions.type === ProxyType.system) {
        config = {
          value: {
            mode: proxyOptions.type === ProxyType.noneProxy ? 'direct' : 'system'
          }
        }
      } else {
        let proxy = ''
        if (proxyOptions.type === ProxyType.auto) {
          const p = await this.getProxyOnline()
          if (p.error !== undefined) {
            resv({ ok: false, msg: p.error })
            return
          }
          proxy = p.proxy
        } else {
          proxy = proxyOptions.proxy!
        }

        proxy = this.verifyProxy(proxy)
        if (proxy === '') return resv({ ok: false, msg: 'proxy format error' })
        parsedProxy = this.parseProxy(proxy)
        config = {
          value: {
            mode: 'fixed_servers',
            rules: {
              bypassList: [
                '127.0.0.1',
                '::1',
                'localhost',
                '10.28.0.1/16',
                '192.168.0.1/16',
                '10.200.0.1/16',
                '*.bbdops.com',
                '*.gyops.com',
                '*.bbdops.net',
                '*.bbdservice.com'
              ],
              proxyForHttp: {
                scheme: parsedProxy.scheme,
                host: parsedProxy.host,
                port: parsedProxy.port
              },
              proxyForHttps: {
                scheme: parsedProxy.scheme,
                host: parsedProxy.host,
                port: parsedProxy.port
              }
            }
          }
        }
      }

      chrome.proxy.settings.set(config, async () => {
        await this.setProxyInfo({
          proxyType: proxyOptions.type,
          scheme: parsedProxy?.scheme,
          port: parsedProxy?.port,
          host: parsedProxy?.host,
          auth: parsedProxy?.auth
        })
        resv({ ok: true })
      })
    })
  }
  //HTTP {http|https}://[user[:pass]@][host[:port]]
  //SOCKS {socks4|socks5}://[user[:pass]@][host[:port]]
  parseProxy(proxyStr: string): IParsedProxy {
    let scheme: 'http' | 'https' | 'socks5' | 'socks4' = 'http'
    if (proxyStr.indexOf('://') === -1) {
      console.info('no proxy scheme, set http by default')
      proxyStr = 'http://' + proxyStr
    }

    if (proxyStr.startsWith('http://')) {
      scheme = 'http'
    }
    if (proxyStr.startsWith('https://')) {
      scheme = 'https'
    }
    if (proxyStr.startsWith('socks5://')) {
      scheme = 'socks5'
    }
    if (proxyStr.startsWith('socks4://')) {
      scheme = 'socks4'
    }

    const regex = /^.*:\/\//gm
    const subst = `http://`
    const result = proxyStr.replace(regex, subst)

    const url = new URL(result)
    const port = url.port !== '' ? toInt(url.port) : scheme === 'http' ? 80 : scheme === 'https' ? 443 : 1080
    return {
      host: url.hostname,
      port: port,
      scheme: scheme,
      auth:
        url.username === ''
          ? undefined
          : {
              user: url.username,
              password: url.password
            }
    }
  }

  /**
   * 获取在线代理
   * @param proxyUrl 代理获取的地址，这个函数后期可配置
   */
  async getProxyOnline(proxyUrl = 'http://10.200.100.43:48083/getProxy'): Promise<onlineProxyResp> {
    try {
      const resp = await axios.post(
        proxyUrl,
        {
          args: {
            num: 1,
            type: '[1]',
            bbd_type: 'test',
            bbd_table: 'chrome_ex'
          },
          proxy: []
        },
        { timeout: 10 * 1000 }
      )
      const _p = resp.data.data[0].proxy
      return { proxy: _p }
    } catch (e) {
      return {
        proxy: '',
        error: e.msg
      }
    }
  }

  verifyProxy(proxyStr: string) {
    const proxyRegx = /((https?|socks[45]{1}):\/\/){0,1}([a-zA-Z0-9]+:[a-zA-Z0-9]+@){0,1}((\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})|([a-zA-Z0-9._-]+)){1}(:\d{1,5}){0,1}/g
    const matchStr = proxyStr.match(proxyRegx)
    if (matchStr) {
      if (proxyStr === matchStr[0]) return proxyStr
    }
    return ''
  }

  async setProxyInfo(info: ProxyInfo) {
    return new Promise((resv) => {
      this.proxyInfo = info
      chrome.storage.local.set({ proxy: info }, () => {
        resv()
      })
    })
  }

  async getProxyInfo(): Promise<ProxyInfo | undefined> {
    return new Promise((resv) => {
      if (this.proxyInfo !== undefined) {
        resv(this.proxyInfo)
      }
      chrome.storage.local.get((item) => {
        const info = item['proxy']
        this.proxyInfo = info
        resv(info)
      })
    })
  }
}

// 使用消息发送代理设置
export class ChromeProxySet extends EventEmitter {
  private sender: MessageSender<ProxyMsg>
  constructor(sender: MessageSender<ProxyMsg>) {
    super()
    this.sender = sender
  }
  async setPorxy(proxy: IPorxy) {
    const ok = this.sender.sendMsgToBackgroundJS('proxySet', proxy)
    return ok
  }

  async getProxyInfo() {
    return await this.sender.sendMsgToBackgroundJS('proxyGet', '')
  }
}
