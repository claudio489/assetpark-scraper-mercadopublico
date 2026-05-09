"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActions = getActions;
exports.hideOpportunity = hideOpportunity;
exports.restoreOpportunity = restoreOpportunity;
exports.saveOpportunity = saveOpportunity;
exports.removeSaved = removeSaved;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_DIR = path_1.default.join(process.cwd(), 'data');
const ACTIONS_FILE = path_1.default.join(DATA_DIR, 'user-actions.json');
function loadActions() {
    try {
        if (fs_1.default.existsSync(ACTIONS_FILE)) {
            return JSON.parse(fs_1.default.readFileSync(ACTIONS_FILE, 'utf-8'));
        }
    }
    catch (e) {
        console.error('[Actions] Error cargando:', e.message);
    }
    return { hidden: [], saved: [] };
}
function saveActions(actions) {
    try {
        if (!fs_1.default.existsSync(DATA_DIR))
            fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
        fs_1.default.writeFileSync(ACTIONS_FILE, JSON.stringify(actions, null, 2));
    }
    catch (e) {
        console.error('[Actions] Error guardando:', e.message);
    }
}
function getActions() {
    return loadActions();
}
function hideOpportunity(id) {
    const actions = loadActions();
    if (!actions.hidden.includes(id)) {
        actions.hidden.push(id);
        saveActions(actions);
    }
    return true;
}
function restoreOpportunity(id) {
    const actions = loadActions();
    actions.hidden = actions.hidden.filter(h => h !== id);
    saveActions(actions);
    return true;
}
function saveOpportunity(item) {
    const actions = loadActions();
    const existing = actions.saved.findIndex(s => s.id === item.id);
    const fullItem = { ...item, savedAt: new Date().toISOString() };
    if (existing >= 0) {
        actions.saved[existing] = fullItem;
    }
    else {
        actions.saved.push(fullItem);
    }
    saveActions(actions);
    return true;
}
function removeSaved(id) {
    const actions = loadActions();
    actions.saved = actions.saved.filter(s => s.id !== id);
    saveActions(actions);
    return true;
}
