/* exported PrivacyPreferences */

//Main imports
import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import GObject from 'gi://GObject';

//Extension system imports
import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

var PrefsPage = GObject.registerClass(
class PrefsPage extends Adw.PreferencesPage {
  _init(pageInfo, groupsInfo, settingsInfo, settings) {
    super._init({
      title: pageInfo[0],
      icon_name: pageInfo[1]
    });

    this._extensionSettings = settings;
    this._settingGroups = {};

    //Setup settings
    this._createGroups(groupsInfo);
    this._createSettings(settingsInfo);

    //Disable unavailable settings
    this._settingsChangedSignal = this._extensionSettings.connect('changed', () => {
      this._updateEnabledSettings();
    });
    this._updateEnabledSettings();
  }

  _createGroups(groupsInfo) {
    //Store groups, set title and add to window
    groupsInfo.forEach((groupInfo) => {
      this._settingGroups[groupInfo[0]] = new Adw.PreferencesGroup();
      this._settingGroups[groupInfo[0]].set_title(groupInfo[1]);
      this.add(this._settingGroups[groupInfo[0]]);
    });
  }

  _createSettings(settingsInfo) {
    settingsInfo.forEach(settingInfo => {
      //Check the target group exists
      if (!(settingInfo[0] in this._settingGroups)) {
        return;
      }

      //Create a row with a switch, title and subtitle
      let settingRow = new Adw.SwitchRow({
        title: settingInfo[2],
        subtitle: settingInfo[3]
      });

      //Connect the switch to the setting
      this._extensionSettings.bind(
        settingInfo[1], //GSettings key to bind to
        settingRow, //Object to bind to
        'active', //The property to share
        Gio.SettingsBindFlags.DEFAULT
      );

      //Add the row to the group
      this._settingGroups[settingInfo[0]].add(settingRow);
    });
  }

  _updateEnabledSettings() {
    return; //TODO
    /*
     - If quick settings are enabled, disable 'move-icon-setting'
     - If quick settings grouping is disabled, disable 'use-quick-subtitle'
    */
/*
    let moveIconRow = this._builder.get_object('move-icon-setting');
    let groupQuickSettingsRow = this._builder.get_object('group-quick-settings-setting');
    let quickSubtitleSettingsRow = this._builder.get_object('use-quick-subtitle-setting');

    if (this._settings.get_boolean('use-quick-settings')) {
      moveIconRow.set_sensitive(false);
      groupQuickSettingsRow.set_sensitive(true);

      if (!this._settings.get_boolean('group-quick-settings')) {
        quickSubtitleSettingsRow.set_sensitive(false);
      } else {
        quickSubtitleSettingsRow.set_sensitive(true);
      }
    } else {
      moveIconRow.set_sensitive(true);
      groupQuickSettingsRow.set_sensitive(false);
      quickSubtitleSettingsRow.set_sensitive(false);
    }*/
  }
});

export default class PrivacyPreferences extends ExtensionPreferences {
  //Create preferences window with libadwaita
  fillPreferencesWindow(window) {
    //Translated title, icon name
    let pageInfo = [_('Settings'), 'preferences-system-symbolic'];

    let groupsInfo = [
      //Group ID, translated title
      ['general', _('General settings')]
    ];

    let settingsInfo = [
      //Group ID, setting key, title, subtitle
      ['general', 'move-icon-right', _('Move status icon right'), _('Force the icon to move to right side of the status area')],
      ['general', 'use-quick-settings',  _('Use quick settings menu'), _('Use the system quick settings area, instead of an indicator')],
      ['general', 'group-quick-settings',  _('Group quick settings'), _('Group quick settings together, into a menu')],
      ['general', 'use-quick-subtitle',  _('Use quick settings subtitle'), _('Show the privacy status in the quick settings subtitle')]
    ];

    //Create settings page from info
    let settingsPage = new PrefsPage(pageInfo, groupsInfo, settingsInfo, this.getSettings());

    //Add the pages to the window, enable searching
    window.add(settingsPage);
    window.set_search_enabled(true);
  }
}
