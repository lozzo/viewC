import { MessageSender, Imsg } from '@/lib/messages'
import { EventEmitter } from '@/lib/event'
import axios from 'axios'

const toInt = (x: any) => {
  return parseInt(x)
}
export enum ProxyType {
  'noneProxy',
  'system',
  'auto',
  'manual'
}
interface IPorxy {
  type: ProxyType
  proxy?: string
}

interface IParsedProxy {
  host: string
  port: number
  auth?: string
}

export interface ProxyMsg {
  proxySet: Imsg<IPorxy, boolean>
}

// 设置代理的地方
export class ChromeProxyCtl extends EventEmitter {
  private sender: MessageSender<ProxyMsg>
  constructor(sender: MessageSender<ProxyMsg>) {
    super()
    this.sender = sender
    this.sender.on('proxySet', async (data, echo) => {
      const ok = await this.setProxy(data.data)
      echo(ok)
    })
  }
  async setProxy(proxyOptions: IPorxy) {
    // 如果是系统代理或者直连
    if (proxyOptions.type === ProxyType.noneProxy || proxyOptions.type === ProxyType.system) {
      chrome.proxy.settings.set({
        value: {
          mode: proxyOptions.type === ProxyType.noneProxy ? 'direct' : 'system'
        }
      })
      return true
    }

    //
    const proxy = this.verifyProxy(
      proxyOptions.type === ProxyType.auto ? await this.getProxyOnline() : proxyOptions.proxy!
    )
    const parsedProxy = this.parseProxy(proxy)
    console.info('dlog-chromePorxy:56', parsedProxy)
    const config = {
      value: {
        mode: 'fixed_servers',
        rules: {
          proxyForHttp: {
            scheme: 'http',
            host: parsedProxy.host,
            port: parsedProxy.port
          },
          proxyForHttps: {
            scheme: 'http',
            host: parsedProxy.host,
            port: parsedProxy.port
          }
        }
      }
    }
    chrome.proxy.settings.set(config)
    return true
  }

  parseProxy(proxyStr: string): IParsedProxy {
    let aFlag = false
    if (proxyStr.indexOf('@') === -1) {
      aFlag = true
      proxyStr = 'xxx:xxx@' + proxyStr
    }
    const [auth, server] = proxyStr.split('@')
    const [host, port] = server.split(':')
    return {
      host: host,
      port: toInt(port),
      auth: aFlag ? undefined : `Basic ${btoa(auth)}`
    }
  }

  /**
   * 获取在线代理
   * @param proxyUrl 代理获取的地址，这个函数后期可配置
   */
  async getProxyOnline(proxyUrl = 'http://10.200.100.43:48083/getProxy') {
    const resp = await axios.post(proxyUrl, {
      args: {
        num: 1,
        type: '[1]',
        bbd_type: 'test',
        bbd_table: 'chrome_ex'
      },
      proxy: []
    })
    const _p = resp.data.data[0].proxy
    return _p
  }

  // async getProxyOnline(proxyUrl = 'http://proxy.bbdops.net:48083/getProxy') {
  //   const resp = await fetch(proxyUrl, { method: 'GET' })
  //   console.info('dlog-chromePorxy:112', resp)
  //   return '127.0.0.1:1087'
  // }

  verifyProxy(proxy: string) {
    if (proxy.startsWith('http://')) {
      proxy = proxy.substr(7)
    }
    const proxyRegx = /\w+:\w+@\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,6}/
    return proxyRegx.test(proxy) ? proxy : ''
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
  }
}
