import { Table, Box, Text, Button, Stack, Input, Editable, IconButton, Flex } from "@chakra-ui/react";
import React, { useState, useCallback, useEffect } from "react";
import { AddIcon, MinusIcon } from "@chakra-ui/icons";

export interface Column<T> {
  key: string;
  header: string;
  accessor: (item: T) => React.ReactNode;
  align?: "start" | "center" | "end";
  width?: string;
  editable?: boolean;
  field?: string;
  renderer?: React.ComponentType<EditableCellProps>;
  summarizable?: boolean;
  summaryFormatter?: (sum: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  title?: string;
  emptyMessage?: string;
  loading?: boolean;
  onSave?: (changedData: T[]) => Promise<void>;
  isSaving?: boolean;
  isRowDisabled?: (item: T) => boolean;
  rowButtons?: (item: T) => React.ReactNode[];
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
  isRowDisabled,
  rowButtons,
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
    console.log("handleCancel called", originalData);
    setHasChanges(false);
    setEditingCell(null);
  }, [originalData]);

  const handleSave = useCallback(async () => {
    console.log("handleSave called", onSave, editedData);
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

  // Calculate summary values for summarizable columns
  const calculateSummary = useCallback(() => {
    const summary: { [key: string]: number } = {};

    columns.forEach(column => {
      console.log("summary:", column.summarizable , column.field); 
      if (column.summarizable && column.field) {
        let sum = 0;
        editedData.forEach(item => {
          const value = (item as any)[column.field!];
          if (typeof value === 'number') {
            sum += value;
          }
        });
        summary[column.key] = sum;
      }
    });
  

    return summary;
  }, [columns, editedData]);

  const summaryValues = calculateSummary();
  const hasSummary = Object.keys(summaryValues).length > 0;

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
              {/* Actions column header */}
              {(rowButtons && data.some(item => !isRowDisabled || !isRowDisabled(item))) && (
                <Table.ColumnHeader
                  width="80px"
                  textAlign="center"
                >
                  Actions
                </Table.ColumnHeader>
              )}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {editedData.map((item, rowIndex) => {
              const isDisabled = isRowDisabled ? isRowDisabled(item) : false;
              const buttons = rowButtons ? rowButtons(item) : [];
              const showButtons = buttons.length > 0 && !isDisabled;

              return (
                <Table.Row
                  key={rowIndex}
                  _hover={{ bg: "surface.elevated" }}
                  opacity={isDisabled ? 0.6 : 1}
                >
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
                        onClick={() => column.editable && !isDisabled && handleStartEdit(rowIndex, column.key)}
                      >
                        {column.editable && column.renderer ? (
                          <column.renderer
                            value={cellValue}
                            onChange={(value) => handleCellChange(rowIndex, column.key, value)}
                            isEditing={isEditing}
                            onStartEdit={() => !isDisabled && handleStartEdit(rowIndex, column.key)}
                            onEndEdit={handleEndEdit}
                          />
                        ) : (
                          column.accessor(item)
                        )}
                      </Table.Cell>
                    );
                  })}

                  {/* Actions column */}
                 { rowButtons &&  <Table.Cell
                    padding={5}
                    width="80px"
                    textAlign="center"
                  >
                    {showButtons && (
                      <Flex
                        gap="1"
                        justify="center"
                        opacity={0}
                        _hover={{ opacity: 1 }}
                        transition="opacity 0.2s"
                      >

                        {buttons.map((button, index) => (
                          <Box key={index}>
                            {button}
                          </Box>
                        ))}
                      </Flex>
                    )}
                  </Table.Cell>}
                </Table.Row>
              );
            })}
            {/* Summary row */}
            {hasSummary && (
              <Table.Row bg="surface.highlight" fontWeight="semibold">
                {columns.map((column) => {
                  const summaryValue = summaryValues[column.key];
                  const hasSummaryValue = summaryValue !== undefined;
                  
                  return (
                    <Table.Cell
                      padding={5}
                      key={column.key}
                      color="text.primary"
                      textAlign={column.align || "start"}
                      borderTop="2px"
                      borderColor="border.subtle"
                    >
                      {hasSummaryValue ? (
                        column.summaryFormatter ? (
                          column.summaryFormatter(summaryValue)
                        ) : (
                          summaryValue
                        )
                      ) : (
                        column.key === columns[0]?.key ? "Total" : ""
                      )}
                    </Table.Cell>
                  );
                })}
                
                {/* Empty cell for actions column in summary row */}
                {rowButtons && (
                  <Table.Cell
                    padding={5}
                    width="80px"
                    textAlign="center"
                    borderTop="2px"
                    borderColor="border.subtle"
                  />
                )}
              </Table.Row>
            )}
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
  onEndEdit,
}) => {
  const [inputValue, setInputValue] = useState(value?.toString() || '');
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    setInputValue(value?.toString() || '');
  }, [value]);

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

  return<Editable.Root
    size="sm"
    value={inputValue}
    textAlign="start"
    onBlur={handleBlur}
    onChange={handleInputChange}
    defaultValue="Click to edit">
    <Editable.Preview />
    <Editable.Input onKeyDown={handleKeyDown} />
  </Editable.Root>
};
