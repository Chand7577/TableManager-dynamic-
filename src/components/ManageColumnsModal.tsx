import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  Box,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../hooks";
import { toggleColumnVisibility, addColumn } from "../store";
import { useForm, Controller } from "react-hook-form";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ManageColumnsModal({ open, onClose }: Props) {
  const columns = useAppSelector((state) => state.table.columns);
  const dispatch = useAppDispatch();

  // React Hook Form for new column form
  const { control, handleSubmit, reset, formState } = useForm<{
    id: string;
    label: string;
  }>({ defaultValues: { id: "", label: "" } });

  // Add new column on form submit
  const onSubmit = (data: { id: string; label: string }) => {
    if (data.id && data.label) {
      dispatch(addColumn(data));
      reset();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Manage Columns</DialogTitle>
      <DialogContent>
        <Box mb={1}>
          {columns.map((col) => (
            <FormControlLabel
              key={col.id}
              control={
                <Checkbox
                  checked={col.visible}
                  onChange={() => dispatch(toggleColumnVisibility(col.id))}
                />
              }
              label={col.label}
            />
          ))}
        </Box>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box display="flex" gap={3} alignItems="center" mt={3}>
            <Controller
              name="label"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="New Column Name"
                  variant="outlined"
                  size="small"
                  required
                />
              )}
            />
            <Controller
              name="id"
              control={control}
              rules={{ required: true, pattern: /^[a-z][a-z0-9_]*$/i }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Key (e.g. department)"
                  variant="outlined"
                  size="small"
                  required
                  error={!!formState.errors.id}
                  sx={{ minWidth: 180 }}
                />
              )}
            />
            <Button type="submit" variant="contained">
              Add
            </Button>
          </Box>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
