const util = require("util");
const exec = util.promisify(require("child_process").exec);

const fs = require("fs");
const log_file = fs.createWriteStream(__dirname + "/forge_packager.log", {
  flags: "w",
});
const log_stdout = process.stdout;

console.log = function (d, ...args) {
  log_file.write(util.format(d, ...args) + "\n");
  log_stdout.write(util.format(d, ...args) + "\n");
};

module.exports = {
  packagerConfig: {
    icon: "public/spec-icon",
    osxSign: {
      identity: "Developer ID Application: Spec Development Inc. (57XXZJ46MB)",
      optionsForFile: (filePath) => {
        if (filePath.endsWith("sidecars/bin/mac/spec")) {
          return {
            entitlements: "entitlements.plist",
          };
        }
        return {};
      },
    },
    osxNotarize: {
      tool: "notarytool",
      keychainProfile: "spec",
    },
  },
  derefSymlinks: true,
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          description: "Supercharge Postgres with live Web3 data",
          icon: "public/spec-icon.png",
        },
      },
    },
    {
      name: "@electron-forge/maker-dmg",
      config: {
        format: "ULFO",
        icon: "public/spec-icon.icns",
      },
    },
  ],
  hooks: {
    packageAfterCopy: async (
      config,
      buildPath,
      electronVersion,
      platform,
      arch
    ) => {
      let sidecarPlatform = "";
      switch (platform) {
        case "darwin":
        case "sunos":
          sidecarPlatform = "mac";
          break;
        case "win32":
          sidecarPlatform = "win";
          break;
        default:
          sidecarPlatform = "linux";
          break;
      }

      // delete all folders in sidecars/bin that do not match the current platform
      const sidecarsBinPath = `${buildPath}/sidecars/bin`;
      const sidecarsBinDir = fs.opendirSync(sidecarsBinPath);
      let dirent;
      while ((dirent = sidecarsBinDir.readSync()) !== null) {
        if (dirent.isDirectory() && dirent.name !== sidecarPlatform) {
          fs.rmdirSync(`${sidecarsBinPath}/${dirent.name}`, {
            recursive: true,
          });
        }
      }
      sidecarsBinDir.closeSync();

      if (platform === "darwin") {
        const binaryPath = `${buildPath}/sidecars/bin/mac/spec`;
        try {
          const { stdout, stderr } = await exec(
            `codesign --deep --force --sign "Developer ID Application: Spec Development Inc. (57XXZJ46MB)" ${binaryPath}`
          );
          console.log("stdout:", stdout);
          console.log("stderr:", stderr);
        } catch (err) {
          console.log(err);
        }
      }
    },
  },
};
