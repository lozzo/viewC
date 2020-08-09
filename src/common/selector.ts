/**
 * 这儿是csspath选择器,这个时一个注入页面的脚本
 * 当鼠标经过某一个元素时，这个元素就会高亮，其子元素也会随之高亮，并且颜色叠加
 * css 瞎鸡儿写的，Css太兰了
 */
// import { injectSendMessage } from './message';
// eslint-disable-next-line no-unused-vars

import { EventEmitter } from './event'
import { finder } from '@medv/finder'
import { colorInfoLog } from './utils'

// TODO 点击多个元素，如果是同一类，则所有改类型的元素都选中
export class Selector extends EventEmitter {
  private moveableDivPostionRecord: { left: string; top: string }
  private SPCNAME: string = 'sdhiusnSKDQWdqDQwANknsfnalk' // 给一个特殊的前缀，用于区分注入的css和本身的css
  private VISITENCLASSNAME: string
  private SELECTEDCLASSNAME: string
  private CSSMESSAGECLASSNAME: string
  private CSSMESSAGESHOW: string
  private CLICKBUTTONCLASS: string
  private NOSELECTCLASS: string
  private SHOWCSSDIV: HTMLDivElement
  private style: HTMLStyleElement
  private checkButton: HTMLButtonElement
  private addVisitedFunc: (e: MouseEvent) => void
  private removeVisitedFunc: (e: MouseEvent) => void
  // private elementClickFunc: (e: MouseEvent) => void
  private keydownFunc: (e: KeyboardEvent) => void
  private hoverElement: Element | null = null
  constructor() {
    super()
    this.moveableDivPostionRecord = { left: '', top: '' }
    this.VISITENCLASSNAME = this.SPCNAME + 'viewc-extention-hx-visited'
    this.SELECTEDCLASSNAME = this.SPCNAME + 'select-viewc-extention-class'
    this.CSSMESSAGECLASSNAME = this.SPCNAME + 'viewc-extention-csspath'
    this.CSSMESSAGESHOW = this.SPCNAME + 'viewc-extention-csspath-show'
    this.CLICKBUTTONCLASS = this.SPCNAME + 'viewc-extention-click-button'
    this.NOSELECTCLASS = this.SPCNAME + 'viewc-extention-no-select' // 这个用来占位

    this.SHOWCSSDIV = document.createElement('div')
    this.style = document.createElement('style')
    this.style.innerHTML = `
              .${this.VISITENCLASSNAME} * {
                background: rgba(0, 213, 0, 0.2) !important;
              }
              .${this.VISITENCLASSNAME} {
                background: rgba(0, 213, 0, 0.2) !important;
                outline: rgb(0, 199, 0) solid 2px !important;
                }

              .${this.SELECTEDCLASSNAME} * {
                  background: rgba(177, 0, 0, 0.2) !important;
                }
              .${this.SELECTEDCLASSNAME} {
                background: rgba(177,0,0,0.2) !important;
                outline: rgb(140, 0, 0) solid 2px !important;
                }


              .${this.CSSMESSAGECLASSNAME} {
                position: fixed;
                font-size: 10px;
                left: 10px;
                min-height: 20px;
                bottom: 10px;
                box-shadow: 0 2px 3px 0 rgba(0, 0, 0, 0.25);
                box-sizing: content-box !important;
                padding: 8px 10px;
                display: true;
                background-color: #fff !important;
                border: 1px solid #3eaf7c;
                z-index: 999999;
            }
            
              .${this.CSSMESSAGECLASSNAME}.${this.CSSMESSAGESHOW} {
                  display: inline-block;
              }

              .${this.CLICKBUTTONCLASS} {
                background-color: #4CAF50; /* Green */
                border: none;
                color: white;
                text-align: center;
                text-decoration: none;
                display: inline-block;
                -webkit-transition-duration: 0.4s; /* Safari */
                transition-duration: 0.4s;
                cursor: pointer;
                background-color: white; 
                color: black; 
                border: 2px solid #008CBA;
              }
              .${this.CLICKBUTTONCLASS}:hover {
                background-color: #008CBA;
                color: white;
              }
            `
    document.head.appendChild(this.style)
    document.body.appendChild(this.SHOWCSSDIV)

    this.checkButton = document.createElement('button')
    this.checkButton.innerText = 'ok'

    this.addVisitedFunc = this.addVisitedClass.bind(this)
    this.removeVisitedFunc = this.removeVisitedClass.bind(this)
    // this.elementClickFunc = this.elementClickHandle.bind(this)
    this.keydownFunc = this.keydownEventHandle.bind(this)

    this.checkButton.onclick = this.overSelect.bind(this)
  }

  /**
   *使一个元素可移动
   * @param {Element} el 需要移动的元素
   * @param {any} record 一个存储
   */
  moveableDiv(el: HTMLDivElement) {
    let x = 0
    let y = 0
    let l = 0
    let t = 0
    let isDown = false
    this.moveableDivPostionRecord = {
      left: el.style.left,
      top: el.style.top
    }
    el.onmousedown = (e: MouseEvent) => {
      // 获取x坐标和y坐标
      x = e.clientX
      y = e.clientY

      // 获取左部和顶部的偏移量
      l = el.offsetLeft
      t = el.offsetTop
      // 开关打开
      isDown = true
      // 设置样式
      el.style.cursor = 'move'
    }
    // 鼠标移动
    window.onmousemove = (e: MouseEvent) => {
      if (isDown === false) {
        return
      }
      // 获取x和y
      const nx = e.clientX
      const ny = e.clientY
      // 计算移动后的左偏移量和顶部的偏移量
      const nl = nx - (x - l)
      const nt = ny - (y - t)

      el.style.left = nl + 'px'
      el.style.top = nt + 'px'
    }
    // 鼠标抬起事件
    el.onmouseup = () => {
      // 开关关闭
      isDown = false
      el.style.cursor = 'default'
    }
  }

  moveableReset(el: HTMLDivElement) {
    el.style.left = this.moveableDivPostionRecord.left
    el.style.top = this.moveableDivPostionRecord.top
  }

  startSelect() {
    this.SHOWCSSDIV.className = this.CSSMESSAGECLASSNAME
    this.SHOWCSSDIV.innerText = '点击元素选择'
    this.checkButton.classList.toggle(this.CLICKBUTTONCLASS, true)
    this.SHOWCSSDIV.classList.toggle(this.CSSMESSAGESHOW, true)
    // 使确认框可以移动，免得挡住部分元素无法选取
    this.moveableDiv(this.SHOWCSSDIV)
    document.addEventListener('mouseover', this.addVisitedFunc)
    document.addEventListener('mouseout', this.removeVisitedFunc)
    // document.addEventListener('click', this.elementClickFunc)
    document.addEventListener('keydown', this.keydownFunc)
    // document.onkeydown = this.keydownFunc
    // document.addEventListener("keydown",)
  }

  keydownEventHandle(e: KeyboardEvent) {
    colorInfoLog('Selector', '键盘事件', e)
    if (!e.shiftKey) return
    switch (e.code) {
      case 'KeyS': {
        this.selectElement(this.hoverElement!)
      }
    }
  }

  overSelect() {
    console.log('over csss')
    this.moveableReset(this.SHOWCSSDIV)
    this.SHOWCSSDIV.className = ''
    this.removeChildClass(document.body, this.SELECTEDCLASSNAME)
    this.removeChildClass(document.body, this.VISITENCLASSNAME)
    document.removeEventListener('mouseover', this.addVisitedFunc)
    document.removeEventListener('mouseout', this.removeVisitedFunc)
    // document.removeEventListener('click', this.elementClickFunc)
    document.removeEventListener('keydown', this.keydownFunc)
    this.realse()
  }

  addVisitedClass(e: MouseEvent) {
    try {
      const target = e.target
      if (this.isSelectorInjectElement(target as Element)) return
      this.addClassName(target as Element, this.VISITENCLASSNAME)
      this.hoverElement = target as Element
    } catch (e) {
      console.log(e)
    }
  }

  removeVisitedClass(e: MouseEvent) {
    try {
      if (this.isSelectorInjectElement(e.target as Element)) return
      this.removeClassName(e.target as Element, this.VISITENCLASSNAME)
    } catch (e) {
      console.log(e)
    }
  }

  isSelectorInjectElement(el: Element) {
    const className = el.className
    if (className.includes(this.CSSMESSAGESHOW)) return true
    if (className.includes(this.CLICKBUTTONCLASS)) return true
    if (className.includes(this.CSSMESSAGECLASSNAME)) return true
    if (className.includes(this.NOSELECTCLASS)) return true
  }

  selectElement(el: Element) {
    try {
      if (this.isSelectorInjectElement(el)) return
      if (el.className.includes(this.SELECTEDCLASSNAME)) {
        this.removeClassName(el, this.SELECTEDCLASSNAME)
        return
      }
      this.removePrenteClass(el, this.SELECTEDCLASSNAME)
      this.removeChildClass(el, this.SELECTEDCLASSNAME)
      this.removeClassName(el, this.VISITENCLASSNAME)
      this.addClassName(el, this.SELECTEDCLASSNAME)
      const _csspath = this.getCssPath(el)
      this.SHOWCSSDIV.innerHTML = `获取的CSSPATH为: <b class='${this.NOSELECTCLASS}'><font color='red' class='${this.NOSELECTCLASS}'>${_csspath}</font></b>   `
      this.SHOWCSSDIV.appendChild(this.checkButton)
      this.emit('Csspath', _csspath)
    } catch (e) {
      colorInfoLog('Selector', 'error', e)
    }
  }
  elementClickHandle(e: MouseEvent) {
    try {
      const el = e.target as HTMLElement
      this.selectElement(el)
    } catch (e) {
      console.log(e)
    }
  }

  getCssPath(el: Element) {
    return finder(el, {
      className: (name) => {
        // 排除注入页面的csspath
        return name.indexOf(this.SPCNAME) === -1
      }
    })
    // if (!(el instanceof Element)) return;
    // const path = [];
    // while (el.nodeType === Node.ELEMENT_NODE) {
    //   let selector = el.nodeName.toLowerCase();
    //   if (el.id) {
    //     selector += '#' + el.id;
    //     path.unshift(selector);
    //     break;
    //   } else {
    //     let sib = el;
    //     let nth = 1;
    //     while ((sib = sib.previousElementSibling)) {
    //       if (sib.nodeName.toLowerCase() === selector) nth++;
    //     }
    //     if (nth !== 1) selector += ':nth-of-type(' + nth + ')';
    //   }
    //   path.unshift(selector);
    //   el = el.parentNode;
    // }
    // return path.join(' > ');
  }

  removeClassName(el: Element, name: string) {
    if (!el) return
    el.classList.toggle(name, false)
  }

  addClassName(el: Element, name: string) {
    if (!el) return
    if (el !== document.documentElement) {
      el.classList.toggle(name, true)
    }
  }

  removePrenteClass(el: Element, name: string) {
    if (!el) return
    const _el = el.parentNode
    this.removeClassName(_el as Element, name)
    if (_el !== document.body) {
      this.removePrenteClass(_el as Element, name)
    }
  }

  removeChildClass(el: Element, name: string) {
    if (!el) return
    for (const subEl of el.children) {
      this.removeClassName(subEl, name)
      this.removeChildClass(subEl, name)
    }
  }

  realse() {
    try {
      this.removeAllListener('Csspath')
      document.head.removeChild(this.style)
      document.body.removeChild(this.SHOWCSSDIV)
    } catch (e) {
      console.debug(e)
    }
  }
}
