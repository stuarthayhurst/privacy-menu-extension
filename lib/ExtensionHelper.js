//Functions to assist program operation
const { Gio } = imports.gi;

function resetSettings() {
  let privacySettings = new Gio.Settings( {schema: 'org.gnome.desktop.privacy'} );
  let locationSettings = new Gio.Settings({ schema: 'org.gnome.system.location'} );

  //Reset the settings
  locationSettings.reset('enabled');
  privacySettings.reset('disable-camera');
  privacySettings.reset('disable-microphone');

  logMessage(_('Reset privacy settings'));
}

function logMessage(message) {
  date = new Date();
  timestamp = date.toTimeString().split(' ')[0];
  log('privacy-menu-extension [' + timestamp + ']: ' + message);
}
