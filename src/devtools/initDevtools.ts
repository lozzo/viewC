// 创建自定义面板，同一个插件可以创建多个自定义面板
// 几个参数依次为：panel标题、图标（其实设置了也没地方显示）、要加载的页面、加载成功后的回调
// import { CommonMsg } from '@/consts'
// import { getMsgSender } from '@/lib/messages'
// ;(async () => {
//   chrome.devtools.panels.create('viewP', 'img/icon.png', '../ctlPage/index.html', function(panel) {
//     console.log('自定义面板创建成功！') // 注意这个log一般看不到
//   })
//   const msgSender = await getMsgSender<CommonMsg>('devtoolsJs')
//   console.info('dlog-initDevtools:10', 22222)
//   const a = await msgSender.sendEventToBackgroundJS('pong', 'ping')
//   console.info('dlog-initDevtools:11', 111)
//   console.info('dlog-main:14', a)
// })()
