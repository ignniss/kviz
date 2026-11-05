// app.js — верзија са редоследом, резултатом и великим словима
let корен = null;
let стаза = [];
let сесија = null; // { карте: [...], индекс: 0, тачно: 0, нетачно: 0 }

const екран = document.getElementById("екран");
const дугмеНазад = document.getElementById("назад");

init();

async function init() {
  try {
    const одг = await fetch("manifest.json");
    if (!одг.ok) throw new Error("HTTP " + одг.status);
    корен = await одг.json();
    стаза = [корен];
    прикажиТренутни();
    дугмеНазад.onclick = назад;
  } catch (е) {
    console.error("Грешка:", е);
    екран.innerHTML =
      "<p class='порука'>Грешка: манифест није учитан.</p>";
  }
}

function тренутни() {
  return стаза[стаза.length - 1];
}

function назад() {
  if (стаза.length <= 1) return;
  сесија = null; // напусти игру ако се вратиш
  стаза.pop();
  прикажиТренутни();
}

function прикажиТренутни() {
  const чвор = тренутни();
  дугмеНазад.hidden = стаза.length <= 1;

  if (чвор.карте && чвор.карте.length > 0) {
    започниСесију(чвор.карте);
    return;
  }

  направиМени(
    чвор.деца.map(д => ({
      текст: лепоИме(д.назив),
      клик: () => {
        стаза.push(д);
        прикажиТренутни();
      },
    }))
  );
}

function лепоИме(н) {
  return н.charAt(0).toUpperCase() + н.slice(1);
}

function направиМени(ставке) {
  екран.innerHTML = "";
  if (!ставке.length) {
    екран.innerHTML = "<p class='порука'>Овде још нема карата.</p>";
    return;
  }
  const мени = document.createElement("div");
  мени.className = "мени";
  ставке.forEach((с, и) => {
    const д = document.createElement("button");
    д.className = "ставка-менија";
    д.textContent = с.текст;
    д.style.animationDelay = `${и * 60}ms`;
    д.onclick = с.клик;
    мени.appendChild(д);
  });
  екран.appendChild(мени);
}

/* ---------- СЕСИЈА ---------- */
function започниСесију(карте) {
  // насумични редослед (Fisher–Yates)
  const поредак = [...карте];
  for (let i = поредак.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [поредак[i], поредак[j]] = [поредак[j], поредак[i]];
  }
  сесија = { карте: поредак, индекс: 0, тачно: 0, нетачно: 0 };
  прикажиСледећу();
}

function прикажиСледећу() {
  if (сесија.индекс >= сесија.карте.length) {
    прикажиРезултат();
    return;
  }
  прикажиКартицу(сесија.карте[сесија.индекс]);
}

function прикажиКартицу(карта) {
  екран.innerHTML = "";

  const оквир = document.createElement("div");
  оквир.className = "картица-оквир";

  // прогрес
  const прогрес = document.createElement("div");
  прогрес.className = "прогрес";
  прогрес.innerHTML = `
    <span class="прогрес-текст">Питање ${сесија.индекс + 1} / ${сесија.карте.length}</span>
    <div class="прогрес-трака">
      <div class="прогрес-пуњење" style="width:${(сесија.индекс / сесија.карте.length) * 100}%"></div>
    </div>
  `;

  const слика = document.createElement("img");
  слика.className = "картица-слика";
  слика.draggable = false;
  слика.oncontextmenu = е => е.preventDefault();
  слика.src = карта.фајл;

  const дугмад = document.createElement("div");
  дугмад.className = "дугмад";

  ["А", "Б", "В", "Г"].forEach((слово, и) => {
    const д = document.createElement("button");
    д.className = "дугме-одговор";
    д.textContent = слово;
    д.style.animationDelay = `${400 + и * 70}ms`;
    д.onclick = () => провери(д, слово, карта);
    дугмад.appendChild(д);
  });

  const порука = document.createElement("p");
  порука.className = "порука";

  оквир.append(прогрес, слика, дугмад, порука);
  екран.appendChild(оквир);
}

function провери(дугме, изабрано, карта) {
  const сва = дугме.parentElement.querySelectorAll("button");
  сва.forEach(д => (д.disabled = true));
  const порука = дугме.parentElement.parentElement.querySelector(".порука");

  if (изабрано === карта.тачан) {
    сесија.тачно++;
    дугме.classList.add("тачно");
    порука.textContent = "✔ Тачно!";
    сесија.индекс++;
    setTimeout(прикажиСледећу, 1000);
  } else {
    сесија.нетачно++;
    дугме.classList.add("нетачно");
    сва.forEach(д => {
      if (д.textContent === карта.тачан) д.classList.add("тачно");
    });
    порука.textContent = `✘ Нетачно. Тачан одговор: ${карта.тачан}`;
    сесија.индекс++;
    // дуже задржавање да се прочита тачан одговор
    setTimeout(прикажиСледећу, 2600);
  }
}

/* ---------- РЕЗУЛТАТ ---------- */
function прикажиРезултат() {
  дугмеНазад.hidden = false;
  екран.innerHTML = "";

  const укупно = сесија.карте.length;
  const проценат = Math.round((сесија.тачно / укупно) * 100);

  const оквир = document.createElement("div");
  оквир.className = "резултат-оквир";

  оквир.innerHTML = `
    <div class="резултат-круг" style="--попуњено:${проценат}%">
      <span class="резултат-број">${проценат}%</span>
    </div>
    <h2 class="резултат-наслов">${проценат === 100 ? "Савршено!" : проценат >= 70 ? "Одлично!" : проценат >= 40 ? "Солидно!" : "Покушај поново"}</h2>
    <p class="резултат-детаљи">
      Тачно: <strong>${сесија.тачно}</strong> / ${укупно}
    </p>
    <div class="резултат-дугмад">
      <button class="ставка-менија резултат-понови" id="понови">Играј поново</button>
      <button class="ставка-менија резултат-назад" id="изађи">Назад</button>
    </div>
  `;

  екран.appendChild(оквир);

  document.getElementById("понови").onclick = () => започниСесију(тренутни().карте);
  document.getElementById("изађи").onclick = назад;
}