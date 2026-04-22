import path from 'path';

function getProjectRoot() {
  return process.cwd();
}

export function getProjectRootPath() {
  return getProjectRoot();
}

export function getLogsDir() {
  return path.join(getProjectRoot(), 'logs');
}

export function resolveLogPath(logPath: string) {
  return path.isAbsolute(logPath) ? logPath : path.join(getProjectRoot(), logPath);
}

export function resolveProjectPath(relativePath: string) {
  return path.isAbsolute(relativePath) ? relativePath : path.join(getProjectRoot(), relativePath);
}
