import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const ACTIONS_FILE = path.join(DATA_DIR, 'user-actions.json');

interface UserActions {
  hidden: string[];     // IDs de licitaciones ocultas
  saved: SavedItem[];   // Licitaciones guardadas
}

interface SavedItem {
  id: string;
  title: string;
  entity: string;
  amount: number;
  closingDate: string;
  url: string;
  recommendation: string;
  score: number;
  savedAt: string;
}

function loadActions(): UserActions {
  try {
    if (fs.existsSync(ACTIONS_FILE)) {
      return JSON.parse(fs.readFileSync(ACTIONS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('[Actions] Error cargando:', (e as Error).message);
  }
  return { hidden: [], saved: [] };
}

function saveActions(actions: UserActions) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(ACTIONS_FILE, JSON.stringify(actions, null, 2));
  } catch (e) {
    console.error('[Actions] Error guardando:', (e as Error).message);
  }
}

export function getActions(): UserActions {
  return loadActions();
}

export function hideOpportunity(id: string): boolean {
  const actions = loadActions();
  if (!actions.hidden.includes(id)) {
    actions.hidden.push(id);
    saveActions(actions);
  }
  return true;
}

export function restoreOpportunity(id: string): boolean {
  const actions = loadActions();
  actions.hidden = actions.hidden.filter(h => h !== id);
  saveActions(actions);
  return true;
}

export function saveOpportunity(item: Omit<SavedItem, 'savedAt'>): boolean {
  const actions = loadActions();
  const existing = actions.saved.findIndex(s => s.id === item.id);
  const fullItem: SavedItem = { ...item, savedAt: new Date().toISOString() };
  if (existing >= 0) {
    actions.saved[existing] = fullItem;
  } else {
    actions.saved.push(fullItem);
  }
  saveActions(actions);
  return true;
}

export function removeSaved(id: string): boolean {
  const actions = loadActions();
  actions.saved = actions.saved.filter(s => s.id !== id);
  saveActions(actions);
  return true;
}
