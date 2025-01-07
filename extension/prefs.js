//Main imports
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
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
    this._settingRows = {};

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

      //Add the row to the group, and save for later
      this._settingGroups[settingInfo[0]].add(settingRow);
      this._settingRows[settingInfo[1]] = settingRow;
    });
  }

  addLinks(window, linksInfo, groupName) {
    //Setup and add links group to window
    let linksGroup = new Adw.PreferencesGroup();
    linksGroup.set_title(groupName);
    this.add(linksGroup);

    linksInfo.forEach((linkInfo) => {
      //Create a row for the link widget
      let linkEntryRow = new Adw.ActionRow({
        title: linkInfo[0],
        subtitle: linkInfo[1],
        activatable: true
      });

      //Open the link when clicked
      linkEntryRow.connect('activated', () => {
        let uriLauncher = new Gtk.UriLauncher();
        uriLauncher.set_uri(linkInfo[2]);
        uriLauncher.launch(window, null, null);
      });

      linksGroup.add(linkEntryRow);
    });
  }

  _updateEnabledSettings() {
    /*
     - If quick settings are enabled, disable 'move-icon-setting' option
     - If quick settings grouping is disabled, disable 'use-quick-subtitle' option
    */

    let moveIconRow = this._settingRows['move-icon-right'];
    let groupQuickSettingsRow = this._settingRows['group-quick-settings'];
    let quickSubtitleSettingsRow = this._settingRows['use-quick-subtitle'];
    let clickToggleRow = this._settingRows['click-to-toggle'];

    if (this._extensionSettings.get_boolean('use-quick-settings')) {
      moveIconRow.set_sensitive(false);
      groupQuickSettingsRow.set_sensitive(true);

      if (!this._extensionSettings.get_boolean('group-quick-settings')) {
        quickSubtitleSettingsRow.set_sensitive(false);
        clickToggleRow.set_sensitive(false);
      } else {
        quickSubtitleSettingsRow.set_sensitive(true);
        clickToggleRow.set_sensitive(true);
      }
    } else {
      moveIconRow.set_sensitive(true);
      groupQuickSettingsRow.set_sensitive(false);
      quickSubtitleSettingsRow.set_sensitive(false);
      clickToggleRow.set_sensitive(false);
    }
  }
});

export default class PrivacyQuickSettingsPrefs extends ExtensionPreferences {
  //Create preferences window with libadwaita
  fillPreferencesWindow(window) {
    //Translated title, icon name
    let pageInfo = [_('Settings'), 'preferences-system-symbolic'];

    let groupsInfo = [
      //Group ID, translated title
      ['general', _('General settings')],
      ['menu', _('Menu settings')]
    ];

    let settingsInfo = [
      //Group ID, setting key, title, subtitle
      ['general', 'move-icon-right', _('Move status icon right'), _('Force the icon to move to right side of the status area')],
      ['menu', 'use-quick-settings',  _('Use quick settings menu'), _('Use the system quick settings area, instead of an indicator')],
      ['menu', 'group-quick-settings',  _('Group quick settings'), _('Group quick settings together, into a menu')],
      ['menu', 'use-quick-subtitle',  _('Use quick settings subtitle'), _('Show the privacy status in the quick settings subtitle')],
      ['menu', 'click-to-toggle',  _('Toggle all settings at once'), _('Enable or disable all privacy settings at once, when the group is pressed')]
    ];

    //Create settings page from info
    let settingsPage = new PrefsPage(pageInfo, groupsInfo, settingsInfo, this.getSettings());

    //Define and add links
    let linksInfo = [
      //Translated title, link
      [_('Report an issue'), _('GitHub issue tracker'), 'https://github.com/stuarthayhurst/privacy-menu-extension/issues'],
      [_('Donate via GitHub'), _('Become a sponsor'), 'https://github.com/sponsors/stuarthayhurst'],
      [_('Donate via PayPal'), _('Thanks for your support :)'), 'https://www.paypal.me/stuartahayhurst']
    ];
    settingsPage.addLinks(window, linksInfo, _("Links"));

    //Add the pages to the window, enable searching
    window.add(settingsPage);
    window.set_search_enabled(true);
  }
}
