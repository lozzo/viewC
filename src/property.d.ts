import Vue from 'vue'
import { MessageSender } from './lib/messages'

declare module 'vue/types/vue' {
  // 3. 声明为 Vue 补充的东西
  interface Vue {
    $msgSender: MessageSender<any>
  }
}
