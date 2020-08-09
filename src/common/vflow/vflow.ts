import { EventEmitter } from '../event'
import { Node, IPostion, NodeOptions, NodeConst } from './node'

const toInt = (x: any) => {
  return parseInt(x.toString())
}
/**
 * <div id="vlfow">
        <div class="inputs">
          <div class="input-1"></div>
        </div>
        <div class='content'></div>
        <div class="outputs">
          <div class="output-1"></div>
        </div>
    </div>
    <div id='node-2'>
        <div class="inputs"></div>
        <div class='content'></div>
        <div class="outputs"></div>
    </div>
    ...
    从节点1的输出点2连接到节点2的输入点3
    <svg class="out-node-1 in-node-2 out-2 in-3" c>
      <path></path>
    </svg>
    ...
</div>
 */

enum FlowConst {
  containerCss = 'vflow-container',
  CssCanvas = 'flow-canvas',
  SelectedFlag = 'selected'
}

interface FlowEvent<T> {
  nodeAdd: Node<T>
  nodeDelete: Node<T>
  nodeConnect: {
    outNode: Node<T>
    inNode: Node<T>
    outID: number
    inID: number
  }
}

export interface FlowNode<T> {
  addNode(options: NodeOptions<T>): Node<T>
  deleteNode(id: number): void
  on<K extends keyof FlowEvent<T>>(type: K, listener: (this: FlowNode<T>, ev: FlowEvent<T>[K]) => any): this
  // 开发时好用，自动提示
  emit<K extends keyof FlowEvent<T>>(type: K, ev: FlowEvent<T>[K]): boolean
  /**
   * 连接两个节点
   * @param outNode 从这个节点输出
   * @param inNode 到这个节点输入
   * @param outID 从节点上outID处输出
   * @param inID 输入到此节点
   */
  connectNodes(outNode: Node<T>, outID: number, inNode: Node<T>, inID: number): void
}

export class FlowNode<T> extends EventEmitter {
  private zoom: number = 1
  public zoomMax = 1.6
  public zoomMin = 0.4
  private container: HTMLElement
  private canvasContainer: HTMLElement
  private nodeID: number = 0
  private nodes: Map<number, Node<T>> = new Map()
  /**
   * 当点击时，被选中的对象
   */
  private selectedEle: HTMLElement | null = null
  private selectedType:
    | FlowConst.CssCanvas
    | FlowConst.SelectedFlag
    | NodeConst.node
    | NodeConst.inputCssname
    | NodeConst.outputCssname
    | NodeConst.connectionCssName
    | null = null
  /**
   * 当鼠标点击的时候，的位置，这个位置记录是为了在拖拽的
   * 时候不让被拖拽的ele的(0,0)位置瞬移到鼠标上
   */
  private clickPostion: IPostion | null = null
  /**
   * 当移动画板时，记录鼠标点击时的初始位置，计算移动多少
   */
  private canvasMoveStartPostion: IPostion | null = null
  private canvasNowTranslate: IPostion = { x: 0, y: 0 }
  private drawConnectionNodeID: number | null = null
  constructor(container: HTMLElement) {
    super()
    this.container = container
    container.classList.add(FlowConst.containerCss)
    const canvas = document.createElement('div')
    canvas.classList.add(FlowConst.CssCanvas)
    this.canvasContainer = canvas
    this.container.appendChild(canvas)

    this.container.addEventListener('mousedown', this.click.bind(this))
    this.container.addEventListener('mousemove', this.mouseMove.bind(this))
    this.container.addEventListener('mouseup', this.mouseUP.bind(this))

    this.container.addEventListener('wheel', this.zoomEnter.bind(this))
  }
  addNode(options: NodeOptions<T>) {
    this.nodeID = options.id ? options.id : this.nodeID
    options.id = this.nodeID
    const node = new Node<T>(this.canvasContainer, options, this.zoom)
    this.nodes.set(this.nodeID, node)
    this.nodeID += 1
    this.emit('nodeAdd', node)
    return node
  }
  deleteNode(id: number) {
    const node = this.nodes.get(id)
    node?.delete()
    if (node) this.emit('nodeDelete', node)
    this.nodes.delete(id)
  }
  connectNodes(outNode: Node<T>, outID: number, inNode: Node<T>, inID: number) {
    const svgNodeClass = this.getConnectNodeCss(outNode, inNode)
    const eleC = this.canvasContainer.getElementsByClassName(svgNodeClass)
    // 如果已经连接了，就不让在连接
    if (eleC.length === 1) return
    this.emit('nodeConnect', {
      outNode,
      inNode,
      outID,
      inID
    })
    outNode.connectToNode(outID, inNode, inID)
  }
  private getConnectNodeCss(outNode: Node<T>, inNode: Node<T>) {
    return `${NodeConst.connectionCssName} ${outNode.getOutConnectionCssName()} ${inNode.getInConnectionCssName()}`
  }

  /**
   * 当点击画板时，标记选定的对象和状态
   * @param event 鼠标事件
   */
  private click(event: MouseEvent) {
    this.clickPostion = {
      x: event.x,
      y: event.y
    }
    let ele = event.target as HTMLElement
    const contentSelector = '.' + NodeConst.content
    if (ele.closest(contentSelector) !== null) {
      ele = ele.closest(contentSelector)! as HTMLElement
    }
    const cssName = ele.classList ? ele.classList[0] : ''
    switch (cssName) {
      case FlowConst.SelectedFlag:
        break
      case FlowConst.CssCanvas:
        this.selectedType = FlowConst.CssCanvas
        this.canvasMoveStartPostion = {
          x: event.x,
          y: event.y
        }
        break
      case FlowConst.containerCss:
        this.selectedType = FlowConst.CssCanvas
        this.canvasMoveStartPostion = {
          x: event.x,
          y: event.y
        }
        break
      case NodeConst.node:
        this.selectedEle = ele
        this.selectedType = NodeConst.node
        this.calcBL(event)
        break
      case NodeConst.content:
        this.selectedType = NodeConst.node
        this.selectedEle = ele.parentElement
        this.calcBL(event)
        break
      case NodeConst.inputCssname:
        this.selectedEle = ele
        this.selectedType = NodeConst.inputCssname
        break
      case NodeConst.outputCssname:
        this.selectedType = NodeConst.outputCssname
        this.selectedEle = event.target as HTMLElement
        break
      case NodeConst.inputs || NodeConst.outputs:
        this.selectedEle = ele.parentElement
        this.selectedType = NodeConst.node
        break
      case NodeConst.connectionCssName || NodeConst.pathCssName:
        this.selectedType = NodeConst.connectionCssName
        this.selectedEle = cssName === NodeConst.connectionCssName ? ele : ele.parentElement
        break
      default:
        break
    }
  }

  private mouseMove(event: MouseEvent) {
    if (!this.selectedType) return
    event.preventDefault()
    switch (this.selectedType) {
      case NodeConst.node:
        this.nodeMove(event)
        break
      case FlowConst.CssCanvas:
        this.canvasMove(event)
        break
      case NodeConst.outputCssname:
        this.drawConnect(event)
        break
    }
  }
  private nodeMove(event: MouseEvent) {
    const nodeID = parseInt(this.selectedEle?.id.split('-')[1]!)
    const node = this.nodes.get(nodeID)!
    const postion = this.getRelativePostionInNode(event)
    console.info('dlog-vflow:224', { x: event.x, y: event.y })
    console.info('dlog-vflow:225', postion)
    node.setPostion(postion)

    const inNodes = node.inNodes
    for (const connectInfo of inNodes) {
      const _inNode = this.nodes.get(connectInfo.nodeID)
      if (_inNode) {
        node.updateInConnect(connectInfo.inputID, _inNode, connectInfo.outputID)
      }
    }

    const outNodes = node.toNodes
    for (const connectInfo of outNodes) {
      const _outNode = this.nodes.get(connectInfo.nodeID)
      if (_outNode) {
        node.updateOutConnect(connectInfo.outputID, _outNode, connectInfo.inputID)
      }
    }
  }
  /**
   * 移动画板
   * @param event
   */
  private canvasMove(event: MouseEvent) {
    const x = this.canvasNowTranslate.x + event.x - this.canvasMoveStartPostion?.x!
    const y = this.canvasNowTranslate.y + event.y - this.canvasMoveStartPostion?.y!
    this.canvasMoveStartPostion = { x: event.x, y: event.y }
    this.canvasNowTranslate = { x, y }
    this.canvasContainer.style.transform = 'translate(' + x + 'px, ' + y + 'px) scale(' + this.zoom + ')'
  }
  /**
   * 计算点击时，鼠标在被选择的ele内部的相对位置
   */
  private calcBL(event: MouseEvent) {
    const canvasDomRect = this.canvasContainer.getBoundingClientRect()
    const elePosX = this.selectedEle!.offsetLeft
    const elePosY = this.selectedEle!.offsetTop
    const blX = (event.x - canvasDomRect.x) / this.zoom - elePosX
    const blY = (event.y - canvasDomRect.y) / this.zoom - elePosY
    this.clickPostion = { x: blX, y: blY }
  }
  /**
   * 鼠标在Node内的相对位置
   * @param event 鼠标事件
   */
  private getRelativePostionInNode(event: MouseEvent): IPostion {
    const canvasDomRect = this.canvasContainer.getBoundingClientRect()
    return {
      x: toInt((event.x - canvasDomRect.x) / this.zoom - this.clickPostion?.x!),
      y: toInt((event.y - canvasDomRect.y) / this.zoom - this.clickPostion?.y!)
    }
  }

  /**
   * 获取鼠标在canvas中的相对位置
   * @param event
   */
  private getRelativePostionInCanvas(event: MouseEvent): IPostion {
    const canvasDomRect = this.canvasContainer.getBoundingClientRect()
    return { x: toInt((event.x - canvasDomRect.x) / this.zoom), y: toInt((event.y - canvasDomRect.y) / this.zoom) }
  }

  private mouseUP(event: MouseEvent) {
    if (this.drawConnectionNodeID !== null) {
      this.overDrawConnect(event)
    }
    this.selectedEle = null
    this.selectedType = null
    this.clickPostion = null
    this.canvasMoveStartPostion = null
    this.drawConnectionNodeID = null
  }
  /**
   * 动态的画连接线
   * @param event
   */
  private drawConnect(event: MouseEvent) {
    const outID = toInt(this.selectedEle!.classList[1].split('-')[1])
    const nodeEle = this.selectedEle!.closest('.' + NodeConst.node)
    if (!nodeEle) return
    const nodeID = toInt(nodeEle.id.split('-')[1])
    this.drawConnectionNodeID = nodeID
    const node = this.nodes.get(nodeID)!
    node.drawTempConnect(this.getRelativePostionInCanvas(event), outID)
  }
  /**
   * 结束drawConnect
   * @param event
   */
  private overDrawConnect(event: MouseEvent) {
    const ele = event.target as HTMLElement
    const outNode = this.nodes.get(this.drawConnectionNodeID!)!
    if (NodeConst.inputCssname !== ele.classList[0]) {
      outNode.clearTempConnection()
      return
    }
    const inNode = this.nodes.get(toInt(ele.closest('.' + NodeConst.node)?.id.split('-')[1]))!
    const inID = toInt(ele.classList[1].split('-')[1])
    outNode.connectToNode(outNode.tempOutID!, inNode, inID)
    outNode.clearTempConnection()
  }
  private zoomRefresh() {
    this.canvasContainer.style.transform =
      'translate(' + this.canvasNowTranslate.x + 'px, ' + this.canvasNowTranslate.y + 'px) scale(' + this.zoom + ')'
    this.nodes.forEach((node) => {
      node.zoom = this.zoom
    })
  }
  private zoomIn() {
    if (this.zoom < this.zoomMax) {
      this.zoom += 0.1
      this.zoomRefresh()
    }
  }

  private zoomOut() {
    if (this.zoom > this.zoomMin) {
      this.zoom -= 0.1
      this.zoomRefresh()
    }
  }
  private zoomReset() {
    this.zoom = 1
    this.zoomRefresh()
  }
  private zoomEnter(event: WheelEvent) {
    if (event.ctrlKey) {
      event.preventDefault()
      if (event.deltaY > 0) {
        this.zoomOut()
      } else {
        this.zoomIn()
      }
    }
  }
}
