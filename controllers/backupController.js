const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const dayjs = require("dayjs");

const BACKUP_DIR = path.join(__dirname, "..", "uploads", "backup", "database");

const ensureBackupDir = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
};

const runCommand = (command, args, env) => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env });

    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      if (error.code === "ENOENT") {
        reject(
          new Error(
            `Perintah "${command}" tidak ditemukan di server. Pastikan MySQL client terpasang.`
          )
        );
        return;
      }

      reject(error);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `${command} keluar dengan kode ${code}`));
        return;
      }

      resolve();
    });
  });
};

const backupDatabase = async (req, res) => {
  ensureBackupDir();

  const dbName = process.env.DB_NAME;
  const filename = `backup-${dbName}-${dayjs().format("YYYY-MM-DD-HHmmss")}.sql`;
  const filePath = path.join(BACKUP_DIR, filename);

  try {
    const env = {
      ...process.env,
      MYSQL_PWD: process.env.DB_PASSWORD || "",
    };

    const args = [
      "-h",
      process.env.DB_HOST,
      "--protocol=TCP",
      "-u",
      process.env.DB_USERNAME,
      "--routines",
      "--triggers",
      "--single-transaction",
      "--result-file",
      filePath,
      dbName,
    ];

    await runCommand("mysqldump", args, env);

    return res.download(filePath, filename, (error) => {
      if (error) {
        console.error("Error mengirim file backup:", error);
      }
    });
  } catch (error) {
    console.error("ERROR BACKUP DATABASE:", error);

    fs.unlink(filePath, () => {});

    return res.status(500).json({
      status: "error",
      message: "Backup database gagal.",
      error: error.message,
    });
  }
};

const restoreDatabase = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      status: "error",
      message: "File backup .sql wajib diupload.",
    });
  }

  const filePath = req.file.path;

  try {
    const env = {
      ...process.env,
      MYSQL_PWD: process.env.DB_PASSWORD || "",
    };

    const sqlContent = fs.readFileSync(filePath, "utf8");

    await new Promise((resolve, reject) => {
      const child = spawn(
        "mysql",
        [
          "-h",
          process.env.DB_HOST,
          "--protocol=TCP",
          "-u",
          process.env.DB_USERNAME,
          process.env.DB_NAME,
        ],
        { env }
      );

      let stderr = "";

      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      child.on("error", (error) => {
        if (error.code === "ENOENT") {
          reject(
            new Error(
              `Perintah "mysql" tidak ditemukan di server. Pastikan MySQL client terpasang.`
            )
          );
          return;
        }

        reject(error);
      });

      child.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(stderr || `mysql keluar dengan kode ${code}`));
          return;
        }

        resolve();
      });

      child.stdin.write(sqlContent);
      child.stdin.end();
    });

    return res.status(200).json({
      status: "success",
      message: "Restore database berhasil.",
    });
  } catch (error) {
    console.error("ERROR RESTORE DATABASE:", error);

    return res.status(500).json({
      status: "error",
      message: "Restore database gagal.",
      error: error.message,
    });
  } finally {
    fs.unlink(filePath, () => {});
  }
};

const isSafeFilename = (name) => {
  return (
    typeof name === "string" &&
    name.endsWith(".sql") &&
    !name.includes("/") &&
    !name.includes("..")
  );
};

const downloadBackup = async (req, res) => {
  const { filename } = req.params;

  if (!isSafeFilename(filename)) {
    return res.status(400).json({
      status: "error",
      message: "Nama file tidak valid.",
    });
  }

  const filePath = path.join(BACKUP_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      status: "error",
      message: "File backup tidak ditemukan.",
    });
  }

  return res.download(filePath, filename);
};

const deleteBackup = async (req, res) => {
  const { filename } = req.params;

  if (!isSafeFilename(filename)) {
    return res.status(400).json({
      status: "error",
      message: "Nama file tidak valid.",
    });
  }

  const filePath = path.join(BACKUP_DIR, filename);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return res.status(200).json({
      status: "success",
      message: "Backup berhasil dihapus.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal menghapus backup.",
      error: error.message,
    });
  }
};

const listBackup = async (req, res) => {
  ensureBackupDir();

  try {
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((name) => name.endsWith(".sql"))
      .map((name) => {
        const stat = fs.statSync(path.join(BACKUP_DIR, name));

        return {
          name,
          size: stat.size,
          created_at: stat.mtime,
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.status(200).json({
      status: "success",
      data: files,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil daftar backup.",
      error: error.message,
    });
  }
};

module.exports = {
  backupDatabase,
  restoreDatabase,
  listBackup,
  downloadBackup,
  deleteBackup,
};
