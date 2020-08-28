import { EventEmitter } from './event'
import { getCurrentTabId } from './utils'

const BACKGROUNDJS = 'backgroundJs'
const CONTENTJS = 'contentJs'
const INJECTJS = 'injectJs'
const DEVTOOLSJS = 'devtoolsJs'
const POPUPJS = 'popupJs'
export type MsgType = typeof BACKGROUNDJS | typeof CONTENTJS | typeof INJECTJS | typeof DEVTOOLSJS | typeof POPUPJS

// 这玩意儿大家自己搞一个，别写成一样的了，如果用到这玩意儿了，消息就乱套了
const TOKEN = 'dknf;sownfoiflkmdI32f908nowinefpu42knas@OI#das'
const WHATISMYTABID = 'what is my tabID?'

interface MessageProtocol<T extends keyof U, U> {
  token: string
  to?: MsgType
  toTabID?: number | null
  from?: MsgType
  fromTabID?: number | null
  reply?: boolean
  InjectRedict?: boolean
  method: T
  messageID: number
  data?: U[T]
  error?: any
}

interface CallbackItem<K> {
  reject: Function
  resolve: Function
  method: K
}

export async function getMsgSender(type: MsgType) {
  switch (type) {
    case INJECTJS: {
      return new InjectJsMessageSender()
    }
    case CONTENTJS: {
      return await ContentJsMessageSender.creat()
    }
    case BACKGROUNDJS: {
      return new BackgroundMessageSender()
    }
    case DEVTOOLSJS: {
      return await DevtoolsMessageSender.creat()
    }
    case POPUPJS: {
      return await PopupMessageSender.creat()
    }
  }
}
export interface BaseMessageSender<T> {
  emit<K extends keyof T>(K: K, msg: MessageProtocol<K, T>): boolean
}

export class BaseMessageSender<T> extends EventEmitter {
  public tabID: number | null
  private messageID: number = 0
  public type: MsgType = INJECTJS
  private callBacks = new Map<number, CallbackItem<keyof T>>()
  constructor() {
    super()
    this.tabID = null
  }
  _send<K extends keyof T>(msg: MessageProtocol<K, T>) {
    throw new Error(`需要子类来实现这个方法`)
  }
  onMessage<K extends keyof T>(msg: MessageProtocol<K, T>) {
    console.log('收到消息：', msg)
    if (msg.reply) {
      console.log('处理回复消息')
      this.handleReply(msg)
    } else {
      console.log('直接消息处理')
      const method = msg.method
      this.emit(method, msg)
    }
  }
  sendEvent<K extends keyof T>(msg: MessageProtocol<K, T>): Promise<CallbackItem<keyof T>> {
    this._send(msg)
    return new Promise((resolve, reject) => {
      this.callBacks.set(msg.messageID!, { resolve, reject, method: msg.method! })
    })
  }
  reply<K extends keyof T>(msg: MessageProtocol<K, T>, result: any = null, error: any = null) {
    const data = {
      token: TOKEN,
      from: msg.to,
      fromTabID: msg.toTabID,
      reply: true,
      to: msg.from,
      toTabID: msg.fromTabID,
      method: msg.method,
      data: result,
      error: error
    } as MessageProtocol<K, T>
    this._send(data)
  }

  handleReply<K extends keyof T>(msg: MessageProtocol<K, T>) {
    const id = msg.messageID
    const error = msg.error
    const callback = this.callBacks.get(id)
    if (callback) {
      console.log('callback')
      this.callBacks.delete(id)
      if (error) {
        callback.reject(new Error(`Protocol error (${callback.method}): ${error.message} ${error.data}`))
      } else {
        console.log('resolve')
        callback.resolve(msg)
      }
    }
  }

  genMessageProtocol<K extends keyof T>(msgData: T[K], method: K, to: MsgType, tabID = null): MessageProtocol<K, T> {
    return {
      token: TOKEN,
      from: this.type,
      fromTabID: this.tabID,
      reply: false,
      to: to,
      toTabID: tabID === null ? this.tabID : tabID,
      method: method,
      messageID: this.messageID++,
      data: msgData
    }
  }
  sendMsgToContentJS<K extends keyof T>(msgData: T[K], method: K, toTabID = null) {
    const data = this.genMessageProtocol(msgData, method, CONTENTJS, toTabID)
    this._send(data)
  }
  sendEventToContentJS<K extends keyof T>(msgData: T[K], method: K, toTabID = null): Promise<CallbackItem<keyof T>> {
    const data = this.genMessageProtocol(msgData, method, CONTENTJS, toTabID)
    return this.sendEvent(data)
  }

  sendMsgToDevtoolJS<K extends keyof T>(msgData: T[K], method: K, toTabID = null) {
    const data = this.genMessageProtocol(msgData, method, DEVTOOLSJS, toTabID)
    this._send(data)
  }

  sendMsgToPopupJS<K extends keyof T>(msgData: T[K], method: K, toTabID = null) {
    const data = this.genMessageProtocol(msgData, method, POPUPJS, toTabID)
    this._send(data)
  }

  sendEventToDevtoolJS<K extends keyof T>(msgData: T[K], method: K, toTabID = null): Promise<CallbackItem<keyof T>> {
    const data = this.genMessageProtocol(msgData, method, DEVTOOLSJS, toTabID)
    return this.sendEvent(data)
  }

  sendMsgToBackgroundJS<K extends keyof T>(msgData: T[K], method: K, toTabID = null) {
    const data = this.genMessageProtocol(msgData, method, BACKGROUNDJS, toTabID)
    this._send(data)
  }

  sendEventToBackgroundJS<K extends keyof T>(msgData: T[K], method: K, toTabID = null): Promise<CallbackItem<keyof T>> {
    const data = this.genMessageProtocol(msgData, method, BACKGROUNDJS, toTabID)
    return this.sendEvent(data)
  }

  sendMsgToInjectJS<K extends keyof T>(msgData: T[K], method: K, toTabID = null) {
    const data = this.genMessageProtocol(msgData, method, INJECTJS, toTabID)
    this._send(data)
  }

  sendEventToInjectJS<K extends keyof T>(msgData: T[K], method: K, toTabID = null): Promise<CallbackItem<keyof T>> {
    const data = this.genMessageProtocol(msgData, method, INJECTJS, toTabID)
    return this.sendEvent(data)
  }
  sendEventToPopupJS<K extends keyof T>(msgData: T[K], method: K, toTabID = null): Promise<CallbackItem<keyof T>> {
    const data = this.genMessageProtocol(msgData, method, POPUPJS, toTabID)
    return this.sendEvent(data)
  }
}

class InjectJsMessageSender<T> extends BaseMessageSender<T> {
  constructor() {
    super()
    this.type = INJECTJS
    console.log('injectJs Message sender init ok')
    window.addEventListener('message', this._onEventMessage.bind(this))
  }
  _onEventMessage(event: MessageEvent) {
    this.onMessage(event.data)
  }
  _send<K extends keyof T>(msg: MessageProtocol<K, T>) {
    window.postMessage(msg, '*')
  }
}

class ContentJsMessageSender<T> extends BaseMessageSender<T> {
  private toBackGroundPort: chrome.runtime.Port
  constructor(toBackGroundPort: chrome.runtime.Port, tabID: number) {
    super()
    this.toBackGroundPort = toBackGroundPort
    this.tabID = tabID
    this.type = CONTENTJS
    window.addEventListener('message', this._onEventMessage.bind(this))
    toBackGroundPort.onMessage.addListener(this._onMessage.bind(this))
  }
  static async creat() {
    const tabID = await ContentJsMessageSender.getTabID()
    const toBackGroundPort = chrome.runtime.connect({
      name: `${CONTENTJS}-${tabID}`
    })
    // toBackGroundPort.postMessage(WHATISMYTABID);
    return new ContentJsMessageSender(toBackGroundPort, tabID)
  }

  static async getTabID(): Promise<number> {
    return new Promise((resolve, reject) => {
      const queryTabIDPort = chrome.runtime.connect({ name: WHATISMYTABID })
      queryTabIDPort.onMessage.addListener((msg) => {
        queryTabIDPort.disconnect()
        resolve(msg as number)
      })
    })
  }
  _send<K extends keyof T>(msg: MessageProtocol<K, T>) {
    if (msg.to === INJECTJS) {
      window.postMessage(msg, '*')
      return
    }
    this.toBackGroundPort.postMessage(msg)
  }
  _onMessage<K extends keyof T>(msg: MessageProtocol<K, T>) {
    if (msg.token !== TOKEN) return
    // 给injectjs发出的消息添加发出tabID
    if (msg.from === INJECTJS) {
      msg.fromTabID = this.tabID
      // msg.toTabID = this.tabID;
    }
    if (msg.to === CONTENTJS) {
      this.onMessage(msg)
    } else {
      this.redictMessage(msg)
    }
  }
  redictMessage<K extends keyof T>(msg: MessageProtocol<K, T>) {
    console.log('转发消息', msg)
    if (msg.to === INJECTJS) {
      // 这个是用来区分发送到injectsjs的标志，应为他俩都监听了message事件
      msg.InjectRedict = true
    }
    this._send(msg)
  }

  _onEventMessage<K extends keyof T>(event: MessageEvent) {
    const msg = event.data as MessageProtocol<K, T>
    // injectJs才会处理
    if (msg.InjectRedict) return
    this._onMessage(msg)
  }
}

class BackgroundMessageSender<T> extends BaseMessageSender<T> {
  private devtoolsPorts: Map<number, chrome.runtime.Port>
  private contentJsPorts: Map<number, chrome.runtime.Port>
  private popupPort?: chrome.runtime.Port
  private onConnect: Function
  constructor() {
    super()

    /**
     * @type {Map<number,chrome.runtime.Port>} -可能会有多个devTools同时链接到background，使用tabID进行区分
     */
    this.devtoolsPorts = new Map()
    this.contentJsPorts = new Map()
    this.onConnect = (port: chrome.runtime.Port) => {
      if (port.name === WHATISMYTABID) {
        const tabID = port.sender!.tab!.id!
        port.postMessage(tabID)
        return
      }
      const info = port.name.split('-')
      const ID = parseInt(info[1])
      const _type = info[0]
      if (_type === POPUPJS) {
        this.popupPort = port
      } else {
        const _map = _type === DEVTOOLSJS ? this.devtoolsPorts : this.contentJsPorts
        _map.set(ID, port)
      }
      port.onMessage.addListener(this._onMessage.bind(this))
      port.onDisconnect.addListener(this.onProtDisconnect.bind(this))
    }
    chrome.runtime.onConnect.addListener(this.onConnect.bind(this))
  }

  onProtDisconnect(port: chrome.runtime.Port) {
    const info = port.name.split('-')
    const ID = parseInt(info[1])
    const _type = info[0]
    if (_type === POPUPJS) {
      this.popupPort = undefined
    } else {
      const _map = _type === DEVTOOLSJS ? this.devtoolsPorts : this.contentJsPorts
      _map.delete(ID)
    }
    console.log('删除:', port)
  }

  _send<K extends keyof T>(msg: MessageProtocol<K, T>) {
    console.log('发送消息:', msg)
    let port: chrome.runtime.Port | undefined
    if (msg.to === POPUPJS) {
      port = this.popupPort
    } else {
      const _map = msg.to === DEVTOOLSJS ? this.devtoolsPorts : this.contentJsPorts
      port = _map.get(msg.toTabID || -1)
    }

    if (!port) {
      console.log('没有获取到对应的port')
      return
    }
    port.postMessage(msg)
  }

  _onMessage<K extends keyof T>(msg: MessageProtocol<K, T>) {
    if (msg.token !== TOKEN) return
    if (msg.to !== BACKGROUNDJS) {
      this._send(msg)
    }
    this.onMessage(msg)
  }
}

/**
 * devTools的消息处理机制
 */
class DevtoolsMessageSender<T> extends BaseMessageSender<T> {
  private toBackGroundPort: chrome.runtime.Port
  constructor(port: chrome.runtime.Port, tabID: number) {
    super()
    this.toBackGroundPort = port
    this.tabID = tabID
    this.type = DEVTOOLSJS
    this.toBackGroundPort.onMessage.addListener(this._onMessage.bind(this))
  }

  static async creat() {
    const tabID = await getCurrentTabId()
    const toBackGroundPort = chrome.runtime.connect({
      name: `${DEVTOOLSJS}-${tabID}`
    })
    return new DevtoolsMessageSender(toBackGroundPort, tabID!)
  }

  _send<K extends keyof T>(msg: MessageProtocol<K, T>) {
    this.toBackGroundPort.postMessage(msg)
  }

  _onMessage<K extends keyof T>(msg: MessageProtocol<K, T>) {
    this.onMessage(msg)
  }
}

class PopupMessageSender<T> extends BaseMessageSender<T> {
  private toBackGroundPort: chrome.runtime.Port
  constructor(port: chrome.runtime.Port, tabID: number) {
    super()
    this.toBackGroundPort = port
    this.tabID = tabID
    this.type = POPUPJS
    this.toBackGroundPort.onMessage.addListener(this._onMessage.bind(this))
  }

  static async creat() {
    const tabID = await getCurrentTabId()
    const toBackGroundPort = chrome.runtime.connect({
      name: `${POPUPJS}-${tabID}`
    })
    return new DevtoolsMessageSender(toBackGroundPort, tabID!)
  }
  _send<K extends keyof T>(msg: MessageProtocol<K, T>) {
    this.toBackGroundPort.postMessage(msg)
  }

  _onMessage<K extends keyof T>(msg: MessageProtocol<K, T>) {
    this.onMessage(msg)
  }
}
