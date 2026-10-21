import { readdir, readlink, realpath } from 'node:fs/promises';
import path from 'node:path';

export function validateVersion(value) {
  if (
    typeof value !== 'string' ||
    value.length > 80 ||
    !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?$/.test(
      value,
    )
  )
    throw new Error('Use a version such as 0.1.0 or 0.2.0-beta.1, without v.');
  return value;
}

export async function assertReleaseTree(directory) {
  const root = await realpath(directory);
  const within = (target) => {
    const relative = path.relative(root, target);
    return (
      relative === '' ||
      (!relative.startsWith(`..${path.sep}`) &&
        relative !== '..' &&
        !path.isAbsolute(relative))
    );
  };
  async function inspect(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const name = entry.name.toLowerCase();
      if (
        name.startsWith('.env') ||
        ['.git', '.data', 'tmp', '.wrangler', '.sites-runtime'].includes(
          name,
        ) ||
        /\.(log|pem|key)$/.test(name)
      )
        throw new Error(
          `Release contains a forbidden file: ${path.relative(root, path.join(current, entry.name))}`,
        );
      const item = path.join(current, entry.name);
      if (entry.isSymbolicLink()) {
        const link = await readlink(item);
        if (path.isAbsolute(link) || !within(await realpath(item)))
          throw new Error(
            'Release contains a non-portable or escaping symlink',
          );
      } else if (entry.isDirectory()) await inspect(item);
      else if (!entry.isFile())
        throw new Error('Release contains a special file');
    }
  }
  await inspect(root);
}
