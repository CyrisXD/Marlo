const {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu
} = require('electron')
const path = require('path')

const assetsDirectory = path.join(__dirname, 'images')

let tray = undefined
let window = undefined

// Don't show the app in the doc
app.dock.hide()

app.on('ready', () => {
  createTray()
  createWindow()
})

// Quit the app when the window is closed
app.on('window-all-closed', () => {
  app.quit()
})

const createTray = () => {
  tray = new Tray(path.join(assetsDirectory, 'icon.png'))
  tray.on('right-click', toggleWindow)
  tray.on('double-click', toggleWindow)
  tray.on('click', function (event) {
    toggleWindow()
    //window.openDevTools({
    //  mode: 'detach'
    //})
    // Show devtools when command clicked
    if (window.isVisible() && process.defaultApp && event.metaKey) {
      window.openDevTools({
        mode: 'detach'
      })
    }
  })
}

const getWindowPosition = () => {
  const windowBounds = window.getBounds()
  const trayBounds = tray.getBounds()

  // Center window horizontally below the tray icon
  const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))

  // Position window 4 pixels vertically below the tray icon
  const y = Math.round(trayBounds.y + trayBounds.height + 4)

  return {
    x: x,
    y: y
  }
}

const createWindow = () => {
  window = new BrowserWindow({
    width: 300,
    height: 410,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    transparent: true,
    alwaysOnTop: true,
    icon: path.join(__dirname, 'images/dock-icon64.png'),
    webPreferences: {
      // Prevents renderer process code from not running when window is
      // hidden
      backgroundThrottling: false
    }
  })
  window.loadURL(`file://${path.join(__dirname, 'index.html')}`)

  // Hide the window when it loses focus
  window.on('blur', () => {
    if (!window.webContents.isDevToolsOpened()) {
      window.hide()
    }
  })
}

const toggleWindow = () => {
  if (window.isVisible()) {
    window.hide()
    window.reload();
  } else {
    showWindow()
  }
}

const showWindow = () => {
  const position = getWindowPosition()
  window.setPosition(position.x, position.y, false)
  window.show()
  window.focus()
}


// Resize Main Window on Login
ipcMain.on('resize-login', () => {
  window.setSize(300, 350, true)
})

// Resize Main Window on Profile
ipcMain.on('resize-profile', () => {
  window.setSize(300, 410, true)
})

// Listen for Logout 
ipcMain.on('logout', () => {
  window.reload();
})

// Listen for Quit
ipcMain.on('quit', () => {
  app.quit();
})

// Add entry to login items
ipcMain.on('enable-startup', () => {
  app.setLoginItemSettings({
    openAtLogin: true
  });
})

// Remove entry from login items
ipcMain.on('disable-startup', () => {
  app.setLoginItemSettings({
    openAtLogin: false
  });
  require('child_process').exec(`osascript -e 'tell application "System Events" to delete login item "Marlo"'`)
})



