SHELL=bash
UUID=PrivacyMenu@stuarthayhurst

.PHONY: build check release translations prune compress install uninstall clean

build:
	gnome-extensions pack --force --podir=po --extra-source=LICENSE.txt --extra-source=docs/CHANGELOG.md --extra-source=icons/
check:
	if [[ ! -f "$(UUID).shell-extension.zip" ]]; then \
	  echo -e "WARNING! Extension zip couldn't be found"; exit 1; \
	elif [[ "$$(stat -c %s $(UUID).shell-extension.zip)" -gt 4096000 ]]; then \
	  echo -e "\nWARNING! The extension is too big to be uploaded to the extensions website, keep it smaller than 4096 KB"; exit 1; \
	fi
release:
	$(MAKE) translations
	$(MAKE) prune
	$(MAKE) compress
	$(MAKE) build
	$(MAKE) check
translations:
	./scripts/update-pot.sh
	./scripts/update-po.sh -a
prune:
	./scripts/clean-svgs.py
compress:
	optipng -o7 -strip all docs/*.png
install:
	gnome-extensions install "$(UUID).shell-extension.zip" --force
uninstall:
	gnome-extensions uninstall "$(UUID)"
clean:
	rm -rf locale po/*.po~ "$(UUID).shell-extension.zip"
