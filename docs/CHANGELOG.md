## Changelog:

### v18: - `2023-08-16`
**This release will be the final release to support pre-45 versions of GNOME**
 - Updated translations (#32)
 - Added Brazilian Portuguese translation - [Daimar](https://github.com/not-a-dev-stein) (#33)
 - Added GitHub sponsor link to metadata

### v17: - `2023-07-21`
 - Code cleanup
 - Open the grouped settings when any part of the indicator is pressed
 - Added a subtitle to grouped settings to show current status
   - Added a setting to control new subtitle status
 - Updated translations (#28, #29, #30, #31)

### v16: - `2023-07-10`
 - Hotfix: removed unused import (Clutter)

### v15: - `2023-07-10`
 - New design for grouped quick settings
   - Moved settings out of submenus
   - Each setting gets an icon, label and toggle switch
 - Updated Italian translation (#25)
 - Updated Dutch translation (#26)

### v14: - `2023-06-25`
 - Added setting to group quick setting toggles
 - Use GtkBox as parent element, instead of GtkGrid
 - Stopped translating log messages
 - Build system improvements
 - General code cleanup
 - README and documentation fixes

### v13: - `2023-06-10`
 - Added donation information to metadata
 - Internal code structure changes (preparation for future)

### v12: - `2023-05-27`
 - Renamed extension to "Privacy Quick Settings"
 - Replaced tray icon with system privacy icon
 - Added Czech translation - [Amereyeu](https://github.com/Amereyeu) (#22)
 - Added Persian translation - [mskf1383](https://github.com/mskf1383) (#23)

### v11: - `2023-03-20`
 - Added Finnish translation - [SamuLumio](https://github.com/SamuLumio) (#21)
 - Moved settings toggles above background apps entry in GNOME 44

### v10: - `2023-03-01`
 - Removed unused import from `prefs.js`
 - Build system, runner and README improvements
 - Simplify UI file definitions
 - Added GNOME 44 support

### v9: - `2022-10-09`
 - Updated Italian translation #18
 - Added Russian translation - [ikibastus1](https://github.com/ikibastus1)

### v8: - `2022-10-03`
 - Added support for new quick settings area (GNOME 43+)
 - Renamed extension to display as "Privacy Quick Settings Menu"
 - Updated extension logo and screenshot
 - Updated README and styling
 - Code quality improvements

### v7: - `2022-09-11`
 - Added GNOME 43 support
 - Minor documentation changes

### v6: - `2022-05-22`
 - Updated GitHub runner to Ubuntu 22.04 and Python 3.10, test entire build system faster
 - Added preferences menu (#8)
 - Added preference for position of the status indicator (#8)
 - Updated README for new build targets and dependencies (#8)
 - Updated documentation
 - Build system and structure improvements
 - Code styling and quality improvements

### v5: - `2022-03-12`
 - GNOME 42 support (no changes required)
 - Build system updates

### v4: - `2021-10-10`
 - Added Italian translation - [albanobattistella](https://github.com/albanobattistella)

### v3: - `2021-09-29`
 - Added German translation - [Etamuk](https://github.com/Etamuk), [Philipp Kiemle](https://github.com/daPhipz)
 - Updated README and build system

### v2: - `2021-09-19`
 - Added missing semicolon
 - Added timestamp to log messages
 - Added Dutch translation - [Heimen Stoffels](https://github.com/Vistaus)
 - Moved `Reset to defaults` into a submenu, to prevent misclicking it
 - Potentially improved memory management
 - Updated screenshot

### v1: - `2021-09-12`
 - Initial release
