var path = require("path");

function getServiceDirectory(env) {
  return "/home/deployer/multipurpose-node-server/";
}

module.exports = function(shipit) {
  require("shipit-deploy")(shipit);

  shipit.initConfig({
    default: {
      workspace: "./build",
      deployTo: "/home/deployer/multipurpose-node-server/to",
      repositoryUrl: "git@github.com:Aathi/node-server-pdf-gen.git",
      ignores: [".git", "node_modules"],
      rsync: ["--del"],
      keepReleases: 2,
      shallowClone: true
    },
    staging: {
      servers: "deployer@167.99.94.128"
    }
  });

  shipit.task("pwd", function() {
    return shipit.remote("pwd");
  });

  shipit.on("deployed", () => {
    shipit.start("stop", "copy", "npm", "start");
  });

  shipit.blTask("stop", () => {
    return shipit.remote(`pm2 stop app_${shipit.environment} -s`).catch(err => {
      return Promise.resolve();
    });
  });

  shipit.blTask("copy", () => {
    let serviceDir = getServiceDirectory(shipit.environment);

    var currRelease = path.join(shipit.releasesPath, shipit.releaseDirname);
    return shipit.remote(`cp -R ${currRelease}/* ${serviceDir}`);
  });

  shipit.blTask("npm", () => {
    let serviceDir = getServiceDirectory(shipit.environment);

    return shipit.remote(`cd ${serviceDir}; yarn install`);
  });

  shipit.blTask("start", () => {
    let serviceDir = getServiceDirectory(shipit.environment);

    return shipit.remote(
      `pm2 start --cwd ${serviceDir} /usr/bin/npm --name 'app_${
        shipit.environment
      }' -- run start`
    );
  });
};
