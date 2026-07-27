import {
  deleteDataset as deleteStoredDataset,
  fetchDatasetMeta,
  fetchDatasetValues,
  fetchDatasetsMultiPage,
  getLocalDatasets,
  invalidateDatasetCatalog,
  saveDatasetChanges,
  saveLocalDataset,
} from "../api";
import { saveDatasetVisibility } from "./datasetVisibility";

const TRASH_DATASETS_KEY = "satudata_trashed_datasets";

function getDatasetId(dataset) {
  return dataset?.uuid || dataset?.id;
}

function getTrashedRecords() {
  if (typeof window === "undefined") return [];

  try {
    const records = JSON.parse(window.localStorage.getItem(TRASH_DATASETS_KEY) || "[]");
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}

function saveTrashedRecords(records) {
  window.localStorage.setItem(TRASH_DATASETS_KEY, JSON.stringify(records));
  window.dispatchEvent(new Event("satudata-local-datasets-updated"));
}

function isTrashed(dataset) {
  const id = getDatasetId(dataset);
  return Boolean(dataset?.deleted_at) || getTrashedRecords().some((record) => record.id === id);
}

export function getDatasetStatus(dataset) {
  return dataset?.is_active === false ? "Nonaktif" : "Aktif";
}

// Returns all portal datasets combined with locally created and edited datasets.
export async function getDatasets() {
  const { rows, totalCount } = await fetchDatasetsMultiPage({ includeHidden: true });
  const activeRows = rows.filter((dataset) => !isTrashed(dataset));
  return { rows: activeRows, totalCount: Math.max(0, totalCount - (rows.length - activeRows.length)) };
}

// Returns soft-deleted datasets together with the date they were moved to trash.
export async function getTrashDatasets() {
  const localTrash = getLocalDatasets()
    .filter((dataset) => dataset.deleted_at)
    .map((dataset) => ({ ...dataset, trashed_at: dataset.deleted_at }));
  const localIds = new Set(localTrash.map(getDatasetId));
  const legacyRecords = getTrashedRecords();

  // Versi awal menyimpan sampah dataset portal di localStorage. Saat admin
  // membuka halaman ini, pindahkan catatan tersebut ke Supabase agar status
  // menjadi global dan tetap terlihat pada perangkat lain.
  const migratedIds = new Set();
  await Promise.all(legacyRecords.map(async (record) => {
    try {
      await saveDatasetVisibility(record.id, {
        deleted_at: record.trashed_at || new Date().toISOString(),
        permanently_deleted: false,
      });
      migratedIds.add(record.id);
    } catch (error) {
      console.warn("Gagal memigrasikan item sampah lama:", error.message);
    }
  }));
  if (migratedIds.size) {
    saveTrashedRecords(legacyRecords.filter((record) => !migratedIds.has(record.id)));
    invalidateDatasetCatalog();
  }

  const { rows } = await fetchDatasetsMultiPage({ includeHidden: true });
  const remoteTrash = rows
    .filter((dataset) => dataset.deleted_at && !dataset.permanently_deleted && !localIds.has(getDatasetId(dataset)))
    .map((dataset) => ({ ...dataset, trashed_at: dataset.deleted_at }));

  // Bila proses migrasi gagal (misalnya jaringan putus), item tetap terlihat
  // sehingga admin tidak kehilangan akses untuk memulihkan atau menghapusnya.
  const remainingLegacyTrash = legacyRecords
    .filter((record) => !migratedIds.has(record.id) && !localIds.has(record.id))
    .map((record) => ({ ...record.dataset, trashed_at: record.trashed_at }));

  return [...localTrash, ...remoteTrash, ...remainingLegacyTrash].sort(
    (a, b) => new Date(b.trashed_at) - new Date(a.trashed_at)
  );
}

// Returns the metadata and tabular values needed by the dataset editor.
export async function getDatasetById(id) {
  const [metadata, values] = await Promise.all([
    fetchDatasetMeta(id),
    fetchDatasetValues(id, null),
  ]);

  return { metadata, values };
}

// Stores a newly created local dataset and returns its updated local count.
export async function createDataset(dataset) {
  saveLocalDataset(dataset);
  return { dataset, totalLocalDatasets: getLocalDatasets().length };
}

// Applies dataset metadata and row changes through the existing data store.
export async function updateDataset(id, changes) {
  saveDatasetChanges(id, changes);
}

// Changes an active dataset status without removing it from the active list.
export async function setDatasetActive(id, isActive) {
  if (String(id).startsWith("local-")) {
    saveDatasetChanges(id, { is_active: isActive });
    return;
  }
  await saveDatasetVisibility(id, { is_active: isActive });
  invalidateDatasetCatalog();
  window.dispatchEvent(new Event("satudata-local-datasets-updated"));
}

// Soft-deletes a dataset so it can be restored from the trash page.
export async function moveDatasetToTrash(dataset) {
  const id = getDatasetId(dataset);
  const trashedAt = new Date().toISOString();

  if (String(id).startsWith("local-")) {
    saveDatasetChanges(id, { deleted_at: trashedAt });
    return;
  }
  await saveDatasetVisibility(id, { deleted_at: trashedAt, permanently_deleted: false });
  invalidateDatasetCatalog();
  window.dispatchEvent(new Event("satudata-local-datasets-updated"));
}

// Restores a soft-deleted dataset and preserves its previous active status.
export async function restoreDataset(dataset) {
  const id = getDatasetId(dataset);

  if (String(id).startsWith("local-")) {
    saveDatasetChanges(id, { deleted_at: null });
    return;
  }
  await saveDatasetVisibility(id, { deleted_at: null, permanently_deleted: false });
  invalidateDatasetCatalog();
  window.dispatchEvent(new Event("satudata-local-datasets-updated"));
}

// Permanently removes a dataset only after it has been placed in the trash.
export async function deleteDataset(id) {
  if (String(id).startsWith("local-")) {
    deleteStoredDataset(id);
    return;
  }
  await saveDatasetVisibility(id, { deleted_at: new Date().toISOString(), permanently_deleted: true });
  invalidateDatasetCatalog();
  window.dispatchEvent(new Event("satudata-local-datasets-updated"));
}
