/* Native bridge for the Android app. Exposes window.StacksNative; the page checks for it
   and uses it for storage, notifications, sharing, the back button and links.
   In a normal browser (or claude.ai) none of this runs. */
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Clipboard } from '@capacitor/clipboard';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Browser } from '@capacitor/browser';

const DATA = Directory.Data;
/* Two slots, written alternately. If the phone dies mid-write, the other slot is still whole. */
const SLOTS = ['stacks-data-a.json', 'stacks-data-b.json'];
let nextSlot = 0;

async function readSlot(path) {
  try {
    const r = await Filesystem.readFile({ path, directory: DATA, encoding: Encoding.UTF8 });
    const obj = JSON.parse(r.data);
    return obj && typeof obj.savedAt === 'number' && obj.raw && typeof obj.raw === 'object' ? obj : null;
  } catch (e) { return null; }
}

if (Capacitor.isNativePlatform()) {
  window.StacksNative = {
    platform: Capacitor.getPlatform(),
    version: __APP_VERSION__,
    repo: 'EthanReilly/stacks',

    async loadStore() {
      const found = (await Promise.all(SLOTS.map(readSlot))).map((o, i) => o && { ...o, i }).filter(Boolean);
      if (!found.length) return null;
      found.sort((a, b) => b.savedAt - a.savedAt);
      nextSlot = (found[0].i + 1) % SLOTS.length;
      return found[0].raw;
    },
    async saveStore(raw) {
      const path = SLOTS[nextSlot];
      await Filesystem.writeFile({ path, directory: DATA, encoding: Encoding.UTF8, data: JSON.stringify({ savedAt: Date.now(), raw }) });
      nextSlot = (nextSlot + 1) % SLOTS.length;
    },

    async shareFile(filename, text) {
      const w = await Filesystem.writeFile({ path: filename, directory: Directory.Cache, encoding: Encoding.UTF8, data: text });
      await Share.share({ title: 'Stacks backup', text: 'Stacks backup', files: [w.uri], dialogTitle: 'Save your backup' });
    },
    copy: text => Clipboard.write({ string: text }),
    openUrl: url => Browser.open({ url }),
    minimize: () => App.minimizeApp(),
    onBack: fn => App.addListener('backButton', fn),
    onPause: fn => App.addListener('pause', fn),
    onResume: fn => App.addListener('resume', fn),

    notifications: {
      async status() {
        try { return (await LocalNotifications.checkPermissions()).display; } catch (e) { return 'denied'; }
      },
      async request() {
        try { return (await LocalNotifications.requestPermissions()).display; } catch (e) { return 'denied'; }
      },
      async setup(onAction) {
        try {
          await LocalNotifications.createChannel({ id: 'reminders', name: 'Reminders', description: 'Reminders at the time they are due', importance: 5, visibility: 1, vibration: true });
          await LocalNotifications.registerActionTypes({ types: [{ id: 'REMINDER', actions: [{ id: 'done', title: 'Done' }, { id: 'snooze', title: 'Snooze 1 hour' }] }] });
        } catch (e) { /* older Android: channels/actions not needed */ }
        LocalNotifications.addListener('localNotificationActionPerformed', a => onAction(a.actionId, (a.notification && a.notification.extra) || {}));
      },
      /* Replace everything pending with this list: [{ id, rid, at, title, body }] */
      async replaceAll(list) {
        let exact = true;
        try { exact = (await LocalNotifications.checkExactNotificationSetting()).exact_alarm === 'granted'; } catch (e) { /* assume yes */ }
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
        if (!list.length) return;
        await LocalNotifications.schedule({
          notifications: list.map(n => ({
            id: n.id, title: n.title, body: n.body, channelId: 'reminders', actionTypeId: 'REMINDER',
            extra: { rid: n.rid }, smallIcon: 'ic_stat_stacks', iconColor: '#1E5D54', autoCancel: true,
            schedule: { at: new Date(n.at), allowWhileIdle: true },
            /* without exact-alarm access, schedule inexact instead of opening the settings screen */
            isExactNotification: exact
          }))
        });
      }
    }
  };
}
