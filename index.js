const electron = require('electron')

let window
function createWindow () {

  // 创建浏览器窗口，但不显示
  window = new electron.BrowserWindow({width: 320, height: 568, show: false, resizable: false})

  // 页面加载完成时再显示窗口，防止白屏
  window.once('ready-to-show', () => {
    window.show()
  })

  // 加载应用的 index.html
  window.loadFile('index.html')

  // 打开开发者工具
  window.webContents.openDevTools()

  window.on('closed', () => {

    // 取消引用 window 对象
    window = null
  })
}

electron.app.on('ready', createWindow)

electron.app.on('window-all-closed', () => {

  // 在 macOS 上保持激活
  if (process.platform !== 'darwin') {
    electron.app.quit()
  }
})

electron.app.on('activate', () => {

  // 在macOS上，当单击dock图标并且没有其他窗口打开时，
  // 通常在应用程序中重新创建一个窗口
  if (window === null) {
    createWindow()
  }
})