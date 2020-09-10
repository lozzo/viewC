// 这儿定义各种公用类型
import { Imsg } from '@/lib/messages'

export interface IM {
  ppp: Imsg<{ x: string }, number>
}
