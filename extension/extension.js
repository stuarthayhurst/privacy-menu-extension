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

//Custom PopupMenuItem with an icon, label and switch
const PrivacySettingImageSwitchItem = GObject.registerClass(
  class PrivacySettingImageSwitchItem extends PopupMenu.PopupSwitchMenuItem {
    _init(text, icon, active) {
      super._init(text, active, {});

      this._icon = new St.Icon({
        style_class: 'popup-menu-icon',
      });

      this.insert_child_below(this._icon, this.label);
      this._icon.icon_name = icon;
    }
  }
);

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

    addEntries() {
      this.menu.addMenuItem(new PopupMenu.PopupMenuItem(
        _('Privacy Settings'),
        {reactive: false}
      ));
      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

      let toggleItems = [
        new PrivacySettingImageSwitchItem(_('Location'), 'location-services-active-symbolic', true),
        new PrivacySettingImageSwitchItem(_('Camera'), 'camera-photo-symbolic', true),
        new PrivacySettingImageSwitchItem(_('Microphone'), 'audio-input-microphone-symbolic', true)
      ];

      let gsettingsSchemas = [
        //Schema, key, bind flags
        [this._locationSettings, 'enabled', Gio.SettingsBindFlags.DEFAULT],
        [this._privacySettings, 'disable-camera', Gio.SettingsBindFlags.INVERT_BOOLEAN],
        [this._privacySettings, 'disable-microphone', Gio.SettingsBindFlags.INVERT_BOOLEAN]
      ];

      //Create menu entries for each setting toggle
      toggleItems.forEach((toggleItem, i) => {
        gsettingsSchemas[i][0].bind(
          gsettingsSchemas[i][1], //GSettings key to bind to
          toggleItem._switch, //Toggle switch to bind to
          'state', //Property to share
          gsettingsSchemas[i][2] //Binding flags
        );

        //Add each item to the main menu
        this.menu.addMenuItem(toggleItem);
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
    _init(useQuickSubtitle) {
      //Set up the quick setting toggle
      if (ShellVersion >= 44) {
        super._init({
          title: _('Privacy'),
          iconName: 'preferences-system-privacy-symbolic',
          toggleMode: false,
        });
      } else {
        super._init({
          label: _('Privacy'),
          iconName: 'preferences-system-privacy-symbolic',
          toggleMode: false,
        });
      }

      //Set a menu header
      this.menu.setHeader('preferences-system-privacy-symbolic', _('Privacy Settings'))

      //Open the menu when the body is clicked
      this.connect('clicked', () => {
        this.menu.open();
      });

      //GSettings access
      this._privacySettings = new Gio.Settings({schema: 'org.gnome.desktop.privacy'});
      this._locationSettings = new Gio.Settings({schema: 'org.gnome.system.location'});

      this._toggleDisplayInfo = [
        //Display name, icon name
        [_('Location'), 'location-services-active-symbolic'],
        [_('Camera'), 'camera-photo-symbolic'],
        [_('Microphone'), 'audio-input-microphone-symbolic']
      ];

      this._settingsInfo = [
        //Schema, key, bind flags
        [this._locationSettings, 'enabled', Gio.SettingsBindFlags.DEFAULT],
        [this._privacySettings, 'disable-camera', Gio.SettingsBindFlags.INVERT_BOOLEAN],
        [this._privacySettings, 'disable-microphone', Gio.SettingsBindFlags.INVERT_BOOLEAN]
      ];

      this._toggleItems = [];
      this._signals = [];

      //Create menu entries for each setting toggle
      this._toggleDisplayInfo.forEach((displayInfo, i) => {
        this._toggleItems.push(
          new PrivacySettingImageSwitchItem(displayInfo[0], displayInfo[1], true)
        );

        //Update subtitle when settings changed
        let event = 'changed::' + this._settingsInfo[i][1];
        this._signals[i] = this._settingsInfo[i][0].connect(event, () => {
          this._updateSubtitle();
        });

        //Link the setting value and the switch state
        this._settingsInfo[i][0].bind(
          this._settingsInfo[i][1], //GSettings key to bind to
          this._toggleItems[i]._switch, //Toggle switch to bind to
          'state', //Property to share
          this._settingsInfo[i][2] //Binding flags
        );

        //Add each item to the main menu
        this.menu.addMenuItem(this._toggleItems[i]);
      });

      //Set the subtitle
      this._useQuickSubtitle = useQuickSubtitle;
      this._updateSubtitle();
    }

    _updateSubtitle() {
      //Not supported below GNOME 44
      if (ShellVersion < 44) {
        return;
      } else if (!this._useQuickSubtitle) {
        return;
      }

      //Get the number of enabled settings
      let enabledSettingsCount = 0;
      let enabledSettingName = '';
      this._settingsInfo.forEach((settingInfo, i) => {
        let settingEnabled = settingInfo[0].get_boolean(settingInfo[1]);
        if (settingEnabled == (settingInfo[2] != Gio.SettingsBindFlags.INVERT_BOOLEAN)) {
          enabledSettingsCount += 1;
          enabledSettingName = this._toggleDisplayInfo[i][0];
        }
      });

      if (enabledSettingsCount == 0) {
        //If no settings are enabled, display 'All disabled'
        this.subtitle = _('All disabled');
      } else if (enabledSettingsCount == 1) {
        //If 1 setting is enabled, mention it by name
        this.subtitle = enabledSettingName;
      } else {
        //If multiple are enabled, display how many
        //Translators: this displays which setting is enabled, e.g. 'Location enabled'
        this.subtitle = enabledSettingsCount + _(' enabled');
      }
    }

    clean() {
      //Disconnect from settings
      this._signals.forEach((signalId, i) => {
        this._settingsInfo[i][0].disconnect(signalId);
      });
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
  constructor(useQuickSubtitle) {
    this._quickSettingsGroup = new PrivacyQuickGroup(useQuickSubtitle);

    //Add the toggles to the system menu
    QuickSettingsMenu._addItems([this._quickSettingsGroup]);

    //Place the toggles above the background apps entry
    if (ShellVersion >= 44) {
      QuickSettingsMenu.menu._grid.set_child_below_sibling(this._quickSettingsGroup,
        QuickSettingsMenu._backgroundApps.quickSettingsItems[0]);
    }
  }

  clean() {
    this._quickSettingsGroup.clean();
    this._quickSettingsGroup.destroy();
    this._quickSettingsGroup = null;
  }
}

class IndicatorSettingsManager {
  constructor(forceIconRight) {
    //Create and setup indicator and menu
    this._indicator = new PrivacyIndicator();

    //Add menu entries
    this._indicator.addEntries();

    //Get position to insert icon (left or right)
    let offset = 0;
    if (forceIconRight) {
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
      let useQuickSubtitle = this._extensionSettings.get_boolean('use-quick-subtitle')
      this._privacyManager = new QuickGroupManager(useQuickSubtitle);
    } else if (menuType == 'indicator') {
      let forceIconRight = this._extensionSettings.get_boolean('move-icon-right');
      this._privacyManager = new IndicatorSettingsManager(forceIconRight);
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
