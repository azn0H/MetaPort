#!/bin/sh
set -eu
# Run as root from the trusted MetaPort checkout.
checkout=/home/aznoh/mojserver/www/MetaPort
state=/opt/metaport-deploy/self-update
install -d -m 755 /usr/local/lib/metaport-updater
install -m 644 "$checkout/deploy/self_update.py" /usr/local/lib/metaport-updater/self_update.py
install -m 644 "$checkout/deploy/metaport-update.service" /etc/systemd/system/metaport-update.service
install -m 644 "$checkout/deploy/metaport-update.timer" /etc/systemd/system/metaport-update.timer
# Traverse only: the deployment key/state remain root-owned 0600, not readable by aznoh.
chmod 0711 /opt/metaport-deploy
install -d -o aznoh -g aznoh -m 700 "$state"
cat > /etc/metaport-updater.conf <<'EOF'
METAPORT_CHECKOUT=/home/aznoh/mojserver/www/MetaPort
METAPORT_UPDATE_STATE=/opt/metaport-deploy/self-update
METAPORT_UPDATE_BRANCH=codex/compose-deployments-disk
EOF
chmod 600 /etc/metaport-updater.conf
systemctl daemon-reload
systemd-analyze verify /etc/systemd/system/metaport-update.service /etc/systemd/system/metaport-update.timer
systemctl enable --now metaport-update.timer
