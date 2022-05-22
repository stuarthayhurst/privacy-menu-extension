/* exported resetSettings */

//Functions to assist program operation
const { Gio } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

//Use _() for translations
const _ = imports.gettext.domain(Me.metadata.uuid).gettext;

function resetSettings() {
  let privacySettings = new Gio.Settings({ schema: 'org.gnome.desktop.privacy' });
  let locationSettings = new Gio.Settings({ schema: 'org.gnome.system.location' });

  //Reset the settings
  locationSettings.reset('enabled');
  privacySettings.reset('disable-camera');
  privacySettings.reset('disable-microphone');

  //Translators: Reset is past tense, as in it's just reset the settings
  logMessage(_('Reset privacy settings'));
}

function logMessage(message) {
  date = new Date();
  timestamp = date.toTimeString().split(' ')[0];
  log('privacy-menu-extension [' + timestamp + ']: ' + message);
}
