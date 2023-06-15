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

const QuickSettings = ShellVersion >= 43 ? imports.ui.quickSettings : null;
const QuickSettingsMenu = ShellVersion >= 43 ? imports.ui.main.panel.statusArea.quickSettings : null;

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
        gicon: Gio.ThemedIcon.new('preferences-system-privacy-symbolic'),
        style_class: 'system-status-icon'
      }));

      //GSettings access
      this._privacySettings = new Gio.Settings({schema: 'org.gnome.desktop.privacy'});
      this._locationSettings = new Gio.Settings({schema: 'org.gnome.system.location'});
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

      let gsettingsSchemas = [
        //Schema, key, bind flags
        [this._locationSettings, 'enabled', Gio.SettingsBindFlags.DEFAULT],
        [this._privacySettings, 'disable-camera', Gio.SettingsBindFlags.INVERT_BOOLEAN],
        [this._privacySettings, 'disable-microphone', Gio.SettingsBindFlags.INVERT_BOOLEAN]
      ];

      //Create menu entries for each setting toggle
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

//On GNOME 43+ create a class for privacy quick settings toggles
const PrivacyQuickToggle = ShellVersion >= 43 ? GObject.registerClass(
  class PrivacyQuickToggle extends QuickSettings.QuickToggle {
    _init(settingName, settingIcon, settingSchema, settingKey, settingBindFlag) {
      //Set up the quick setting toggle
      if (ShellVersion >= 44) {
        super._init({
          title: settingName,
          iconName: settingIcon,
          toggleMode: true,
        });
      } else {
        super._init({
          label: settingName,
          iconName: settingIcon,
          toggleMode: true,
        });
      }

      //GSettings access
      this._settings = new Gio.Settings({schema: settingSchema});

      //Bind the setting and toggle together
      this._settings.bind(
        settingKey, //GSettings key to bind to
        this, //UI element to bind to
        'checked', //Property to share
        settingBindFlag //Bind flag
      );
    }
  }
) : null;

//On GNOME 43+ create a class for the privacy quick settings group
const PrivacyQuickGroup = ShellVersion >= 43 ? GObject.registerClass(
  class PrivacyQuickGroup extends QuickSettings.QuickMenuToggle {
    _init() {
      //Set up the quick setting toggle
      if (ShellVersion >= 44) {
        super._init({
          title: _('Privacy'),
          iconName: 'preferences-system-privacy-symbolic',
          toggleMode: true,
        });
      } else {
        super._init({
          label: _('Privacy'),
          iconName: 'preferences-system-privacy-symbolic',
          toggleMode: true,
        });
      }

      //GSettings access
      this._privacySettings = new Gio.Settings({schema: 'org.gnome.desktop.privacy'});
      this._locationSettings = new Gio.Settings({schema: 'org.gnome.system.location'});

      let subMenus = [
        this._createSettingToggle(_('Location'), 'location-services-active-symbolic'),
        this._createSettingToggle(_('Camera'), 'camera-photo-symbolic'),
        this._createSettingToggle(_('Microphone'), 'audio-input-microphone-symbolic')
      ];

      let gsettingsSchemas = [
        //Schema, key, bind flags
        [this._locationSettings, 'enabled', Gio.SettingsBindFlags.DEFAULT],
        [this._privacySettings, 'disable-camera', Gio.SettingsBindFlags.INVERT_BOOLEAN],
        [this._privacySettings, 'disable-microphone', Gio.SettingsBindFlags.INVERT_BOOLEAN]
      ];

      //Create menu entries for each setting toggle
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
    }

//TODO: Rewrite this to support new design
    _createSettingToggle(popupLabel, iconName) {
      //Create sub menu with an icon
      let subMenu = new PopupMenu.PopupSubMenuMenuItem(popupLabel, true);
      subMenu.icon.icon_name = iconName;

      //Add a toggle to the submenu, then return it
      subMenu.menu.addMenuItem(new PopupMenu.PopupSwitchMenuItem(_('Enabled'), true, null));
      return subMenu;
    }
  }
) : null;

class QuickSettingsManager {
  constructor() {
    this._quickSettingToggles = [];

    //Info to create toggles: settingName, settingIcon, settingSchema, settingKey, settingBindFlag
    let quickSettingsInfo = [
      [_('Location'), 'location-services-active-symbolic', 'org.gnome.system.location', 'enabled', Gio.SettingsBindFlags.DEFAULT],
      [_('Camera'), 'camera-photo-symbolic', 'org.gnome.desktop.privacy', 'disable-camera', Gio.SettingsBindFlags.INVERT_BOOLEAN],
      [_('Microphone'), 'audio-input-microphone-symbolic', 'org.gnome.desktop.privacy', 'disable-microphone', Gio.SettingsBindFlags.INVERT_BOOLEAN]
    ];

    //Create a quick setting toggle for each privacy setting
    quickSettingsInfo.forEach((quickSettingInfo) => {
      this._quickSettingToggles.push(
        new PrivacyQuickToggle(
          quickSettingInfo[0],
          quickSettingInfo[1],
          quickSettingInfo[2],
          quickSettingInfo[3],
          quickSettingInfo[4]
        )
      );
    });

    //Add the toggles to the system menu
    QuickSettingsMenu._addItems(this._quickSettingToggles);

    //Place the toggles above the background apps entry
    if (ShellVersion >= 44) {
      this._quickSettingToggles.forEach((item) => {
        QuickSettingsMenu.menu._grid.set_child_below_sibling(item,
          QuickSettingsMenu._backgroundApps.quickSettingsItems[0]);
      });
    }
  }

  clean() {
    //Destroy each created quick settings toggle
    this._quickSettingToggles.forEach((quickSettingToggle) => {
      quickSettingToggle.destroy();
     });

    //Remove each tracked entry
    this._quickSettingToggles = [];
  }
}

class QuickGroupManager {
  constructor() {
    this._quickSettingsGroup = new PrivacyQuickGroup();

    //Add the toggles to the system menu
    QuickSettingsMenu._addItems([this._quickSettingsGroup]);

    //Place the toggles above the background apps entry
    if (ShellVersion >= 44) {
      QuickSettingsMenu.menu._grid.set_child_below_sibling(this._quickSettingsGroup,
        QuickSettingsMenu._backgroundApps.quickSettingsItems[0]);
    }
  }

  clean() {
    this._quickSettingsGroup.destroy();
    this._quickSettingsGroup = null;
  }
}

class IndicatorSettingsManager {
  constructor() {
    //Create and setup indicator and menu
    this._indicator = new PrivacyIndicator();
    this._extensionSettings = ExtensionUtils.getSettings();

    //Add menu entries
    this._indicator.addEntries();

    //Get position to insert icon (left or right)
    let offset = 0;
    if (this._extensionSettings.get_boolean('move-icon-right')) {
      offset = Main.panel._rightBox.get_n_children() - 1;
    }

    //Add to panel
    Main.panel.addToStatusArea(Me.metadata.uuid, this._indicator, offset);
  }

  clean() {
    //Destroy the indicator
    this._indicator.remove_all_children();
    this._indicator.destroy();
    this._inidcator = null;
  }
}

class Extension {
  constructor() {
    this._privacyManager = null;
    this._extensionSettings = ExtensionUtils.getSettings();
  }

  disconnectListeners() {
    this._extensionSettings.disconnect(this._settingsChangedSignal);
  }

  _decideMenuType() {
    /*
     - Return 'quick-toggles' if running GNOME 43+ and quick settings are enabled
       - If quick settings grouping is enabled, return 'quick-group' instead
     - Otherwise return 'indiactors'
    */
    if (this._extensionSettings.get_boolean('use-quick-settings')) {
      if (ShellVersion >= 43) {
        if (this._extensionSettings.get_boolean('group-quick-settings')) {
          return 'quick-group';
        }
        return 'quick-toggles';
      }
    }

    return 'indicator';
  }

  initMenu() {
    //Create the correct type of menu
    this._createMenu();

    //When settings change, recreate the menu
    this._settingsChangedSignal = this._extensionSettings.connect('changed', () => {
      //Destroy existing menu and create new menu
      this.destroyMenu();
      this._createMenu();
    });
  }

  _createMenu() {
    //Create the correct type of menu, from preference and capabilities
    let menuType = this._decideMenuType();
    if (menuType == 'quick-toggles') {
      this._privacyManager = new QuickSettingsManager();
    } else if (menuType == 'quick-group') {
      this._privacyManager = new QuickGroupManager();
    } else if (menuType == 'indicator') {
      this._privacyManager = new IndicatorSettingsManager();
    }
  }

  destroyMenu() {
    //Destroy the menu, if created
    if (this._privacyManager != null) {
      this._privacyManager.clean();
      this._privacyManager = null;
    }
  }
}
