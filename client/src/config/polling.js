// Interval pemuatan ulang data portal. Satu jam mengurangi beban API eksternal
// tanpa mengubah mekanisme refresh manual atau pembaruan setelah aksi admin.
export const DATA_POLLING_INTERVAL_MS = 60 * 60 * 1000;
