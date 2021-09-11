//Local extension imports
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

//Main imports
const { St, Gio, GObject } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

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
      super._init(0.0, 'Privacy Settings Menu Indicator');

      //Gsettings access
      this.privacySettings = new Gio.Settings({ schema: 'org.gnome.desktop.privacy' });
      this.locationSettings = new Gio.Settings({ schema: 'org.gnome.system.location' });
    }

    setIcon(iconName) {
      this.add_child(new St.Icon({
        gicon: new Gio.ThemedIcon({name: iconName}),
        style_class: 'system-status-icon'
      }));
    }

    resetSettings() {
      log('Resetting settings')
    }

    createSettingToggle(popupLabel, iconName) {
      //Create sub menu with an icon
      let subMenu = new PopupMenu.PopupSubMenuMenuItem(popupLabel, true);
      subMenu.icon.icon_name = iconName;

      //Add a toggle to the submenu, then return it
      subMenu.menu.addMenuItem(new PopupMenu.PopupSwitchMenuItem('Enabled', true, null));
      return subMenu
    }

    addEntries() {
      this.menu.addMenuItem(new PopupMenu.PopupMenuItem(
        'Privacy Settings',
        {reactive: false}
      ));
      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

      let subMenus = [
        this.createSettingToggle('Location', 'location-services-active-symbolic'),
        this.createSettingToggle('Camera', 'camera-photo-symbolic'),
        this.createSettingToggle('Microphone', 'audio-input-microphone-symbolic')
      ];

      let gsettingsSchemas = [
        //Schema, key, bind flags
        [this.locationSettings, 'enabled', Gio.SettingsBindFlags.DEFAULT],
        [this.privacySettings, 'disable-camera', Gio.SettingsBindFlags.INVERT_BOOLEAN],
        [this.privacySettings, 'disable-microphone', Gio.SettingsBindFlags.INVERT_BOOLEAN]
      ];

      subMenus.forEach((subMenu, i) => {
        gsettingsSchemas[i][0].bind(
          gsettingsSchemas[i][1], //GSettings key to bind to
          subMenu.menu.firstMenuItem._switch, //Toggle switch to bind to
          'state', //Property to share
          gsettingsSchemas[i][2] //Binding flags
        );

        //Add each submenu to the main menu
        this.menu.addMenuItem(subMenu);
      });

      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
      this.menu.addAction('Reset settings', this.resetSettings, null);
    }
  }
);

class Extension {
  constructor() {
    this.indicator = null;
    this._indicatorIconName = 'preferences-system-privacy-symbolic';
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
