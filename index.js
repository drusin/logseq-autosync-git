import '@logseq/libs'

const COMMIT_MESSAGE = '"commit from logseq-autosync-git"';
const DEBOUNCE_MS = 5_000;

const commitMessageSetting = {
  key: 'git-sync:commit-message',
  title: 'Commit message used for automatic sync',
  description: 'This message will appear in your git log',
  type: 'string',
  default: 'commit from logseq-autosync-git',
}
const intervalSetting = {
  key: 'git-sync:interval-s',
  title: 'The plugin will check every x seconds after changes were made for the user to exit edit mode',
  type: 'number',
  default: 5,
}

const settings = [commitMessageSetting, intervalSetting];

function msg(message = '', blocking = false) {
  logseq.UI.showMsg(message);
  if (blocking) {
    alert(message);
  }
}

async function sync() {
  return await git([['fetch'], ['rebase', '--autostash']]);
}

async function save() {
  await sync();
  const success = await git([['add', '.'], ['commit', '-m', logseq.settings[commitMessageSetting.key]], ['push']]);
  if (success) {
    msg('Save successful');
  }
}

async function git(allParams = []) {
  for (const param of allParams) {
    const result = await logseq.Git.execCommand(param);
    if (result.exitCode != 0 && result.stderr) {
      msg('' + result.exitCode + '\n' + result.stdout + '\n' + result.stderr, true);
      return false;
    }
  }
  return true;
}

let dirty = false;
let saving = false;

function onChanged() {
  if (dirty) {
    return;
  }
  dirty = true;
  trySync();
}

async function trySync() {
  if (await logseq.Editor.checkEditing()) {
    setTimeout(trySync, logseq.settings[intervalSetting.key] * 1000);
    return;
  }
  if (!dirty || saving) {
    return;
  }
  saving = true;
  await save();
  dirty = false;
  saving = false;
}

async function start() {
  console.log('logseq-autosync-git started');
  const syncResult = await sync();
  if (syncResult) {
    msg('Sync successful');
  }
  else {
    msg('Could not sync repository');
  }
  logseq.DB.onChanged(onChanged);
}

logseq.useSettingsSchema(settings).ready(start).catch(console.error);
