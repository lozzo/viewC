import { EventEmitter } from '../event'
import { Node, IPostion, NodeOptions, NodeConst, ToNode } from './node'

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

export interface VFlow<T> {
  addNode(options: NodeOptions<T>): Node<T>
  deleteNode(id: number): void
  on<K extends keyof FlowEvent<T>>(type: K, listener: (this: VFlow<T>, ev: FlowEvent<T>[K]) => any): this
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

export class VFlow<T> extends EventEmitter {
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
  private selectedEle?: HTMLElement
  private selectedType?:
    | FlowConst.CssCanvas
    | FlowConst.SelectedFlag
    | NodeConst.node
    | NodeConst.inputCssname
    | NodeConst.outputCssname
    | NodeConst.connectionCssName

  /**
   * 当鼠标点击的时候，的位置，这个位置记录是为了在拖拽的
   * 时候不让被拖拽的ele的(0,0)位置瞬移到鼠标上
   */
  private clickPostion?: IPostion

  /**
   * 当移动画板时，记录鼠标点击时的初始位置，计算移动多少
   */
  private canvasMoveStartPostion?: IPostion
  private canvasNowTranslate: IPostion = { x: 0, y: 0 }
  private drawConnectionNodeID?: number
  constructor(container: HTMLElement) {
    super()
    this.container = container
    this.container.tabIndex = 0
    container.classList.add(FlowConst.containerCss)
    const canvas = document.createElement('div')
    canvas.classList.add(FlowConst.CssCanvas)
    this.canvasContainer = canvas
    this.container.appendChild(canvas)

    this.container.addEventListener('mousedown', this.click.bind(this))
    this.container.addEventListener('mousemove', this.mouseMove.bind(this))
    this.container.addEventListener('mouseup', this.mouseUP.bind(this))

    this.container.addEventListener('wheel', this.zoomEnter.bind(this))

    this.container.addEventListener('keydown', this.keyEventHandle.bind(this))
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
    console.info('dlog-vflow:157', cssName)
    this.removeSelectFlag()
    switch (cssName) {
      case FlowConst.CssCanvas:
        this.selectedType = FlowConst.CssCanvas
        this.canvasMoveStartPostion = {
          x: event.x,
          y: event.y
        }
        this.container.classList.add(FlowConst.SelectedFlag)
        break
      case FlowConst.containerCss:
        this.selectedType = FlowConst.CssCanvas
        this.canvasMoveStartPostion = {
          x: event.x,
          y: event.y
        }
        this.container.classList.add(FlowConst.SelectedFlag)
        break
      case NodeConst.node:
        this.selectedEle = ele
        this.selectedType = NodeConst.node
        this.calcBL(event)
        break
      case NodeConst.content:
        this.selectedType = NodeConst.node
        this.selectedEle = ele.parentElement!
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
      // case NodeConst.inputs || NodeConst.outputs:
      //   this.selectedEle = ele.parentElement
      //   this.selectedType = NodeConst.node
      //   break
      case NodeConst.pathCssName:
        this.selectedType = NodeConst.connectionCssName
        this.selectedEle = ele.parentElement!
        break
      default:
        break
    }
    if (this.selectedEle !== undefined) {
      this.selectedEle.classList.add(FlowConst.SelectedFlag)
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
    if (this.drawConnectionNodeID !== undefined) {
      this.overDrawConnect(event)
    }
    this.selectedEle = undefined
    this.selectedType = undefined
    this.clickPostion = undefined
    this.canvasMoveStartPostion = undefined
    this.drawConnectionNodeID = undefined
    this.container.classList.remove(FlowConst.SelectedFlag)
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

  /**
   * 删除selected这个css标志，而不是删除selected的ele对象
   */
  private removeSelectFlag() {
    const selectedEleC = this.canvasContainer.querySelectorAll('.' + FlowConst.SelectedFlag)
    for (const ele of selectedEleC) {
      ele.classList.remove(FlowConst.SelectedFlag)
    }
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
      this.zoom += 0.01
      this.zoomRefresh()
    }
  }

  private zoomOut() {
    if (this.zoom > this.zoomMin) {
      this.zoom -= 0.01
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

  private keyEventHandle(event: KeyboardEvent) {
    // console.info('dlog-vflow:377', event)
    if (event.key === 'Delete' || (event.key === 'Backspace' && event.metaKey)) {
      this.keyDelete()
    }
  }

  /**
   * 删除事件
   */
  private keyDelete() {
    const selectedEle = this.container.querySelector('.' + FlowConst.SelectedFlag)
    if (selectedEle === null) return
    console.info('dlog-vflow:389', selectedEle)
    const classList = selectedEle.classList
    const cssName = classList[0]

    let nodoID
    let outID
    let outNode
    let inNode
    let inID

    if (cssName === NodeConst.node) {
      nodoID = toInt(selectedEle.id.split('-')[1])
      this.deleteNode(nodoID)
    }

    if (cssName === NodeConst.outputCssname) {
      outID = toInt(classList[1].split('-')[1])
      nodoID = toInt(selectedEle.parentElement?.parentElement?.id.split('-')[1])
      const node = this.nodes.get(this.nodeID)!
    }

    if (cssName === NodeConst.connectionCssName) {
      outNode = this.nodes.get(toInt(classList[1].split(NodeConst.ToutConnectCssName + '-')[1]))
      inNode = this.nodes.get(toInt(classList[2].split(NodeConst.TinConnectCssName + '-')[1]))!
      inID = toInt(classList[3].split(NodeConst.TinCss)[1])
      outID = toInt(classList[4].split(NodeConst.ToutCss)[1])
      outNode?.deleteConnectionToNode(outID, inNode, inID)
    }
  }
}
