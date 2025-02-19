const { app, BrowserWindow } = require('electron')
const path = require('path')

let win

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, './public/logo512.png'), // Set the app icon here
    webPreferences: {
      nodeIntegration: true,
    },
  })

  win.removeMenu(); // Hides the default menu
  win.maximize(); // Start in maximized mode
  win.loadURL('http://localhost:3000')  // React dev server URL for development
  win.on('closed', () => {
    win = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})
