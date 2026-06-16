// src/lib/localStore.js — armazenamento 100% local da frota (IndexedDB)
// ----------------------------------------------------------------------------
// A frota inteira fica guardada no navegador via IndexedDB (biblioteca "idb").
// Não precisa de internet, servidor nem login.
// Use os botões "Backup" e "Importar" para salvar/restaurar um arquivo .json.
//
// DISPONIBILIDADE: em modo incógnito/privado (Firefox, Safari) o IndexedDB pode
// estar bloqueado. Nesse caso o app funciona normalmente na sessão, mas os
// dados não são persistidos ao fechar o navegador. O flag `storageDisponivel()`
// permite exibir um aviso ao usuário.
// ----------------------------------------------------------------------------
import { openDB } from "idb";

const DB_NAME = "sisdelu-local";
const DB_VERSION = 1;
const STORE = "dados";
const CHAVE_FROTA = "frota";

export const FROTA_VAZIA = { ordem: [], aeronaves: {} };

let _storageDisponivel = true;

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
  },
}).catch((e) => {
  _storageDisponivel = false;
  console.warn("[SisDeLu] IndexedDB indisponível — dados não serão persistidos:", e);
  return null;
});

/** Retorna true se o IndexedDB está disponível neste navegador/sessão. */
export const storageDisponivel = () => _storageDisponivel;

/** Lê a frota salva no navegador. Se nunca foi salva ou se o storage falhou, devolve uma frota vazia. */
export async function carregarFrota() {
  try {
    const db = await dbPromise;
    if (!db) return structuredClone(FROTA_VAZIA);
    const dados = await db.get(STORE, CHAVE_FROTA);
    return dados || structuredClone(FROTA_VAZIA);
  } catch (e) {
    console.warn("[SisDeLu] Falha ao carregar frota do IndexedDB:", e);
    return structuredClone(FROTA_VAZIA);
  }
}

/** Salva a frota inteira no navegador (sobrescreve a versão anterior). */
export async function salvarFrota(fleet) {
  try {
    const db = await dbPromise;
    if (!db) return; // storage indisponível — ignora silenciosamente
    await db.put(STORE, fleet, CHAVE_FROTA);
  } catch (e) {
    console.warn("[SisDeLu] Falha ao salvar frota no IndexedDB:", e);
  }
}
