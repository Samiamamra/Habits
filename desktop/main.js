const { app, BrowserWindow, Menu } = require('electron'), path = require('path');
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  const w = new BrowserWindow({ width: 1100, height: 760, minWidth: 420, title: 'عادات',
    icon: path.join(__dirname, '..', 'www', 'icon-512.png'), webPreferences: { contextIsolation: true } });
  w.loadFile(path.join(__dirname, '..', 'www', 'index.html'));
});
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit());
