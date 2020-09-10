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
    </Form>
  </div>
</template>

<script>
import { ProxyType } from '@/lib/chromePorxy'
export default {
  name: 'Home',
  data() {
    return {
      formItem: { proxyType: 'null', proxy: '' },
      ProxyType: ProxyType,
      ProxyTypeMap: {
        无代理: ProxyType.noneProxy,
        系统代理: ProxyType.system,
        自动代理: ProxyType.auto,
        手动代理: ProxyType.manual
      }
    }
  }
}
</script>
<style>
.home {
  margin: 10px;
}
</style>
