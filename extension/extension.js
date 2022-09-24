/* exported init enable disable */

//Local extension imports
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { ExtensionHelper } = Me.imports.lib;
const ShellVersion = parseFloat(imports.misc.config.PACKAGE_VERSION);

//Main imports
const { St, Gio, GObject } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

//Use _() for translations
const _ = imports.gettext.domain(Me.metadata.uuid).gettext;

function init() {
  ExtensionUtils.initTranslations();
}

function enable() {
  //Create new extension
  privacyMenu = new Extension();

  //Create menu
  privacyMenu.initMenu();
}

function disable() {
  //Disconnect listeners, then destroy the menu and class
  privacyMenu.disconnectListeners();
  privacyMenu.destroyMenu();
  privacyMenu = null;
}

const PrivacyIndicator = GObject.registerClass(
  class PrivacyIndicator extends PanelMenu.Button{
    _init() {
      super._init(0.0, _('Privacy Settings Menu Indicator'));

      //Set an icon for the indicator
      this.add_child(new St.Icon({
        gicon: Gio.icon_new_for_string(Me.path + '/icons/privacy-indicator-symbolic.svg'),
        style_class: 'system-status-icon'
      }));

      //Gsettings access
      this.privacySettings = new Gio.Settings({ schema: 'org.gnome.desktop.privacy' });
      this.locationSettings = new Gio.Settings({ schema: 'org.gnome.system.location' });
    }

    createSettingToggle(popupLabel, iconName) {
      //Create sub menu with an icon
      let subMenu = new PopupMenu.PopupSubMenuMenuItem(popupLabel, true);
      subMenu.icon.icon_name = iconName;

      //Add a toggle to the submenu, then return it
      subMenu.menu.addMenuItem(new PopupMenu.PopupSwitchMenuItem(_('Enabled'), true, null));
      return subMenu;
    }

    addEntries() {
      this.menu.addMenuItem(new PopupMenu.PopupMenuItem(
        _('Privacy Settings'),
        {reactive: false}
      ));
      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

      let subMenus = [
        this.createSettingToggle(_('Location'), 'location-services-active-symbolic'),
        this.createSettingToggle(_('Camera'), 'camera-photo-symbolic'),
        this.createSettingToggle(_('Microphone'), 'audio-input-microphone-symbolic')
      ];

      this.gsettingsSchemas = [
        //Schema, key, bind flags
        [this.locationSettings, 'enabled', Gio.SettingsBindFlags.DEFAULT],
        [this.privacySettings, 'disable-camera', Gio.SettingsBindFlags.INVERT_BOOLEAN],
        [this.privacySettings, 'disable-microphone', Gio.SettingsBindFlags.INVERT_BOOLEAN]
      ];

      //Create menu entries for each setting toggle
      subMenus.forEach((subMenu, i) => {
        this.gsettingsSchemas[i][0].bind(
          this.gsettingsSchemas[i][1], //GSettings key to bind to
          subMenu.menu.firstMenuItem._switch, //Toggle switch to bind to
          'state', //Property to share
          this.gsettingsSchemas[i][2] //Binding flags
        );

        //Add each submenu to the main menu
        this.menu.addMenuItem(subMenu);
      });

      //Separator to separate reset option
      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

      //Create a submenu for the reset option, to prevent a misclick
      let subMenu = new PopupMenu.PopupSubMenuMenuItem(_('Reset settings'), true);
      subMenu.icon.icon_name = 'edit-delete-symbolic';
      subMenu.menu.addAction(_('Reset to defaults'), ExtensionHelper.resetSettings, null);

      this.menu.addMenuItem(subMenu);
    }
  }
);

class Extension {
  constructor() {
    this._indicator = null;
    this._activeMenu = '';
    this.extensionSettings = ExtensionUtils.getSettings();
  }

  disconnectListeners() {
    this.extensionSettings.disconnect(this._settingsChangedSignal);
  }

  useQuickSettings() {
    //Return true if running GNOME 43+ and quick settings are enabled
    return this.extensionSettings.get_boolean('use-quick-settings') && ShellVersion >= 43;
  }

  initMenu() {
    //Create the correct type of menu
    this.createMenu();

    //When settings change, recreate the menu
    this._settingsChangedSignal = this.extensionSettings.connect('changed', () => {
      //Destroy existing menu and create new menu
      this.destroyMenu();
      this.createMenu();
    });
  }

  createMenu() {
    //Create the correct type of menu
    if (this.useQuickSettings()) {
      this.createQuickSettings();
    } else {
      this.createIndicator();
    }
  }

  destroyMenu() {
    //Destroy the active menu
    if (this._activeMenu == 'quick-settings') {
      this.destroyQuickSettings();
    } else if (this._activeMenu == 'indicator') {
      this.destroyIndicator();
    }

    this._activeMenu = '';
  }

  createQuickSettings() {
    this._activeMenu = 'quick-settings';

    return;
  }

  destroyQuickSettings() {
    return;
  }

  createIndicator() {
    //Create and setup indicator and menu
    this._activeMenu = 'indicator';
    this._indicator = new PrivacyIndicator();

    //Add menu entries
    this._indicator.addEntries();

    //Get position to insert icon (left or right)
    let offset = 0;
    if (this.extensionSettings.get_boolean('move-icon-right')) {
      offset = Main.panel._rightBox.get_n_children() - 1;
    }

    //Add to panel
    Main.panel.addToStatusArea(Me.metadata.uuid, this._indicator, offset);
  }

  destroyIndicator() {
    //Destroy the indicator
    this._indicator.remove_all_children();
    this._indicator.destroy();
  }
}
