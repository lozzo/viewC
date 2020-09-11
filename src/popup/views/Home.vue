<template>
  <div class="home">
    <div>
      <Form :model="formItem" :label-width="80">
        <FormItem label="代理类型:">
          <Select v-model="formItem.proxyType">
            <Option v-for="(value, name, index) in ProxyTypeMap" :value="value" :key="index"> {{ name }}</Option>
          </Select>
        </FormItem>
        <FormItem label="代理设置:">
          <Input v-model="formItem.proxy" :disabled="formItem.proxyType !== ProxyType.manual" placeholder="" />
        </FormItem>
        <Button @click="changeProxy" :loading="ProxySetButtonLoading">代理设置</Button>
      </Form>
    </div>
    <div>
      <!-- {{ currentProxy }} -->
    </div>
  </div>
</template>

<script>
import { ProxyType, ProxyMsg, ChromeProxySet } from '@/lib/chromePorxy'
export default {
  name: 'Home',
  data() {
    const cproxy = new ChromeProxySet(this.$msgSender)
    return {
      formItem: { proxyType: ProxyType.noneProxy, proxy: '' },
      ProxyType: ProxyType,
      cproxy: cproxy,
      ProxyTypeMap: {
        无代理: ProxyType.noneProxy,
        系统代理: ProxyType.system,
        自动代理: ProxyType.auto,
        手动代理: ProxyType.manual
      },
      ProxySetButtonLoading: false,
      currentProxy: undefined
    }
  },
  methods: {
    async changeProxy() {
      this.ProxySetButtonLoading = true
      const ok = await this.cproxy.setPorxy({
        type: this.formItem.proxyType,
        proxy: this.formItem.proxy
      })
      if (!ok.ok) {
        alert(ok.msg)
      }
      await this.getCurrentProxy()
      this.ProxySetButtonLoading = false
    },
    async getCurrentProxy() {
      this.ProxySetButtonLoading = true
      this.currentProxy = await this.cproxy.getProxyInfo()
      this.formItem.proxyType = this.currentProxy.proxyType
      this.formItem.proxy =
        this.currentProxy.proxyType === ProxyType.manual || this.currentProxy.proxyType === ProxyType.auto
          ? `${this.currentProxy.scheme}://${
              this.currentProxy.auth ? this.currentProxy.auth.user + ':' + this.currentProxy.auth.password + '@' : ''
            }${this.currentProxy.host}:${this.currentProxy.port}`
          : this.currentProxy.proxyType === ProxyType.noneProxy
          ? '直连'
          : '系统代理'
      this.ProxySetButtonLoading = false
    }
  },
  mounted() {
    this.getCurrentProxy()
  }
}
</script>
<style>
.home {
  margin: 10px;
}
</style>
