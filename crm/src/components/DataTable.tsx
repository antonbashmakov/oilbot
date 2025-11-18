import { Table, Box, Text } from "@chakra-ui/react";

export interface Column<T> {
  key: string;
  header: string;
  accessor: (item: T) => React.ReactNode;
  align?: "start" | "center" | "end";
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  title?: string;
  emptyMessage?: string;
  loading?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  title,
  emptyMessage = "No data available",
  loading = false,
}: DataTableProps<T>) {
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
    <Box bg="surface.container" border="1px" borderColor="border.subtle">
      {title && (
        <Box p="4" borderBottom="1px" borderColor="border.subtle">
          <Text fontSize="lg" fontWeight="semibold" color="text.primary">
            {title}
          </Text>
        </Box>
      )}
      <Box overflowX="auto">
        <Table.Root variant="outline" size="sm">
          <Table.Header>
            <Table.Row >
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
          <Table.Body >
            {data.map((item, index) => (
              <Table.Row  key={index} _hover={{ bg: "surface.elevated" }}>
                {columns.map((column) => (
                  <Table.Cell
                  padding={5}
                    key={column.key}
                    color="text.primary"
                    textAlign={column.align || "start"}
                  >
                    {column.accessor(item)}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
    </Box>
  );
}
