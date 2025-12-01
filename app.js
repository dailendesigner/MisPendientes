// app.js (sin cambios lógicos — mejoras UI)
const STORAGE_KEY = 'mispedientes.tasks';
const seedUrl = 'tasks.json';

const el = {
  list: document.getElementById('tasks-list'),
  input: document.getElementById('task-input'),
  addBtn: document.getElementById('add-btn'),
  hideDone: document.getElementById('hide-done'),
  clearDone: document.getElementById('clear-done'),
  resetSeed: document.getElementById('reset-seed'),
  template: document.getElementById('task-template'),
  emptyNote: document.getElementById('empty')
};

let tasks = [];

const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
const loadFromLocal = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
};
const newId = () => (tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1);

function createTaskNode(task){
  const frag = el.template.content.cloneNode(true);
  const li = frag.querySelector('.task-item');
  const titleSpan = frag.querySelector('.task-title');
  const meta = frag.querySelector('.task-meta');
  const check = frag.querySelector('.task-check');
  const editBtn = frag.querySelector('.edit-btn');
  const deleteBtn = frag.querySelector('.delete-btn');

  titleSpan.textContent = task.title;
  meta.textContent = task.done ? 'Completada' : '';
  if (task.done) titleSpan.classList.add('done'); else titleSpan.classList.remove('done');
  check.checked = task.done;

  check.addEventListener('change', () => {
    task.done = check.checked;
    save();
    render();
  });

  editBtn.addEventListener('click', () => {
    const newTitle = prompt('Editar tarea:', task.title);
    if (newTitle === null) return;
    const trimmed = newTitle.trim();
    if (trimmed.length) {
      task.title = trimmed;
      save();
      render();
    } else alert('El título no puede estar vacío.');
  });

  deleteBtn.addEventListener('click', () => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    tasks = tasks.filter(t => t.id !== task.id);
    save();
    render();
  });

  li.classList.add('enter');
  return frag;
}

function render() {
  el.list.innerHTML = '';
  const hideDone = el.hideDone.checked;
  const filtered = hideDone ? tasks.filter(t => !t.done) : tasks;
  if (!filtered.length) {
    el.emptyNote.style.display = 'block';
  } else {
    el.emptyNote.style.display = 'none';
    filtered.forEach(task => {
      const node = createTaskNode(task);
      el.list.appendChild(node);
    });
  }
}

async function loadSeed() {
  try {
    const resp = await fetch(seedUrl, {cache: "no-store"});
    if (!resp.ok) throw new Error('No se pudo cargar tasks.json');
    const arr = await resp.json();
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    console.warn('Cargar semilla falló:', e);
    return [];
  }
}

async function init() {
  const local = loadFromLocal();
  if (local && Array.isArray(local) && local.length) {
    tasks = local;
  } else {
    const seed = await loadSeed();
    tasks = seed.map(t => ({ ...t }));
    save();
  }

  el.addBtn.addEventListener('click', addTaskFromInput);
  el.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTaskFromInput(); });
  el.hideDone.addEventListener('change', render);
  el.clearDone.addEventListener('click', () => {
    if (!confirm('Borrar todas las completadas?')) return;
    tasks = tasks.filter(t => !t.done);
    save();
    render();
  });
  el.resetSeed.addEventListener('click', async () => {
    if (!confirm('Resetear a tasks.json?')) return;
    const seed = await loadSeed();
    tasks = seed.map(t => ({ ...t }));
    save();
    render();
  });

  render();
}

function addTaskFromInput(){
  const value = el.input.value.trim();
  if (!value) return;
  const task = { id: newId(), title: value, done: false };
  tasks.unshift(task); // newest on top
  el.input.value = '';
  save();
  render();
}

init();
