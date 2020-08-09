/**
 * vflow的节点的定义和状态
 *  <div id='node-1'>
        <div class="inputs">
          <div class="input-1"></div>
        </div>
        <div class='content'></div>
        <div class="outputs">
          <div class="output-1"></div>
        </div>
    </div>
 */
const toInt = (x: any) => {
  return parseInt(x.toString())
}

/**
 * 这样写好在后期知道是什么东西
 */
export enum NodeConst {
  node = 'node',
  inputs = 'inputs',
  outputs = 'outputs',
  content = 'content',
  input = 'input',
  output = 'output',
  /**
   * 当本节点作为输出时的连接的svg对象的css名称
   */
  ToutConnectCssName = 'out-node',
  TinConnectCssName = 'in-node',
  ToutCss = 'out-',
  TinCss = 'in-',
  inputCssname = 'input_style',
  outputCssname = 'output_style',
  /**
   * path 的cssname
   */
  pathCssName = 'path',
  /**
   * svg 的cssname
   */
  connectionCssName = 'connection',
  /**
   * 临时连接
   */
  tmpConnection = 'tmpConnection'
}

export interface IPostion {
  x: number
  y: number
}
/**
 * 添加节点时的选项
 * @param id 添加节点的ID，如果设置则当前Flow的全局id以此为自增
 * @param postion 设置节点的起始位置
 * @param HTML 节点的内容
 * @param outputsID 输出连接到何处
 * @param inputsID 被那些节点连接
 * @param data T
 * @param css 自定义css样式类
 */
export interface NodeOptions<T> {
  id?: number
  postion?: IPostion
  HTML: string | Element
  data: T
  css?: string
}

interface ToNode {
  nodeID: number
  outputID: number
  inputID: number
}

export interface Node<T> {
  data: T
  /**
   *设置节点内容
   * @param innerHTML 内部的content
   */
  setContent(innerHTML: string): void
  /**
   *添加一个输出选项
   * @param id 这儿设置id是为了在导入数据时可能存在被删除的id
   */
  addOutPut(id?: number): void
  /**
   *添加一个输入选项
   * @param id 这儿设置id是为了在导入数据时可能存在被删除的id
   */
  addInPut(id?: number): void
  /**
   *获取一个输出框的位置
   * @param id 输出点的id
   */
  getOutputPostion(id: number): IPostion
  /**
   *获取一个输入框的位置
   * @param id 输出点的id
   */
  getInputPostion(id: number): IPostion
  /**
   *删除节点,同时删除和他连接的对象的连接都删除
   */
  delete(): void
  /**
   *获取作为输出的时候的设置的svg的css名称
   */
  getOutConnectionCssName(): string
  getInConnectionCssName(): string
  /**
   * 连接到某一节点上
   * @param outID 从此节点输出
   * @param inNode 到这个节点
   * @param inID 到这个输入点
   */
  connectToNode(outID: number, inNode: Node<T>, inID: number): void
  /**
   * 更新输出的连接
   * @param outID 从此节点输出
   * @param inNode 到这个节点
   * @param inID 到这个输入点
   */
  updateOutConnect(outID: number, inNode: Node<T>, inID: number): void
  /**
   * 将节点移动到某个位置
   * @param pos 设置节点的位置left.top
   */
  setPostion(pos: IPostion): void
}

export class Node<T> {
  private parentNode: HTMLElement
  private element: HTMLElement
  private inputEle: HTMLElement
  private outputEle: HTMLElement
  private contentEle: HTMLDivElement
  private inputCount: number = 0
  private outputCount: number = 0
  public toNodes: ToNode[] = []
  public inNodes: ToNode[] = []
  readonly ID: number
  public data: T
  /**
   * 临时的svg对象，在鼠标拖动过程中绘制
   */
  public tmepSVG: SVGPathElement | null = null
  public tempOutID: number | null = null
  public zoom = 1
  public canvasNowTranslate = { x: 0, y: 0 }
  constructor(parentNode: HTMLElement, options: NodeOptions<T>) {
    this.parentNode = parentNode
    this.ID = options.id!
    const element = document.createElement('div')
    element.setAttribute('id', `${NodeConst.node}-${options.id!}`)
    element.classList.add(NodeConst.node)

    const inputs = document.createElement('div')
    inputs.setAttribute('class', NodeConst.inputs)

    const output = document.createElement('div')
    output.setAttribute('class', NodeConst.outputs)

    const content = document.createElement('div')
    content.setAttribute('class', NodeConst.content)

    element.appendChild(content)
    element.appendChild(inputs)
    element.appendChild(output)

    this.data = options.data
    this.inputEle = inputs
    this.element = element
    this.outputEle = output
    this.contentEle = content
    this.parentNode.appendChild(element)
    this.setContent(options.HTML)
    options.postion ? this.setPostion(options.postion) : ''
  }

  addOutPut(id?: number) {
    this.outputCount = id === undefined ? this.outputCount + 1 : id
    const outPutEle = document.createElement('div')
    outPutEle.setAttribute('class', NodeConst.outputCssname)
    outPutEle.classList.add(`${NodeConst.output}-${this.outputCount}`)
    this.outputEle.appendChild(outPutEle)
  }

  addInPut(id?: number) {
    this.inputCount = id === undefined ? this.inputCount + 1 : id
    const inPutEle = document.createElement('div')
    inPutEle.setAttribute('class', NodeConst.inputCssname)
    inPutEle.classList.add(`${NodeConst.input}-${this.inputCount}`)
    this.inputEle.appendChild(inPutEle)
  }

  getOutputPostion(id: number) {
    const domRect = this.getOutputEle(id).getBoundingClientRect()
    console.info('domRect.x', domRect.x)
    const canvasDomRect = this.parentNode.getBoundingClientRect()
    console.info('canvasDomRect.x', canvasDomRect.x)
    console.info('this.canvasNowTranslate.x', this.canvasNowTranslate.x)
    const c = {
      x: toInt(domRect.x + domRect.width / 2 - canvasDomRect.x),
      y: toInt(domRect.y + domRect.height / 2 - canvasDomRect.y)
    } as IPostion
    console.info('node:210', c)
    return c
  }
  getInputPostion(id: number) {
    const domRect = this.getInputEle(id).getBoundingClientRect()
    const canvasDomRect = this.parentNode.getBoundingClientRect()
    return {
      x: toInt(domRect.x + domRect.width / 2 - canvasDomRect.x * this.zoom),
      y: toInt(domRect.y + domRect.height / 2 - canvasDomRect.y * this.zoom)
    } as IPostion
  }
  private getInputEle(id: number) {
    return this.element.getElementsByClassName(`${NodeConst.input}-${id}`)[0] as HTMLElement
  }
  private getOutputEle(id: number) {
    return this.element.getElementsByClassName(`${NodeConst.output}-${id}`)[0] as HTMLElement
  }
  delete() {
    this.element.remove()
    this.deleteNodeConnection()
  }
  /**
   *删除所有和本节点相关的连接
   * @param id 目标node的id
   */
  private deleteNodeConnection() {
    const outConnections = this.parentNode.getElementsByClassName(this.getOutConnectionCssName())
    for (const ele of outConnections) {
      ele.remove()
    }
    const inConnections = this.parentNode.getElementsByClassName(this.getInConnectionCssName())
    for (const ele of inConnections) {
      ele.remove()
    }
  }
  getOutConnectionCssName() {
    return `${NodeConst.ToutConnectCssName}-${this.ID}`
  }
  getInConnectionCssName() {
    return `${NodeConst.TinConnectCssName}-${this.ID}`
  }
  setInConnectNode(inNode: ToNode) {
    this.inNodes.push(inNode)
  }
  connectToNode(outID: number, inNode: Node<T>, inID: number) {
    const info = {
      outputID: outID,
      inputID: inID,
      nodeID: inNode.ID
    }
    // TODO 写个deepequal函数
    for (const _info of this.toNodes) {
      if (_info.outputID === info.outputID && _info.nodeID === info.nodeID && _info.inputID === info.inputID) return
    }
    if (this.toNodes.includes(info)) return
    const { connection, path } = this.creatConnectionAndPath()
    connection.setAttribute('class', this.getOutConnectCssName(outID, inNode, inID))
    path.setAttributeNS(null, 'd', this.getOutConnectPath(outID, inNode, inID))
    this.toNodes.push(info)
    inNode.setInConnectNode({
      nodeID: this.ID,
      outputID: outID,
      inputID: inID
    })
  }

  private creatConnectionAndPath() {
    const connection = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttributeNS(null, 'd', '')
    path.setAttribute('class', NodeConst.pathCssName)
    connection.appendChild(path)
    this.parentNode.appendChild(connection)
    return { connection, path }
  }

  getCommonOutConnectCss() {
    return `${NodeConst.connectionCssName} ${this.getOutConnectionCssName()}`
  }
  getOutConnectCssName(outID: number, inNode: Node<T>, inID: number) {
    return `${this.getCommonOutConnectCss()} ${inNode.getInConnectionCssName()} ${NodeConst.TinCss}${outID} ${
      NodeConst.ToutCss
    }${inID}`
  }
  getInConnectCssName(inID: number, outNode: Node<T>, outID: number) {
    return `${NodeConst.connectionCssName} ${outNode.getOutConnectionCssName()} ${this.getInConnectionCssName()} ${
      NodeConst.TinCss
    }${outID} ${NodeConst.ToutCss}${inID}`
  }

  getOutConnectPath(outID: number, inNode: Node<T>, inID: number) {
    const outPostion = this.getOutputPostion(outID)
    console.info('node:302', outPostion)
    const inPostion = inNode.getInputPostion(inID)
    return this.getPath(inPostion, outPostion)
  }
  getInConnectPath(inID: number, outNode: Node<T>, outID: number) {
    const outPostion = outNode.getOutputPostion(outID)
    const inPostion = this.getInputPostion(inID)
    return this.getPath(inPostion, outPostion)
  }

  updateOutConnect(outID: number, inNode: Node<T>, inID: number) {
    const connectEle = this.parentNode.getElementsByClassName(
      this.getOutConnectCssName(outID, inNode, inID)
    )[0] as HTMLElement
    const path = connectEle.children[0]
    path.setAttributeNS(null, 'd', this.getOutConnectPath(outID, inNode, inID))
  }
  updateInConnect(inID: number, outNode: Node<T>, outID: number) {
    const connectEle = this.parentNode.getElementsByClassName(
      this.getInConnectCssName(inID, outNode, outID)
    )[0] as HTMLElement
    const path = connectEle.children[0]
    path.setAttributeNS(null, 'd', this.getInConnectPath(inID, outNode, outID))
  }
  getPath(inPostion: IPostion, outPostion: IPostion) {
    // 这个是 控制点的倍率，以中心点区分，上下各拖动整体的多少
    const RATE = 0.7
    const CPointX1 = outPostion.x + Math.abs(inPostion.x - outPostion.x) * RATE
    const CPointX2 = inPostion.x - Math.abs(inPostion.x - outPostion.x) * RATE

    return `M ${outPostion.x} ${outPostion.y} C ${toInt(CPointX1)} ${toInt(outPostion.y)} ${toInt(CPointX2)} ${toInt(
      inPostion.y
    )} ${inPostion.x} ${inPostion.y}`
  }

  setContent(innerHTML: string | Element) {
    console.info('node:311', innerHTML)
    if (typeof innerHTML === 'string') {
      this.contentEle.innerHTML = innerHTML
    } else {
      this.contentEle.appendChild(innerHTML)
    }
  }
  /**
   * 设置node的位置
   * @param pos
   */
  setPostion(pos: IPostion) {
    this.element.style.left = `${pos.x}px`
    this.element.style.top = `${pos.y}px`
  }
  getNodePostion(): IPostion {
    const domRect = this.element.getBoundingClientRect()
    return { x: toInt(domRect.x), y: toInt(domRect.y) }
  }
  /**
   * 绘制临时path
   * @param postion
   */
  drawTempConnect(postion: IPostion, outID: number) {
    if (this.tmepSVG === null) {
      const { connection, path } = this.creatConnectionAndPath()
      connection.setAttribute('class', this.getCommonOutConnectCss())
      this.tmepSVG = path
    }
    const outPostion = this.getOutputPostion(outID)
    this.tmepSVG.setAttributeNS(null, 'd', this.getPath(postion, outPostion))
    this.tempOutID = outID
    console.info('node:362', 'drawTempConnect')
  }

  clearTempConnection() {
    console.info('node:365', this.tmepSVG, this.tempOutID)
    this.tmepSVG?.parentElement?.remove()
    this.tmepSVG = null
    this.tempOutID = null
  }
}
