import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "redux";

interface Column {
  id: string;
  label: string;
  visible: boolean;
}

interface TableState {
  rows: Array<Record<string, any>>;
  columns: Column[];
  sorting: { columnId: string; direction: "asc" | "desc" | null };
  pagination: { page: number; rowsPerPage: number };
  search: string;
}

const initialColumns: Column[] = [
  { id: "name", label: "Name", visible: true },
  { id: "email", label: "Email", visible: true },
  { id: "age", label: "Age", visible: true },
  { id: "role", label: "Role", visible: true },
];

const initialState: TableState = {
  rows: [
    { name: "Alice", email: "alice@example.com", age: 22, role: "Admin" },
    { name: "Bob", email: "bob@example.com", age: 30, role: "User" },
    { name: "Charlie", email: "charlie@example.com", age: 27, role: "User" },
    { name: "Diana", email: "diana@example.com", age: 24, role: "Owner" },
    { name: "Evan", email: "evan@example.com", age: 21, role: "User" },
    { name: "Faith", email: "faith@example.com", age: 29, role: "Admin" },
    { name: "George", email: "george@example.com", age: 26, role: "User" },
    { name: "Helen", email: "helen@example.com", age: 25, role: "User" },
    { name: "Ivan", email: "ivan@example.com", age: 33, role: "Owner" },
    { name: "Jane", email: "jane@example.com", age: 32, role: "User" },
    { name: "Karl", email: "karl@example.com", age: 28, role: "Admin" },
    { name: "Linda", email: "linda@example.com", age: 23, role: "User" },
    { name: "Mark", email: "mark@example.com", age: 31, role: "User" },
    { name: "Nina", email: "nina@example.com", age: 27, role: "Owner" },
    { name: "Oscar", email: "oscar@example.com", age: 22, role: "User" },
    { name: "Paula", email: "paula@example.com", age: 30, role: "Admin" },
    { name: "Quinn", email: "quinn@example.com", age: 30, role: "User" },
    { name: "Rita", email: "rita@example.com", age: 28, role: "User" },
    { name: "Steve", email: "steve@example.com", age: 25, role: "Admin" },
    { name: "Tina", email: "tina@example.com", age: 24, role: "User" },
  ], // rough data
  columns: initialColumns,
  sorting: { columnId: "", direction: null },
  pagination: { page: 0, rowsPerPage: 10 },
  search: "",
};

const tableSlice = createSlice({
  name: "table",
  initialState,
  reducers: {
    setRows(state, action: PayloadAction<Array<Record<string, any>>>) {
      state.rows = action.payload;
    },
    toggleColumnVisibility(state, action: PayloadAction<string>) {
      const column = state.columns.find((c) => c.id === action.payload);
      if (column) column.visible = !column.visible;
    },
    addColumn(state, action: PayloadAction<{ id: string; label: string }>) {
      const exists = state.columns.find((c) => c.id === action.payload.id);
      if (!exists) {
        state.columns.push({
          id: action.payload.id,
          label: action.payload.label,
          visible: true,
        });
      }
    },
    setSorting(
      state,
      action: PayloadAction<{
        columnId: string;
        direction: "asc" | "desc" | null;
      }>
    ) {
      state.sorting = action.payload;
    },
    setPage(state, action: PayloadAction<number>) {
      state.pagination.page = action.payload;
    },
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
      state.pagination.page = 0; // reset page on search change
    },
  },
});

const persistConfig = {
  key: "root",
  version: 1,
  storage,
  whitelist: ["table"],
};

const rootReducer = combineReducers({
  table: tableSlice.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export const {
  setRows,
  toggleColumnVisibility,
  addColumn,
  setSorting,
  setPage,
  setSearch,
} = tableSlice.actions;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
