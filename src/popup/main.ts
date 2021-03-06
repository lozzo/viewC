import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import 'view-design/dist/styles/iview.css'
import ViewUI from 'view-design'
import { colorInfoLog } from '@/lib/utils'
import { getMsgSender } from '@/lib/messages'
;(async () => {
  Vue.use(ViewUI, { size: 'small' })
  const msgSender = await getMsgSender('popupJs')
  Vue.prototype.$msgSender = msgSender
  Vue.config.productionTip = false
  new Vue({
    router,
    store,
    render: (h) => h(App)
  }).$mount('#app')

  colorInfoLog('info', 'options', 'xxx', 'viewc')
})()
