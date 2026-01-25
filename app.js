const chat = document.getElementById('chat');
const openChatBtn = document.getElementById('openChat');
const closeChatBtn = document.getElementById('closeChat');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const messages = document.getElementById('messages');

const API_URL = 'https://gen.pollinations.ai/text/';
const API_TOKEN = 'sk_wElzqoskAs0O5cvZrvl7v9XhURXuXLk0';

// Open / close chat
openChatBtn.addEventListener('click', () => {
  chat.classList.add('active');
  userInput.focus();
});

closeChatBtn.addEventListener('click', () => {
  chat.classList.remove('active');
});

// Helpers
function addMessage(text, from = 'user') {
  const div = document.createElement('div');
  div.className = `message ${from}`;
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function buildPrompt(text) {
  return `Оцени эмоциональное состояние автора текста по шкале от 0 до 10 по следующим параметрам: Гнев, Обида, Страх, Уверенность, Эмпатия. Текст: ${text}`;
//   return `Оцени эмоциональное состояние автора текста по шкале от 0 до 10 по следующим параметрам: Гнев, Обида, Страх, Уверенность, Эмпатия. Верни результат строго в формате:\nГнев: X\nОбида: X\nСтрах: X\nУверенность: X\nЭмпатия: X\n\nТекст: "${text}"`;
}

// Send message
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  userInput.value = '';

  addMessage('Анализирую эмоции…', 'assistant');

  try {
    const prompt = buildPrompt(text);

    const res = await fetch(API_URL + encodeURIComponent(prompt), {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`
      }
    });

    const data = await res.text();

    // replace last assistant message
    messages.lastChild.textContent = data;
  } catch (err) {
    messages.lastChild.textContent = 'Ошибка при обращении к ИИ';
    console.error(err);
  }
});
