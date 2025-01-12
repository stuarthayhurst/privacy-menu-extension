//Main imports
import St from 'gi://St';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';
const QuickSettingsMenu = Main.panel.statusArea.quickSettings;

//Extension system imports
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

//Constants for menu display modes
const DisplayMode = {
  QuickToggles: 0,
  QuickGroup: 1,
  Indicators: 2
};

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

    _resetSettings() {
      let privacySettings = new Gio.Settings({schema: 'org.gnome.desktop.privacy'});
      let locationSettings = new Gio.Settings({schema: 'org.gnome.system.location'});

      //Reset the settings
      locationSettings.reset('enabled');
      privacySettings.reset('disable-camera');
      privacySettings.reset('disable-microphone');
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
      subMenu.menu.addAction(_('Reset to defaults'), this._resetSettings, null);

      this.menu.addMenuItem(subMenu);
    }
  }
);

//Class for individual privacy quick settings toggles
const PrivacyQuickToggle = GObject.registerClass(
  class PrivacyQuickToggle extends QuickSettings.QuickToggle {
    _init(settingName, settingIcon, settingSchema, settingKey, settingBindFlag) {
      //Set up the quick setting toggle
      super._init({
        title: settingName,
        iconName: settingIcon,
        toggleMode: true,
      });

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
);

//Class for the privacy quick settings group
const PrivacyQuickGroup = GObject.registerClass(
  class PrivacyQuickGroup extends QuickSettings.QuickMenuToggle {
    _init(extension, useQuickSubtitle, clickToToggle) {
      //Set up the quick setting toggle
      super._init({
        title: _('Privacy'),
        iconName: 'preferences-system-privacy-symbolic',
        toggleMode: false,
      });

      //Set a menu header
      this.menu.setHeader('preferences-system-privacy-symbolic', _('Privacy Settings'));

      //Open the menu or toggle all settings when the body is clicked
      this.connect('clicked', () => {
        if (clickToToggle) {
          //Enable / disable every setting according to its bind flag
          let targetState = this.checked;
          this._settingsInfo.forEach((settingInfo) => {
            let newState = targetState ^ (settingInfo[2] == Gio.SettingsBindFlags.INVERT_BOOLEAN);
            settingInfo[0].set_boolean(settingInfo[1], newState);
          });
        } else {
          this.menu.open();
        }
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

      //Create menu entries for each setting toggle
      this._toggleDisplayInfo.forEach((displayInfo, i) => {
        this._toggleItems.push(
          new PrivacySettingImageSwitchItem(displayInfo[0], displayInfo[1], true)
        );

        //Update subtitle when settings changed
        let event = 'changed::' + this._settingsInfo[i][1];
        this._settingsInfo[i][0].connectObject(event, () => {
          this._updateSubtitle(); this._updateVisualState();
        }, this);

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

      //Add extension settings entry
      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
      let settingsItem = this.menu.addAction(_('Extension Settings'), () => {
        extension.openPreferences();
      });

      //Hide the settings when the screen is locked
      settingsItem.visible = Main.sessionMode.allowSettings;
      this.menu._settingsActions[extension.uuid] = settingsItem;

      //Set initial enabled / disabled
      this._updateVisualState();
    }

    _updateVisualState() {
      //If all of the privacy settings are disabled, set enableToggle to true
      let enableToggle = true;
      this._settingsInfo.forEach((settingInfo) => {
        let settingEnabled = settingInfo[0].get_boolean(settingInfo[1]);
        if (settingEnabled == (settingInfo[2] != Gio.SettingsBindFlags.INVERT_BOOLEAN)) {
          enableToggle = false;
        }
      });

      //Set the state of the menu toggle
      this.checked = enableToggle;
    }

    _updateSubtitle() {
      //Skip if disabled
      if (!this._useQuickSubtitle) {
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
        //If no settings are enabled, display 'Private'
        this.subtitle = _('Private');
      } else if (enabledSettingsCount == 1) {
        //If 1 setting is enabled, mention it by name
        this.subtitle = enabledSettingName;
      } else {
        //If multiple are enabled, display how many
        //Translators: this displays how many settings are enabled, e.g. '1 allowed'
        this.subtitle = enabledSettingsCount + _(' allowed');
      }
    }

    clean() {
      //Disconnect from settings
      this._settingsInfo.forEach((settingInfo) => {
        settingInfo[0].disconnectObject(this);
      });
    }
  }
);

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
    quickSettingsInfo.forEach((quickSettingInfo, i) => {
      this._quickSettingToggles.push(
        new PrivacyQuickToggle(
          quickSettingInfo[0], quickSettingInfo[1],
          quickSettingInfo[2], quickSettingInfo[3],
          quickSettingInfo[4]
        )
      );

      //Add the toggle to the system menu
      let backgroundApps = QuickSettingsMenu._backgroundApps?.quickSettingsItems?.at(-1) ?? null;
      QuickSettingsMenu.menu.insertItemBefore(this._quickSettingToggles[i], backgroundApps);
    });
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
  constructor(extension, useQuickSubtitle, clickToToggle) {
    //Create quick settings group and add to the system menu
    this._quickSettingsGroup = new PrivacyQuickGroup(extension, useQuickSubtitle, clickToToggle);
    let backgroundApps = QuickSettingsMenu._backgroundApps?.quickSettingsItems?.at(-1) ?? null;
    QuickSettingsMenu.menu.insertItemBefore(this._quickSettingsGroup, backgroundApps);
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
    Main.panel.addToStatusArea('privacy-menu', this._indicator, offset);
  }

  clean() {
    //Destroy the indicator
    this._indicator.remove_all_children();
    this._indicator.destroy();
    this._inidcator = null;
  }
}

export default class PrivacyQuickSettingsManager extends Extension {
  enable() {
    //Create new extension
    this._privacyMenu = new PrivacyExtension(this);

    //Create menu
    this._privacyMenu.initMenu();
  }

  disable() {
    //Disconnect listeners, then destroy the menu and class
    this._privacyMenu.disconnectListeners();
    this._privacyMenu.destroyMenu();
    this._privacyMenu = null;
  }
}

class PrivacyExtension {
  constructor(extension) {
    this._privacyManager = null;
    this._extension = extension;
    this._extensionSettings = this._extension.getSettings();
  }

  disconnectListeners() {
    this._extensionSettings.disconnectObject(this);
  }

  _decideMenuType() {
    /*
     - Return DisplayMode.QuickToggles if quick settings are enabled
       - If quick settings grouping is also enabled, return DisplayMode.QuickGroup instead
     - Otherwise return DisplayMode.Indicators
    */
    if (this._extensionSettings.get_boolean('use-quick-settings')) {
      if (this._extensionSettings.get_boolean('group-quick-settings')) {
        return DisplayMode.QuickGroup;
      }
      return DisplayMode.QuickToggles;
    }

    return DisplayMode.Indicator;
  }

  initMenu() {
    //Create the correct type of menu
    this._createMenu();

    //When settings change, recreate the menu
    this._extensionSettings.connectObject('changed', () => {
      //Destroy existing menu and create new menu
      this.destroyMenu();
      this._createMenu();
    }, this);
  }

  _createMenu() {
    //Create the correct type of menu, from preferences and capabilities
    switch (this._decideMenuType()) {
      case DisplayMode.QuickToggles:
        this._privacyManager = new QuickSettingsManager();
        break;
      case DisplayMode.QuickGroup:
        let useQuickSubtitle = this._extensionSettings.get_boolean('use-quick-subtitle');
        let clickToToggle = this._extensionSettings.get_boolean('click-to-toggle');
        this._privacyManager = new QuickGroupManager(this._extension, useQuickSubtitle, clickToToggle);
        break;
      case DisplayMode.Indicator:
        let forceIconRight = this._extensionSettings.get_boolean('move-icon-right');
        this._privacyManager = new IndicatorSettingsManager(forceIconRight);
        break;
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
