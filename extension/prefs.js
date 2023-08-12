/* exported init fillPreferencesWindow buildPrefsWidget */

//Local extension imports
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { ExtensionHelper } = Me.imports.lib;
const ShellVersion = parseFloat(imports.misc.config.PACKAGE_VERSION);

//Main imports
const { Gtk, Gio } = imports.gi;
const Adw = imports.gi.Adw;

//Use _() for translations
const _ = imports.gettext.domain(Me.metadata.uuid).gettext;

var PrefsPages = class PrefsPages {
  constructor() {
    this._settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.privacy-menu');

    this._builder = new Gtk.Builder();
    this._builder.set_translation_domain(Me.metadata.uuid);

    this.preferencesWidget = null;
    this._createPreferences();
  }

  _updateEnabledSettings() {
    //If using the quick settings area, disable 'move-icon-setting'
    let moveIconRow = this._builder.get_object('move-icon-setting');
    if (this._settings.get_boolean('use-quick-settings')) {
      moveIconRow.set_sensitive(false);
    } else {
      moveIconRow.set_sensitive(true);
    }

    //If the quick settings aren't in use, disable related options
    let groupQuickSettingsRow = this._builder.get_object('group-quick-settings-setting');
    let quickSubtitleSettingsRow = this._builder.get_object('use-quick-subtitle-setting');
    if (!this._settings.get_boolean('use-quick-settings')) {
      groupQuickSettingsRow.set_sensitive(false);
      quickSubtitleSettingsRow.set_sensitive(false);
    } else {
      groupQuickSettingsRow.set_sensitive(true);
      if (!this._settings.get_boolean('group-quick-settings')) {
        quickSubtitleSettingsRow.set_sensitive(false);
      } else {
        quickSubtitleSettingsRow.set_sensitive(true);
      }
    }

    //Grey out GNOME 44+ settings on earlier versions
    if (ShellVersion < 44) {
      let settingsArea = this._builder.get_object('gnome-44-settings-area');
      settingsArea.set_sensitive(false);
    }
  }

  _createPreferences() {
    this._builder.add_from_file(Me.path + '/gtk4/prefs.ui');

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

function init() {
  ExtensionUtils.initTranslations();
}

//Create preferences window with libadwaita
function fillPreferencesWindow(window) {
  //Create pages and widgets
  let prefsPages = new PrefsPages();
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
