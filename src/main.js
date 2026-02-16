const { app, BrowserWindow, ipcMain, session, Menu, MenuItem, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 650,
    height: 450,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ['script-src \'self\''],
      },
    });
  })

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  const template = [
    { role: 'appMenu' },
    {
      label: 'Options',
      submenu: [
        {
          label: 'Toggle Palette',
          click: () => {
            mainWindow.webContents.send("togglePalette", {});
          },
        },
      ],
    },
    { role: 'fileMenu' },
    // { role: 'editMenu' }
    { role: 'viewMenu' },
    { role: 'windowMenu' },
    { role: 'help' },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

const processFile = (filePath, content) => {
  try {
    const json = JSON.parse(content.toString())
    if (json.sprites || json.spriteActors) {
      mainWindow.webContents.send("spritesLoaded", json)
      return
    }
  } catch (e) {
    // Not a JSON file, or invalid JSON. Continue with C parsing.
  }

  let name = 'Tileset'
  let sprites = []
  let maps = []

  const chunks = content.toString().split('unsigned char ').filter(chunk => chunk.length > 0)

  chunks.forEach(chunk => {
    const dataStrings = chunk.toString()
      .split('\n')
      .map(line => line.trim())

    const foundName = dataStrings[0].split('[')[0]

    if (foundName.slice(-5) === 'Tiles') {
      sprites = loadSprites(dataStrings)
      name = foundName.slice(0, -5)
    }

    if (foundName.slice(-3) === 'Map') {
      const [mapData, mapWidth, mapHeight] = loadMap(dataStrings)
      maps.push({
        name: foundName.slice(0, -3) || 'Map',
        width: mapWidth,
        height: mapHeight,
        oldWidth: mapWidth,
        oldHeight: mapHeight,
        data: mapData
      })
    }
  })

  mainWindow.webContents.send("spritesLoaded", {
    name,
    sprites,
    maps,
  });
}

ipcMain.on("loadFile", (event, args) => {
  fs.readFile(args, (error, data) => {
    if (error) {
      console.error(error)
      return
    }
    processFile(args, data)
  });
});

ipcMain.on("openFile", (event) => {
  dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Project File', extensions: ['json'] },
      { name: 'C/Text File', extensions: ['c', 'txt'] }
    ]
  }).then(({ canceled, filePaths }) => {
    if (!canceled && filePaths.length > 0) {
      const filePath = filePaths[0]
      fs.readFile(filePath, (err, data) => {
        if (err) {
          console.error(err)
          return
        }
        processFile(filePath, data)
      })
    }
  })
})

ipcMain.on("saveFile", (event, content) => {
  dialog.showSaveDialog({
    defaultPath: 'project.json',
    filters: [{ name: 'Project File', extensions: ['json'] }]
  }).then(({ canceled, filePath }) => {
    if (!canceled && filePath) {
      fs.writeFile(filePath, content, (err) => {
        if (err) console.error(err)
      })
    }
  })
})

const loadSprites = (dataStrings) => {
  return dataStrings.filter(line => line[0] === '0')
    .flatMap(line => line.split(','))
    .filter(pixel => pixel.length > 0)
    .map(pixel => parseInt(pixel, 16))
    .map(pixel => pixel.toString(2).padStart(8, '0'))
    .reduce((acc, currentPixel, currentIndex, pixels) => {
      if (currentIndex % 2 === 0) {
        acc.push([currentPixel, pixels[currentIndex + 1]])
      }
      return acc
    }, [])
    .map(([lsbits, msbits]) => {
      const pixels = []
      for (let i = 0; i < 8; i++) {
        const lsb = lsbits[i]
        const msb = msbits[i]
        if (lsb === '1' && msb === '1') {
          pixels.push(3)
        } else if (lsb === '1') {
          pixels.push(1)
        } else if (msb === '1') {
          pixels.push(2)
        } else {
          pixels.push(0)
        }
      }
      return pixels
    })
    .reduce((acc, currentPixel, currentIndex, pixels) => {
      if (currentIndex % 8 === 0) {
        acc.push([currentPixel, pixels[currentIndex + 1], pixels[currentIndex + 2], pixels[currentIndex + 3], pixels[currentIndex + 4], pixels[currentIndex + 5], pixels[currentIndex + 6], pixels[currentIndex + 7]])
      }
      return acc
    }, [])
    .map(([p1, p2, p3, p4, p5, p6, p7, p8]) => {
      return [...p1, ...p2, ...p3, ...p4, ...p5, ...p6, ...p7, ...p8]
    })
}

const loadMap = (dataStrings) => {
  const mapLines = dataStrings.filter(line => line[0] === '0')

  const mapWidth = mapLines[0].split(',').filter(tile => tile.length > 0).length
  const mapHeight = mapLines.length

  const map = mapLines.flatMap(line => line.split(','))
    .filter(tile => tile.length > 0)
    .map(tile => parseInt(tile, 16))

  return [map, mapWidth, mapHeight]
}
