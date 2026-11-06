// build.js — node build.js
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const КОРЕН = "./kviz";
const ИЗЛАЗ = "./kartice";

if (fs.existsSync(ИЗЛАЗ)) fs.rmSync(ИЗЛАЗ, { recursive: true });
fs.mkdirSync(ИЗЛАЗ, { recursive: true });

const хеш = т => crypto.createHash("md5").update(т).digest("hex").slice(0, 8);
const јеСлика = име => /\.(png|jpe?g)$/i.test(име);

function обиђи(пут, релативнаСтаза) {
  const чвор = {
    назив: path.basename(пут),
    деца: [],
    карте: [],
    позадина: null,
  };
  const ставке = fs.readdirSync(пут).sort();

  for (const ставка of ставке) {
    const пун = path.join(пут, ставка);
    const рел = релативнаСтаза ? релативнаСтаза + "/" + ставка : ставка;

    if (fs.statSync(пун).isDirectory()) {
      чвор.деца.push(обиђи(пун, рел));
    } else if (ставка.toLowerCase() === "pozadina.png") {
      // позадина за овај чвор
      const id = хеш(рел);
      const екст = path.extname(ставка).toLowerCase();
      fs.copyFileSync(пун, path.join(ИЗЛАЗ, "pozadina-" + id + екст));
      чвор.позадина = "kartice/pozadina-" + id + екст;
      console.log("  + позадина:", рел);
    } else if (јеСлика(ставка)) {
      const безЕкст = ставка.replace(/\.(png|jpe?g)$/i, "");
      const делови = безЕкст.split("-");
      const тачан = делови[делови.length - 1];
      const број = делови.slice(0, -1).join("-") || безЕкст;

      if (!тачан || делови.length < 2) {
        console.warn("⚠ Неисправан назив (нема тачан одговор):", рел);
        continue;
      }

      const екст = path.extname(ставка).toLowerCase();
      const id = хеш(рел);
      fs.copyFileSync(пун, path.join(ИЗЛАЗ, id + екст));

      чвор.карте.push({
        id,
        број,
        тачан,
        фајл: "kartice/" + id + екст,
      });
      console.log("  +", рел, "→ тачан:", тачан);
    } else {
      console.warn("⚠ Није слика, прескачем:", рел);
    }
  }

  return чвор;
}

const корен = { назив: "root", деца: [], карте: [], позадина: null };
for (const област of fs.readdirSync(КОРЕН).sort()) {
  const пун = path.join(КОРЕН, област);
  if (fs.statSync(пун).isDirectory()) {
    корен.деца.push(обиђи(пун, област));
  }
}

fs.writeFileSync("manifest.json", JSON.stringify(корен, null, 2));
console.log("✔ Манифест генерисан.");
console.log("Области:", корен.деца.map(д => `${д.назив} (${д.деца.length} потфолдера)`));