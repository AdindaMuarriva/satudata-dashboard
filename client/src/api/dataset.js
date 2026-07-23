import {
  deleteDataset as deleteStoredDataset,
  fetchDatasetMeta,
  fetchDatasetValues,
  fetchDatasetsMultiPage,
  getLocalDatasets,
  saveDatasetChanges,
  saveLocalDataset,
} from "../api";

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
  const { rows, totalCount } = await fetchDatasetsMultiPage();
  const activeRows = rows.filter((dataset) => !isTrashed(dataset));
  return { rows: activeRows, totalCount: Math.max(0, totalCount - (rows.length - activeRows.length)) };
}

// Returns soft-deleted datasets together with the date they were moved to trash.
export async function getTrashDatasets() {
  const localTrash = getLocalDatasets()
    .filter((dataset) => dataset.deleted_at)
    .map((dataset) => ({ ...dataset, trashed_at: dataset.deleted_at }));
  const localIds = new Set(localTrash.map(getDatasetId));
  const remoteTrash = getTrashedRecords()
    .filter((record) => !localIds.has(record.id))
    .map((record) => ({ ...record.dataset, trashed_at: record.trashed_at }));

  return [...localTrash, ...remoteTrash].sort(
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
  saveDatasetChanges(id, { is_active: isActive });
}

// Soft-deletes a dataset so it can be restored from the trash page.
export async function moveDatasetToTrash(dataset) {
  const id = getDatasetId(dataset);
  const trashedAt = new Date().toISOString();

  if (String(id).startsWith("local-")) {
    saveDatasetChanges(id, { deleted_at: trashedAt });
    return;
  }

  const records = getTrashedRecords().filter((record) => record.id !== id);
  records.push({ id, dataset, trashed_at: trashedAt, previous_status: getDatasetStatus(dataset) });
  saveTrashedRecords(records);
}

// Restores a soft-deleted dataset and preserves its previous active status.
export async function restoreDataset(dataset) {
  const id = getDatasetId(dataset);

  if (String(id).startsWith("local-")) {
    saveDatasetChanges(id, { deleted_at: null });
    return;
  }

  saveTrashedRecords(getTrashedRecords().filter((record) => record.id !== id));
}

// Permanently removes a dataset only after it has been placed in the trash.
export async function deleteDataset(id) {
  saveTrashedRecords(getTrashedRecords().filter((record) => record.id !== id));
  deleteStoredDataset(id);
}
