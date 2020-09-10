<template>
  <div class="hello">
    <button @click="cp">{{ isSelect }}</button>
    <Slider v-model="value1"></Slider>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class HelloWorld extends Vue {
  @Prop() private value1!: number
  @Prop() private isSelect = false

  private cp() {
    // this.$msgSender.sendEventToContentJS('', this.isSelect ? 'startSelect' : 'stopSelect', null)
    // this.isSelect = !this.isSelect
  }
}
</script>
