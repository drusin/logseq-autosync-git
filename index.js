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
const debounceSetting = {
  key: 'git-sync:debounce-s',
  title: 'How long the plugin waits after you stopped typing to sync (in seconds)',
  type: 'number',
  default: 5,
}

const settings = [commitMessageSetting, debounceSetting];

function msg(message = '', blocking = false) {
  logseq.UI.showMsg(message);
  if (blocking) {
    alert(message);
  }
}

let scheduledSync;
function debounce(func) {
  if (scheduledSync) {
    clearTimeout(scheduledSync);
  }
  scheduledSync = setTimeout(async () => await func(), logseq.settings[debounceSetting.key] * 1000);
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

async function start() {
  const syncResult = await sync();
  if (syncResult) {
    msg('Sync successful');
  }
  else {
    msg('Could not sync repository');
  }
  logseq.DB.onChanged(() => debounce(save));
  logseq.beforeunload(async () => await save());
}

logseq.useSettingsSchema(settings).ready(start).catch(console.error);
