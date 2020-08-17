<template>
  <div class="home">
    <!-- <img alt="Vue logo" src="../assets/logo.png" /> -->
    <!-- <div class="node"> -->
    <!-- <startNode></startNode> -->
    <!-- </div> -->
    <!-- <HelloWorld msg="Welcome to Your Vue.js App" /> -->
    <div id="tt"></div>
  </div>
</template>

<script>
// @ is an alias to /src
import Vue from 'vue'
import { VFlow } from '../../common/vflow/vflow'
import styleDrawflow from '../../common/vflow/vflow.css'
import startNode from '../components/flowNode/startNode.vue'

export default {
  name: 'Home',
  components: {
    // startNode
    // HelloWorld
  },
  mounted() {
    const p = new Vue({
      render: (h) =>
        h(startNode, {
          props: undefined
        })
    }).$mount()
    const html = p.$el
    // console.info('node:322', wrapper.$el)
    const container = document.getElementById('tt')
    const vflow = new VFlow(container)
    const node1 = vflow.addNode({ HTML: html, postion: { x: 0, y: 0 }, data: {} })
    const node2 = vflow.addNode({
      HTML: html.cloneNode(true),
      postion: { x: 600, y: 250 },
      data: {}
    })
    const node3 = vflow.addNode({ HTML: html.cloneNode(true), postion: { x: 300, y: 650 }, data: {} })
    const node4 = vflow.addNode({ HTML: html.cloneNode(true), postion: { x: 300, y: 0 }, data: {} })
    // debugger
    node1.addOutPut()
    node1.addOutPut()
    node2.addInPut()
    node2.addInPut()
    node2.addOutPut()
    node3.addInPut()
    node4.addOutPut()
    // node1.connectToNode(2, node2, 1)
    node1.connectToNode(1, node2, 2)
    node2.connectToNode(1, node3, 1)
    node4.connectToNode(1, node3, 1)
  }
}
</script>
