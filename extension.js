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
    }

    setIcon(iconName) {
      this.add_child(new St.Icon({
        gicon: new Gio.ThemedIcon({name: iconName}),
        style_class: 'system-status-icon'
      }));
    }

    addEntries() {
      //For now, do nothing
      return;
    }
  }
);

class Extension {
  constructor() {
    this.indicator = null;
    this._indicatorIconName = 'face-laugh-symbolic';
  }

  createMenu() {
    //Create and setup indicator and menu
    this.indicator = new PrivacyMenu();
    //Set indicator icon
    this.indicator.setIcon(this._indicatorIconName);
    //Add menu entries
    this.indicator.addEntries();

    Main.panel.addToStatusArea(Me.metadata.uuid, this.indicator)
  }
}
