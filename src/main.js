const core = require('@actions/core');
const TeamsChat = require('./chat')
const JobStatus = require('./status')

async function run() {
  try {
    const name = core.getInput('name', { required: true });
    const url = core.getInput('url', { required: true });
    const status = JobStatus.parse(core.getInput('status', { required: true }));
    const testflight = core.getInput('testflight', { required: false });
    const firebase = core.getInput('firebase', { required: false });
    const registerFirebase = core.getInput('register-firebase', { required: false });

    core.debug(`input params: name=${name}, status=${status}, url=${url}`);

    await TeamsChat.notify(name, url, status, testflight, firebase, registerFirebase);
    console.info('Sent message.')
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else if (typeof error === 'string') {
      core.setFailed(error);
    } else {
      core.setFailed('unexpected error');
    }
  }
}

run();
