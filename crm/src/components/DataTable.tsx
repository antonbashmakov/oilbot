import { Table, Box, Text, Button, Stack, Input } from "@chakra-ui/react";
import React, { useState, useCallback } from "react";

export interface Column<T> {
  key: string;
  header: string;
  accessor: (item: T) => React.ReactNode;
  align?: "start" | "center" | "end";
  width?: string;
  editable?: boolean;
  field?: string;
  renderer?: React.ComponentType<EditableCellProps>;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  title?: string;
  emptyMessage?: string;
  loading?: boolean;
  onSave?: (changedData: T[]) => Promise<void>;
  isSaving?: boolean;
}

export interface EditableCellProps {
  value: any;
  onChange: (value: any) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
}

export function DataTable<T>({
  columns,
  data,
  title,
  emptyMessage = "No data available",
  loading = false,
  onSave,
  isSaving = false,
}: DataTableProps<T>) {
  const [editedData, setEditedData] = useState<T[]>(data);
  const [originalData, setOriginalData] = useState<T[]>(data);
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnKey: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Reset state when data changes
  React.useEffect(() => {
    setEditedData(data);
    setOriginalData(data);
    setHasChanges(false);
    setEditingCell(null);
  }, [data]);

  const handleCellChange = useCallback((rowIndex: number, columnKey: string, value: any) => {
    setEditedData(prev => {
      const newData = [...prev];
      const column = columns.find(col => col.key === columnKey);
      
      if (column?.field) {
        newData[rowIndex] = {
          ...newData[rowIndex],
          [column.field]: value
        };
      }
      
      return newData;
    });
    
    setHasChanges(true);
  }, [columns]);

  const handleStartEdit = useCallback((rowIndex: number, columnKey: string) => {
    setEditingCell({ rowIndex, columnKey });
  }, []);

  const handleEndEdit = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleCancel = useCallback(() => {
    setEditedData(originalData);
    setHasChanges(false);
    setEditingCell(null);
  }, [originalData]);

  const handleSave = useCallback(async () => {
    if (!onSave) return;
    
    try {
      await onSave(editedData);
      setOriginalData(editedData);
      setHasChanges(false);
      setEditingCell(null);
    } catch (error) {
      // Error handling - changes are not persisted if callback throws
      console.error('Save failed:', error);
    }
  }, [onSave, editedData]);

  const getCellValue = useCallback((item: T, column: Column<T>) => {
    if (column.field) {
      return (item as any)[column.field];
    }
    return column.accessor(item);
  }, []);

  if (loading) {
    return (
      <Box bg="surface.container" border="1px" borderColor="border.subtle">
        <Box p="4">
          <Text color="text.secondary">Loading...</Text>
        </Box>
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Box bg="surface.container" border="1px" borderColor="border.subtle">
        <Box p="4">
          <Text color="text.secondary">{emptyMessage}</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box bg="surface.container" 
    borderStyle="solid" 
    border="1px" 
    borderRadius="sm" 
    borderColor="border.subtle">
      {title && (
        <Box p="4" borderBottom="1px" borderColor="border.subtle">
          <Text fontSize="lg" fontWeight="semibold" color="text.primary">
            {title}
          </Text>
        </Box>
      )}
      <Box overflowX="auto" bg="surface.container">
        <Table.Root variant="outline" size="sm">
          <Table.Header>
            <Table.Row>
              {columns.map((column) => (
                <Table.ColumnHeader
                  key={column.key}
                  color="text.secondary"
                  textAlign={column.align || "start"}
                  width={column.width}
                >
                  {column.header}
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {editedData.map((item, rowIndex) => (
              <Table.Row key={rowIndex} _hover={{ bg: "surface.elevated" }}>
                {columns.map((column) => {
                  const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.columnKey === column.key;
                  const cellValue = getCellValue(item, column);
                  
                  return (
                    <Table.Cell
                      padding={5}
                      key={column.key}
                      color="text.primary"
                      textAlign={column.align || "start"}
                      _hover={column.editable ? { bg: "surface.highlight", cursor: "pointer" } : {}}
                      onClick={() => column.editable && handleStartEdit(rowIndex, column.key)}
                    >
                      {column.editable && column.renderer ? (
                        <column.renderer
                          value={cellValue}
                          onChange={(value) => handleCellChange(rowIndex, column.key, value)}
                          isEditing={isEditing}
                          onStartEdit={() => handleStartEdit(rowIndex, column.key)}
                          onEndEdit={handleEndEdit}
                        />
                      ) : (
                        column.accessor(item)
                      )}
                    </Table.Cell>
                  );
                })}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
      
      {hasChanges && (
        <Box p="4" borderTop="1px" borderColor="border.subtle">
          <Box display="flex" gap="3" justifyContent="flex-end">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleSave}
              loading={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export const DecimalDataField: React.FC<EditableCellProps> = ({
  value,
  onChange,
  isEditing,
  onStartEdit,
  onEndEdit,
}) => {
  const [inputValue, setInputValue] = useState(value?.toString() || '');
  const [isValid, setIsValid] = useState(true);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Validate decimal format
    const decimalRegex = /^-?\d*\.?\d*$/;
    const isValidDecimal = decimalRegex.test(newValue) || newValue === '';
    
    setIsValid(isValidDecimal);
    
    if (isValidDecimal && newValue !== '') {
      // Convert to number for the onChange callback
      const numericValue = parseFloat(newValue);
      onChange(numericValue);
    } else if (newValue === '') {
      onChange(null);
    }
  };

  const handleBlur = () => {
    onEndEdit();
    
    // If input is invalid, revert to original value
    if (!isValid) {
      setInputValue(value?.toString() || '');
      setIsValid(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setInputValue(value?.toString() || '');
      setIsValid(true);
      onEndEdit();
    }
  };

  if (isEditing) {
    return (
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        size="sm"
        _invalid={{ borderColor: "red.500" }}
        placeholder="Enter decimal number"
      />
    );
  }

  return (
    <Box 
      onClick={onStartEdit}
      cursor="pointer"
      _hover={{ textDecoration: "underline" }}
    >
      {value !== null && value !== undefined ? value.toString() : '-'}
    </Box>
  );
};
