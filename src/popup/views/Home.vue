<template>
  <div class="home">
    <Form :model="formItem" :label-width="80">
      <FormItem label="代理类型:">
        <Select v-model="formItem.proxyType">
          <Option v-for="(value, name, index) in ProxyTypeMap" :value="value" :key="index"> {{ name }}</Option>
        </Select>
      </FormItem>
      <FormItem label="代理设置:">
        <Input v-model="formItem.proxy" :disabled="formItem.proxyType !== ProxyType.manual" placeholder="" />
      </FormItem>
      <Button @click="changeProxy">代理设置</Button>
    </Form>
  </div>
</template>

<script>
import { ProxyType, ProxyMsg, ChromeProxySet } from '@/lib/chromePorxy'
export default {
  name: 'Home',
  data() {
    const cproxy = new ChromeProxySet(this.$msgSender)
    return {
      formItem: { proxyType: 'null', proxy: '' },
      ProxyType: ProxyType,
      cproxy: cproxy,
      ProxyTypeMap: {
        无代理: ProxyType.noneProxy,
        系统代理: ProxyType.system,
        自动代理: ProxyType.auto,
        手动代理: ProxyType.manual
      }
    }
  },
  methods: {
    changeProxy() {
      this.cproxy.setPorxy({
        type: this.formItem.proxyType,
        proxy: this.formItem.proxy
      })
    }
  }
}
</script>
<style>
.home {
  margin: 10px;
}
</style>
