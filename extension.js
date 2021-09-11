//Local extension imports
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

//Main imports
const { St, Gio, GObject } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

function init() {
  //Do nothing, until translation support is added
}

function enable() {
  //Create new extension
  privacyMenu = new Extension();

  //Create menu
  privacyMenu.createMenu();
}

function disable() {
  //Destroy the menu
  privacyMenu.indicator.destroy();
  privacyMenu = null;
}

const PrivacyMenu = GObject.registerClass(
  class Indicator extends PanelMenu.Button{
    _init() {
      super._init(0.0, "Privacy Settings Menu Indicator");
      this.add_child(new St.Icon({
        gicon: new Gio.ThemedIcon({name: 'face-laugh-symbolic'}),
        style_class: 'system-status-icon'
      }));

      //Add menu entries
      this._addEntries();
    }

    _addEntries() {
      //For now, do nothing
      return;
    }

  }
);

class Extension {
  constructor() {
    this.indicator = null;
  }

  createMenu() {
    this.indicator = new PrivacyMenu();
    Main.panel.addToStatusArea(Me.metadata.uuid, this.indicator)
  }
}
