export async function getCurrentTabId(): Promise<number | null> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true
      },
      (tabs) => {
        resolve(tabs.length ? tabs[0].id : null)
      }
    )
  })
}

export async function queryTabs(info: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query(info, (tabs) => resolve(tabs))
  })
}

export function colorInfoLog(part: string, options: any, data: any, extension: any = 'viewC') {
  console.log(
    `%c ${extension} %c ${part} ${options} %c`,
    'background:#35495e ; padding: 1px; border-radius: 3px 0 0 3px;  color: #fff',
    'background:#41b883 ; padding: 1px; border-radius: 0 3px 3px 0;  color: #fff',
    'background:transparent',
    data
  )
}
