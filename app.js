const chat = document.getElementById("chat");
const openChatBtn = document.getElementById("openChat");
const closeChatBtn = document.getElementById("closeChat");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const messages = document.getElementById("messages");

const API_URL = "https://gen.pollinations.ai/text/";
const API_TOKEN = "sk_wElzqoskAs0O5cvZrvl7v9XhURXuXLk0";

// ====== HISTORY SETTINGS ======
const STORAGE_KEY = "chat_history_v2";
let chatHistory = [];

// Сколько сообщений отправлять в модель как контекст
const MAX_CONTEXT_MESSAGES = 12;

// ====== Open / close chat ======
openChatBtn.addEventListener("click", () => {
  chat.classList.add("active");
  userInput.focus();
});

closeChatBtn.addEventListener("click", () => {
  chat.classList.remove("active");
});

// ====== LocalStorage ======
function saveHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory));
}

function loadHistory() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return;

    chatHistory = parsed;

    messages.innerHTML = "";
    chatHistory.forEach((m) => addMessage(m.text, m.from, false));
  } catch (e) {
    console.error("Ошибка чтения истории:", e);
  }
}

function clearHistory() {
  chatHistory = [];
  localStorage.removeItem(STORAGE_KEY);
  messages.innerHTML = "";
}

// ====== UI ======
function addMessage(text, from = "user", save = true) {
  const div = document.createElement("div");
  div.className = `message ${from}`;
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;

  if (save) {
    chatHistory.push({ from, text });
    saveHistory();
  }
}

// ====== PROMPT WITH MEMORY ======
function buildPromptWithHistory(userText) {
  // Берём последние N сообщений (чтобы prompt не раздувался)
  const context = chatHistory.slice(-MAX_CONTEXT_MESSAGES);

  // Превращаем историю в текст
  const historyText = context
    .map((m) => {
      const role = m.from === "user" ? "User" : "Assistant";
      return `${role}: ${m.text}`;
    })
    .join("\n");

  return `Задай несколько вопросов собеседнику и оцени его эмоциональное состояние по шкале от 0 до 10 по следующим параметрам: Гнев, Обида, Страх, Уверенность, Эмпатия. 
  Когда надо будет прекрати задавать вопросы и отдай результат.

История диалога:
${historyText}

Текущий вопрос пользователя:
User: ${userText}
Assistant:`;
}

// ====== Clear button ======
const clearBtn = document.createElement("button");
clearBtn.type = "button";
clearBtn.textContent = "Очистить";
clearBtn.style.width = "30%";
clearBtn.style.cursor = "pointer";
chatForm.appendChild(clearBtn);

clearBtn.addEventListener("click", () => {
  clearHistory();
  addMessage("Память очищена ✅", "assistant");
});

// ====== Send message ======
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = userInput.value.trim();
  if (!text) return;

  // 1) Добавляем сообщение пользователя в историю
  addMessage(text, "user");
  userInput.value = "";

  // 2) Добавляем временный ответ ассистента
  addMessage("Думаю…", "assistant");

  try {
    // ⚠️ Важно: buildPromptWithHistory берёт chatHistory,
    // где уже есть последнее сообщение пользователя
    const prompt = buildPromptWithHistory(text);

    const res = await fetch(API_URL + encodeURIComponent(prompt), {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    const data = await res.text();

    // 3) Обновляем DOM
    messages.lastChild.textContent = data;

    // 4) Обновляем последнее сообщение ассистента в истории
    chatHistory[chatHistory.length - 1].text = data;
    saveHistory();
  } catch (err) {
    messages.lastChild.textContent = "Ошибка при обращении к ИИ";

    chatHistory[chatHistory.length - 1].text = "Ошибка при обращении к ИИ";
    saveHistory();

    console.error(err);
  }
});

// ====== INIT ======
loadHistory();
