import { readFileSync, writeFileSync } from "fs";
import semver, { ReleaseType } from "semver";
import { prompt } from "enquirer";
import { findUp, detectInstaller, exec } from "@charrue/toolkit/dist/node";
import { colorizeMessage } from "@charrue/toolkit";

const versionIncrements = [
  "patch",
  "minor",
  "major",
];

// eslint-disable-next-line max-statements
export const startRelease = async (options: { cwd: string; version: string }) => {
  let { version: targetVersion } = options;
  const { cwd } = options;
  const packageJson = findUp("package.json", { cwd, type: "file" });
  const packageJsonContent = JSON.parse(readFileSync(packageJson, "utf8"));
  const currentVersion: string = packageJsonContent.version;
  const packageName = packageJsonContent.name;
  const installer = detectInstaller(cwd) || "npm";

  const versionIncrement = (release: string) => semver.inc(currentVersion, release as ReleaseType);

  // 如果没有指定发布版本，则需要手动选择
  if (!targetVersion) {
    const { release } = await prompt<{ release: string }>({
      type: "select",
      name: "release",
      message: "Select release type",
      choices: versionIncrements.map((i) => `${i} (${versionIncrement(i)})`).concat([ "custom" ]),
    });

    if (release === "custom") {
      targetVersion = (
        await prompt<{ version: string }>({
          type: "input",
          name: "version",
          message: "Input custom version",
          initial: currentVersion,
        })
      ).version;
    } else {
      const matched = release.match(/\((.*)\)/);
      targetVersion = matched ? matched[1] : currentVersion;
    }
  }

  if (!semver.valid(targetVersion)) {
    throw new Error(`Invalid version: ${targetVersion}`);
  }

  const { yes } = await prompt<{ yes: boolean }>({
    type: "confirm",
    name: "yes",
    message: `Releasing v${targetVersion}. Confirm?`,
  });

  if (!yes) {
    return;
  }
  // console.log(colorizeMessage("\nRunning tests..."));
  // exec(`${installer} run test`, cwd);

  console.log(colorizeMessage("\nUpdating package version..."));
  writeFileSync(
    packageJson,
    JSON.stringify({
      ...packageJsonContent,
      version: targetVersion,
    }, null, 2),
  );

  console.log(colorizeMessage("\nBuilding package..."));
  exec(`${installer} run build`, cwd);

  console.log(colorizeMessage("\nGenerating changelog..."));
  exec(`${installer} run changelog`, cwd);

  console.log(colorizeMessage("\nUpdating lockfile..."));
  exec(`${installer} install --prefer-offline`, cwd);

  const outputMessage = exec("git diff");
  if (outputMessage) {
    console.log(colorizeMessage("\nCommitting changes..."));
    try {
      exec("git add -A");
      exec(`git commit -m "build\: v${targetVersion}"`, cwd);
    } catch (e: any) {
      // 恢复原来的版本
      writeFileSync(
        packageJson,
        JSON.stringify(packageJsonContent, null, 2),
      );
      console.log(colorizeMessage(e.message, "error"));
    }
  } else {
    console.log(colorizeMessage("No changes to commit."));
  }

  console.log(colorizeMessage(`\nPublishing package ${packageName}...`));
  try {
    exec(`${installer} publish --new-version ${targetVersion} --access=public`, cwd);
    console.log(colorizeMessage(`Successfully published ${packageName}@${targetVersion}`));
  } catch (e: any) {
    if (e.stderr?.match(/previously published/)) {
      console.log(colorizeMessage(`Skipping already published: ${packageName}`));
    } else {
      throw e;
    }
  }

  console.log(colorizeMessage("\nPushing to remote..."));
  exec(`git tag v${targetVersion}`, cwd);
  exec(`git push origin refs/tags/v${targetVersion}`, cwd);
  exec(`git push`, cwd);
};
