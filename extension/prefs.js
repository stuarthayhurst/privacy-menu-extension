/* exported PrivacyPreferences */

//Main imports
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import Adw from 'gi://Adw';

//Extension system imports
import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

var PrefsPages = class PrefsPages {
  constructor(path, uuid, settings) {
    this._settings = settings;
    this._path = path;

    this._builder = new Gtk.Builder();
    this._builder.set_translation_domain(uuid);

    this.preferencesWidget = null;
    this._createPreferences();
  }

  _updateEnabledSettings() {
    /*
     - If quick settings are enabled, disable 'move-icon-setting'
     - If quick settings grouping is disabled, disable 'use-quick-subtitle'
    */

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
    }
  }

  _createPreferences() {
    this._builder.add_from_file(this._path + '/gtk4/prefs.ui');

    //Get the settings container widget
    this.preferencesWidget = this._builder.get_object('main-prefs');

    let settingElements = {
      'move-icon-switch': {
        'settingKey': 'move-icon-right',
        'bindProperty': 'active'
      },
      'use-quick-settings-switch': {
        'settingKey': 'use-quick-settings',
        'bindProperty': 'active'
      },
      'group-quick-settings-switch': {
        'settingKey': 'group-quick-settings',
        'bindProperty': 'active'
      },
      'use-quick-subtitle-switch': {
        'settingKey': 'use-quick-subtitle',
        'bindProperty': 'active'
      }
    }

    //Loop through settings toggles and dropdowns and bind together
    Object.keys(settingElements).forEach((element) => {
      this._settings.bind(
        settingElements[element].settingKey, //GSettings key to bind to
        this._builder.get_object(element), //GTK UI element to bind to
        settingElements[element].bindProperty, //The property to share
        Gio.SettingsBindFlags.DEFAULT
      );
    });

    //Disable unavailable settings
    this._settingsChangedSignal = this._settings.connect('changed', () => {
      this._updateEnabledSettings();
    });
    this._updateEnabledSettings();
  }
}

export default class PrivacyPreferences extends ExtensionPreferences {
  //Create preferences window with libadwaita
  fillPreferencesWindow(window) {
    //Create pages and widgets
    let prefsPages = new PrefsPages(this.path, this.uuid, this.getSettings());
    let settingsPage = new Adw.PreferencesPage();
    let settingsGroup = new Adw.PreferencesGroup();

    //Build the settings page
    settingsPage.set_title(_('Settings'));
    settingsPage.set_icon_name('preferences-system-symbolic');
    settingsGroup.add(prefsPages.preferencesWidget);
    settingsPage.add(settingsGroup);

    //Add the pages to the window
    window.add(settingsPage);
  }
}
