import fs from "fs-extra";
import AdmZip from "adm-zip";
import path from "path";

function extractPhone(jid) {
  if (!jid) return null;
  return jid.split("@")[0].replace(/\D/g, "");
}

async function loadSessionFromFolder(folderPath) {
  const credsPath = path.join(folderPath, "creds.json");
  if (fs.existsSync(credsPath)) {
    const creds = JSON.parse(fs.readFileSync(credsPath));
    if (creds.me?.id) return creds.me.id;
  }

  const files = fs.readdirSync(folderPath);
  for (const f of files) {
    if (f.endsWith(".json")) {
      const data = JSON.parse(fs.readFileSync(path.join(folderPath, f)));
      if (data.wid?.user) return data.wid.user;
      if (data.clientId) return data.clientId;
    }
  }

  return null;
}

async function loadSessionFromZip(zipPath) {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();
  for (const entry of entries) {
    if (entry.entryName.endsWith(".json")) {
      const data = JSON.parse(entry.getData().toString("utf-8"));
      if (data.me?.id) return data.me.id;
      if (data.wid?.user) return data.wid.user;
      if (data.clientId) return data.clientId;
    }
  }
  return null;
}

async function main() {
  let jid = null;

  const base64ZipPath = "./session/base64.zip";
  if (fs.existsSync(base64ZipPath)) {
    console.log("Detected Base64 ZIP session...");
    const zipBuffer = Buffer.from(fs.readFileSync(base64ZipPath, "utf-8"), "base64");
    fs.writeFileSync("./session/tmp.zip", zipBuffer);
    jid = await loadSessionFromZip("./session/tmp.zip");
    fs.removeSync("./session/tmp.zip");
  } else if (fs.existsSync("./session")) {
    jid = await loadSessionFromFolder("./session");
  } else {
    console.log("❌ No session folder or ZIP found!");
    process.exit();
  }

  if (!jid) {
    console.log("❌ Could not extract JID from session.");
    process.exit();
  }

  console.log("JID  :", jid);
  console.log("Phone:", extractPhone(jid));
}

main();
