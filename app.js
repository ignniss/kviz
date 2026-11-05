// app.js — верзија за стабло манифеста
let корен = null;
let стаза = []; // низ чворова: [корен, историја, праисторија, ...]

const екран = document.getElementById("екран");
const дугмеНазад = document.getElementById("назад");

init();

async function init() {
  try {
    const одг = await fetch("manifest.json");
    if (!одг.ok) throw new Error("HTTP " + одг.status);
    корен = await одг.json();
    console.log("Манифест учитан:", корен);

    стаза = [корен];
    прикажиТренутни();
    дугмеНазад.onclick = назад;
  } catch (е) {
    console.error("Грешка при учитавању манифеста:", е);
    екран.innerHTML =
      "<p class='порука'>Грешка: манифест није учитан. " +
      "Покрени <code>node build.js</code> и отвори сајт преко локалног сервера.</p>";
  }
}

function тренутни() {
  return стаза[стаза.length - 1];
}

function назад() {
  if (стаза.length <= 1) return;
  стаза.pop();
  прикажиТренутни();
}

function прикажиТренутни() {
  const чвор = тренутни();
  дугмеНазад.hidden = стаза.length <= 1;

  // ако чвор има карте → прикажи картицу
  if (чвор.карте && чвор.карте.length > 0) {
    прикажиКартицу(чвор.карте);
    return;
  }

  // иначе прикажи подмени (деца)
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

function прикажиКартицу(карте) {
  const карта = карте[Math.floor(Math.random() * карте.length)];
  екран.innerHTML = "";

  const оквир = document.createElement("div");
  оквир.className = "картица-оквир";

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
    д.onclick = () => провери(д, слово, карта, карте);
    дугмад.appendChild(д);
  });

  const порука = document.createElement("p");
  порука.className = "порука";

  оквир.append(слика, дугмад, порука);
  екран.appendChild(оквир);
}

function провери(дугме, изабрано, карта, свеКарте) {
  const сва = дугме.parentElement.querySelectorAll("button");
  сва.forEach(д => (д.disabled = true));

  const порука = дугме.parentElement.parentElement.querySelector(".порука");

  if (изабрано === карта.тачан) {
    дугме.classList.add("тачно");
    порука.textContent = "✔ Тачно! Следећа картица...";
    setTimeout(() => прикажиКартицу(свеКарте), 1100);
  } else {
    дугме.classList.add("нетачно");
    сва.forEach(д => {
      if (д.textContent === карта.тачан) д.classList.add("тачно");
    });
    порука.textContent = `✘ Нетачно. Тачан одговор: ${карта.тачан}`;
    setTimeout(() => прикажиКартицу(свеКарте), 1600);
  }
}