import React, { useMemo, useState, useRef } from "react";
import { useAppSelector, useAppDispatch } from "../hooks";
import { Button } from "@mui/material";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import { setSorting, setSearch, setPage, setRows, addColumn } from "../store";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DownloadIcon from "@mui/icons-material/Download";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  TablePagination,
  TextField,
  Box,
} from "@mui/material";
import ManageColumnsModal from "./ManageColumnsModal";

export default function TableManager() {
  const [importError, setImportError] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState(Date.now()); // Unique key for input reset
  const dispatch = useAppDispatch();
  const [modalOpen, setModalOpen] = useState(false);
  const allColumns = useAppSelector((state) => state.table.columns);
  const columns = useMemo(
    () => allColumns.filter((c) => c.visible),
    [allColumns]
  );
  const rows = useAppSelector((state) => state.table.rows);
  const sorting = useAppSelector((state) => state.table.sorting);
  const search = useAppSelector((state) => state.table.search);
  const pagination = useAppSelector((state) => state.table.pagination);
  const REQUIRED_COLUMNS = ["Name", "Email", "Age", "Role"];
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ------------- search, sort, then paginate -------------

  // Filter rows by global search
  const filteredRows = useMemo(() => {
    if (!search) return rows;
    const lowerSearch = search.toLowerCase();
    return rows.filter((row) =>
      columns.some((col) => {
        const cellValue = String(row[col.id] ?? "").toLowerCase();
        return cellValue.includes(lowerSearch);
      })
    );
  }, [rows, search, columns]);

  // Sort rows
  const sortedRows = useMemo(() => {
    const { columnId, direction } = sorting;
    if (!columnId || !direction) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const av = a[columnId];
      const bv = b[columnId];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av === bv) return 0;
      if (typeof av === "number" && typeof bv === "number") {
        return direction === "asc" ? av - bv : bv - av;
      }
      return direction === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [filteredRows, sorting]);

  // Paginate rows (10 per page)
  const paginatedRows = useMemo(() => {
    const startIndex = pagination.page * pagination.rowsPerPage;
    return sortedRows.slice(startIndex, startIndex + pagination.rowsPerPage);
  }, [sortedRows, pagination]);

  // ------------- UI -------------

  const handleSort = (columnId: string) => {
    if (sorting.columnId === columnId) {
      // toggle between asc, desc, null
      const nextDirection =
        sorting.direction === "asc"
          ? "desc"
          : sorting.direction === "desc"
          ? null
          : "asc";
      dispatch(
        setSorting({
          columnId: nextDirection ? columnId : "",
          direction: nextDirection,
        })
      );
    } else {
      dispatch(setSorting({ columnId, direction: "asc" }));
    }
  };

  const handleChangePage = (_e: unknown, newPage: number) =>
    dispatch(setPage(newPage));

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!Array.isArray(results.data) || results.data.length === 0) {
          setImportError("No data found in file.");
          setInputKey(Date.now()); // Reset input
          return;
        }

        // Normalize both table and CSV columns for safe comparison
        const existingColIds = columns.map((col) =>
          col.id.trim().toLowerCase()
        );

        // Get CSV columns as normalized array
        const csvColumns = Object.keys(results.data[0] as object).map((col) =>
          col.trim().toLowerCase()
        );

        // Check for required columns
        const requiredColumnsNormalized = REQUIRED_COLUMNS.map((col) =>
          col.toLowerCase()
        );
        const missingColumns = requiredColumnsNormalized.filter(
          (col) => !csvColumns.includes(col)
        );
        if (missingColumns.length) {
          setImportError(
            "CSV is missing required columns: " + missingColumns.join(", ")
          );
          setInputKey(Date.now()); // Reset input
          return;
        }

        // Add any new columns to table
        csvColumns.forEach((colId) => {
          if (!existingColIds.includes(colId)) {
            dispatch(addColumn({ id: colId, label: colId }));
          }
        });

        // Normalize all row keys to match column ids
        const normalizedRows = (results.data as Record<string, any>[]).map(
          (row) => {
            const newRow: Record<string, any> = {};
            Object.keys(row).forEach((key) => {
              newRow[key.trim().toLowerCase()] = row[key];
            });
            return newRow;
          }
        );

        dispatch(setRows(normalizedRows));
        dispatch(setPage(0));
        setInputKey(Date.now()); // Reset input
      },
      error: (err) => {
        setImportError("CSV error: " + err.message);
        setInputKey(Date.now()); // Reset input
      },
    });
  };

  const handleExportCSV = () => {
    // Export visible columns
    const colIds = columns.map((c) => c.id);
    const colLabels = columns.map((c) => c.label);

    const csvData = [
      colLabels, // header row
      ...rows.map((row) => colIds.map((id) => row[id] ?? "")),
    ];

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const date = new Date().toISOString().split("T")[0];
    saveAs(blob, `export_${date}.csv`);
  };

  return (
    <Box>
      {/* Manage Columns Button & Search */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <TextField
          label="Search..."
          variant="outlined"
          size="small"
          margin="normal"
          value={search}
          onChange={(e) => dispatch(setSearch(e.target.value))}
          sx={{ flexGrow: 1 }}
        />
        <Button
          variant="outlined"
          sx={{ ml: 2, height: 40, mt: 1 }}
          onClick={() => setModalOpen(true)}
        >
          Manage Columns
        </Button>
      </Box>
      <Box display="flex" gap={2} mb={2}>
        <Button
          component="label"
          variant="contained"
          color="primary"
          startIcon={<CloudUploadIcon />}
        >
          Import CSV
          <input
            key={inputKey} // Dynamic key to reset input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            hidden
            onChange={handleImportCSV}
            data-testid="import-csv"
          />
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<DownloadIcon />}
          onClick={handleExportCSV}
          data-testid="export-csv"
        >
          Export CSV
        </Button>
      </Box>

      {importError && (
        <Box color="error.main" mt={1}>
          {importError}
        </Box>
      )}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  sortDirection={
                    sorting.columnId === col.id
                      ? sorting.direction === null
                        ? false
                        : sorting.direction
                      : false
                  }
                >
                  <TableSortLabel
                    active={sorting.columnId === col.id}
                    direction={
                      sorting.direction === null
                        ? "asc"
                        : sorting.direction || "asc"
                    }
                    onClick={() => handleSort(col.id)}
                  >
                    {col.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedRows.map((row, idx) => (
              <TableRow key={idx}>
                {columns.map((col) => (
                  <TableCell key={col.id}>{row[col.id]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={sortedRows.length}
        page={pagination.page}
        rowsPerPage={pagination.rowsPerPage}
        onPageChange={handleChangePage}
        rowsPerPageOptions={[pagination.rowsPerPage]} // fixed at 10 per requirement
      />
      <ManageColumnsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </Box>
  );
}
