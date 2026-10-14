import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Storage } from "./index";

// ローカルのディスク（Docker のボリューム）に保存する。ローカル開発用
export class LocalStorage implements Storage {
  private readonly root: string;

  constructor(root: string) {
    this.root = path.resolve(root);
  }

  // storage_key から保存先のパスを作る。保存先のフォルダの外を指すキーは受け付けない
  private resolve(key: string) {
    const filePath = path.resolve(this.root, key);
    if (!filePath.startsWith(this.root + path.sep)) {
      throw new Error(`不正な storage_key です: ${key}`);
    }
    return filePath;
  }

  async put(key: string, body: Buffer) {
    const filePath = this.resolve(key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, body);
  }

  async get(key: string) {
    try {
      return await readFile(this.resolve(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  async delete(key: string) {
    await rm(this.resolve(key), { force: true });
  }
}
