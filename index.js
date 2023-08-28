import '@logseq/libs'

const COMMIT_MESSAGE = '"commit from logseq-autosync-git"';
const DEBOUNCE_MS = 5_000;


async function start() {
  const syncResult = await sync();
  if (syncResult) {
    msg('Sync successful');
  }
  else {
    msg('Could not sync repository');
  }
  logseq.DB.onChanged(debounce(save));
}

logseq.ready(start).catch(console.error);


function msg(message = '', blocking = false) {
  logseq.UI.showMsg(message);
  if (blocking) {
    alert(message);
  }
}

// https://www.freecodecamp.org/news/javascript-debounce-example/
function debounce(func) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), DEBOUNCE_MS);
  }
}

async function sync() {
  return await git([['fetch'], ['rebase', '--autostash']]);
}

async function save() {
  await sync();
  const success = await git([['add', '.'], ['commit', '-m', COMMIT_MESSAGE], ['push']]);
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
