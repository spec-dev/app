module.exports = {
  packagerConfig: {
    icon: "public/spec-icon",
    osxSign: {},
    osxNotarize: {
      tool: "notarytool",
      keychainProfile: "spec",
    },
  },
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
};
