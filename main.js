const input = document.getElementById('nickInput');
const searchBtn = document.getElementById('searchBtn');
const btnText = document.getElementById('btnText');
const btnLoader = document.getElementById('btnLoader');
const sideHistory = document.getElementById('sideHistory');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');
const modalTitle = document.getElementById('modalTitle');
const modalClose = document.getElementById('modalClose');
const onlineCount = document.getElementById('onlineCount');

setInterval(async () => {
  try {
    const response = await fetch("https://impoverished-bemusedly-chase.ngrok-free.dev/online");
    if (!response.ok) throw new Error("Błąd sieci");
    
    const data = await response.json();
    onlineCount.textContent = data.online;
  } catch (error) {
    console.error("Nie udało się pobrać liczby online:", error);
  }
}, 3000);

function loadHistory() {
  sideHistory.innerHTML = '';
  const h = JSON.parse(localStorage.getItem('mc_history') || '[]');
  const lastFive = h.slice(0, 5);
  lastFive.forEach(nick => {
    const div = document.createElement('div');
    div.className = 'side-item';
    div.innerHTML = `
      <img src="https://mc-heads.net/avatar/${encodeURIComponent(nick)}/32" alt="skin">
      <span>${nick}</span>
    `;
    div.onclick = () => { input.value = nick; doSearch(nick); };
    sideHistory.appendChild(div);
  });
}
function pushHistory(nick) {
  if (!nick) return;
  const h = JSON.parse(localStorage.getItem('mc_history') || '[]');
  if (!h.includes(nick)) h.unshift(nick);
  if (h.length > 10) h.splice(10);
  localStorage.setItem('mc_history', JSON.stringify(h));
  loadHistory();
}

async function doSearch(nick) {
  nick = (nick || input.value || '').trim();
  if (!nick) return;

  btnText.style.display = 'none';
  btnLoader.style.display = 'block';

  try {
    const res = await fetch(CONFIG.API_URL + encodeURIComponent(nick), {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    const data = await res.json();

    btnText.style.display = 'block';
    btnLoader.style.display = 'none';

    if (!data || !Array.isArray(data.wyniki) || data.wyniki.length === 0) {
      showModal(`<div>❌ Brak wyników dla: <b>${nick}</b></div>`);
      pushHistory(nick);
      return;
    }

    let rows = data.wyniki.map(w => {
      let ip = '-';
      if (w.zawartosc && w.zawartosc.includes(':')) {
        ip = w.zawartosc.split(':')[1]?.trim() || '-';
      }

      return `
        <tr>
          <td>${w.nick || nick}</td>
          <td>${ip}</td>
          <td>${w.wyciek || w.plik || '-'}</td>
        </tr>
      `;
    }).join('');

    const table = `
      <table>
        <thead>
          <tr><th>Nick</th><th>IP</th><th>Wyciek</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    modalTitle.innerHTML = `Wyniki wyszukiwania | Premium? Nie`;
    modalContent.innerHTML = table;
    showModal();
    pushHistory(nick);
  } catch (e) {
    btnText.style.display = 'block';
    btnLoader.style.display = 'none';
    showModal(`<div>⚠️ Błąd połączenia z API.</div>`);
  }
}

function showModal(html) {
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
}
function hideModal() {
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
}
modalClose.addEventListener('click', hideModal);
window.addEventListener('click', e => { if (e.target === modal) hideModal(); });

searchBtn.addEventListener('click', () => doSearch());
input.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

loadHistory();
