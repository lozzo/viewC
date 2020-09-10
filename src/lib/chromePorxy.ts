import { MessageSender, MsgType, Imsg, MessageProtocol } from '@/lib/messages'
import { EventEmitter } from '@/lib/event'

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

// 设置代理的地方
export class ChromeProxyCtl extends EventEmitter {
  constructor() {
    super()
  }
}

export interface ProxyMsg {
  ppp: Imsg<number, number>
  proxySet: Imsg<IPorxy, string>
  c: Imsg<boolean, boolean>
}
// 使用消息发送代理设置
export class ChromeProxySet extends EventEmitter {
  private sender: MessageSender<ProxyMsg>
  constructor(sender: MessageSender<ProxyMsg>) {
    super()
    this.sender = sender
    this.sender.on('proxySet', (data, echo) => {})
  }

  static async create(_type: MsgType) {
    const msgSender = new MessageSender<ProxyMsg>()
    const a = await msgSender.sendEventToContentJS('proxySet', { type: ProxyType.auto })
    return new ChromeProxySet(msgSender)
  }
  async setPorxy(_proxy: IPorxy) {
    // const info = await this.sender.sendEventToBackgroundJS({ re })
  }
}
