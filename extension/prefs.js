/* exported init fillPreferencesWindow buildPrefsWidget */

//Local extension imports
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { ExtensionHelper } = Me.imports.lib;
const ShellVersion = parseFloat(imports.misc.config.PACKAGE_VERSION);

//Main imports
const { Gtk, Gio, GLib } = imports.gi;
const Adw = ShellVersion >= 42 ? imports.gi.Adw : null;

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
    //If using the quick settings area and running GNOME 43, disable 'move-icon-setting'
    let moveIconBox = this._builder.get_object('move-icon-setting');
    if (ShellVersion >= 43 && this._settings.get_boolean('use-quick-settings')) {
      moveIconBox.set_sensitive(false);
    } else {
      moveIconBox.set_sensitive(true);
    }

    //Grey out GNOME 43+ settings on earlier version
    if (ShellVersion < 43) {
      let quickSettingsBox = this._builder.get_object('gnome-43-settings-area');
      quickSettingsBox.set_sensitive(false);
    }
  }

  _createPreferences() {
    //Use different UI file for GNOME 40+ and 3.38
    if (ShellVersion >= 40) {
      this._builder.add_from_file(Me.path + '/ui/prefs-gtk4.ui');
    } else {
      this._builder.add_from_file(Me.path + '/ui/prefs.ui');
    }

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

//Create preferences window for GNOME 42+
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

//Create preferences window for GNOME 3.38 - 41
function buildPrefsWidget() {
  let prefsPages = new PrefsPages();
  let settingsWindow = new Gtk.ScrolledWindow();

  //Use a stack to store pages
  let pageStack = new Gtk.Stack();
  pageStack.add_titled(prefsPages.preferencesWidget, 'settings', _('Settings'));

  let pageSwitcher = new Gtk.StackSwitcher();
  pageSwitcher.set_stack(pageStack);

  //Add the stack to the scrolled window
  if (ShellVersion >= 40) {
    settingsWindow.set_child(pageStack);
  } else {
    settingsWindow.add(pageStack);
  }

  //Enable all elements differently for GNOME 40+ and 3.38
  if (ShellVersion >= 40) {
    settingsWindow.show();
  } else {
    settingsWindow.show_all();
  }

  //Modify top bar to add a page menu, when the window is ready
  settingsWindow.connect('realize', () => {
    let window = ShellVersion >= 40 ? settingsWindow.get_root() : settingsWindow.get_toplevel();
    let headerBar = window.get_titlebar();

    //Add page switching menu to header
    if (ShellVersion >= 40) {
      headerBar.set_title_widget(pageSwitcher);
    } else {
      headerBar.set_custom_title(pageSwitcher);
    }
    pageSwitcher.show();
  });

  return settingsWindow;
}
