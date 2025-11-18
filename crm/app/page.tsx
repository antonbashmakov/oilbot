"use client";

import { useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Table,
  Card,
  SimpleGrid,
  Badge,
  Flex,
  Stack,
} from "@chakra-ui/react";

// Mock data for deliveries
const mockDeliveries = [
  {
    id: "DLV-001",
    name: "Moscow Morning Delivery",
    description: "Morning delivery to Moscow region",
    numberOfOrders: 15,
    deliveryStart: "2025-11-19 08:00",
    deliveryEnd: "2025-11-19 12:00",
    status: "PENDING" as const,
    group: "MOSCOW"
  },
  {
    id: "DLV-002",
    name: "St. Petersburg Express",
    description: "Express delivery to St. Petersburg",
    numberOfOrders: 8,
    deliveryStart: "2025-11-19 09:30",
    deliveryEnd: "2025-11-19 14:00",
    status: "IN_TRANSIT" as const,
    group: "ST_PETERSBURG"
  },
  {
    id: "DLV-003",
    name: "Kazan Standard",
    description: "Standard delivery to Kazan",
    numberOfOrders: 12,
    deliveryStart: "2025-11-19 10:00",
    deliveryEnd: "2025-11-19 16:00",
    status: "IN_TRANSIT_BACK" as const,
    group: "KAZAN"
  },
  {
    id: "DLV-004",
    name: "Sochi Weekend",
    description: "Weekend delivery to Sochi",
    numberOfOrders: 6,
    deliveryStart: "2025-11-20 07:00",
    deliveryEnd: "2025-11-20 15:00",
    status: "FULLFILLED" as const,
    group: "SOCHI"
  }
];

// Mock data for orders without deliveries
const mockOrphanOrders = [
  {
    id: "ORD-101",
    customer: "Ivan Petrov",
    value: 2500,
    items: 3,
    createdAt: "2025-11-18 14:30"
  },
  {
    id: "ORD-102",
    customer: "Maria Ivanova",
    value: 1800,
    items: 2,
    createdAt: "2025-11-18 16:45"
  },
  {
    id: "ORD-103",
    customer: "Alexey Smirnov",
    value: 3200,
    items: 4,
    createdAt: "2025-11-19 09:15"
  }
];

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusColors = {
    PENDING: "yellow",
    IN_TRANSIT: "blue",
    IN_TRANSIT_BACK: "purple",
    FULLFILLED: "green"
  };

  return (
    <Badge colorPalette={statusColors[status as keyof typeof statusColors]}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

export default function Dashboard() {
  const [deliveries] = useState(mockDeliveries);
  const [orphanOrders] = useState(mockOrphanOrders);

  // Calculate KPIs
  const totalPendingDeliveries = deliveries.filter(d => d.status === "PENDING").length;
  const orphansOrders = orphanOrders.length;
  const averageOrderValue = orphanOrders.length > 0 
    ? Math.round(orphanOrders.reduce((sum, order) => sum + order.value, 0) / orphanOrders.length)
    : 0;

  return (
    <Box bg="gray.900" minH="100vh" py="8">
      <Container maxW="7xl">
        {/* Header */}
        <Stack direction="column" gap="2" align="start" mb="8">
          <Heading size="2xl" color="white">
            CRM Dashboard
          </Heading>
          <Text color="gray.400" fontSize="lg">
            Overview of delivery and order information
          </Text>
        </Stack>

        {/* Deliveries Table */}
        <Card.Root bg="gray.800" border="1px" borderColor="gray.700" mb="8">
          <Card.Header pb="0">
            <Heading size="lg">Upcoming Deliveries</Heading>
          </Card.Header>
          <Card.Body>
            <Box overflowX="auto">
              <Table.Root variant="outline" size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader color="gray.400">ID</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.400">Name</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.400">Description</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.400" textAlign="end">Orders</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.400">Delivery Start</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.400">Delivery End</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.400">Status</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.400">Group</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {deliveries.map((delivery) => (
                    <Table.Row key={delivery.id} _hover={{ bg: "gray.700" }}>
                      <Table.Cell fontWeight="medium">{delivery.id}</Table.Cell>
                      <Table.Cell>{delivery.name}</Table.Cell>
                      <Table.Cell maxW="200px" title={delivery.description}>
                        <Text truncate>{delivery.description}</Text>
                      </Table.Cell>
                      <Table.Cell textAlign="end">{delivery.numberOfOrders}</Table.Cell>
                      <Table.Cell>{delivery.deliveryStart}</Table.Cell>
                      <Table.Cell>{delivery.deliveryEnd}</Table.Cell>
                      <Table.Cell>
                        <StatusBadge status={delivery.status} />
                      </Table.Cell>
                      <Table.Cell>{delivery.group}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          </Card.Body>
        </Card.Root>

        {/* KPI Cards */}
        <SimpleGrid columns={{ base: 1, md: 3 }} gap="6" mb="8">
          <Card.Root bg="gray.800" border="1px" borderColor="gray.700">
            <Card.Body>
              <Flex direction="column" gap="2">
                <Text color="gray.400" fontSize="sm" fontWeight="medium">
                  Total Pending Deliveries
                </Text>
                <Text color="white" fontSize="3xl" fontWeight="bold">
                  {totalPendingDeliveries}
                </Text>
                <Text color="gray.400" fontSize="sm">
                  Deliveries awaiting processing
                </Text>
              </Flex>
            </Card.Body>
          </Card.Root>

          <Card.Root bg="gray.800" border="1px" borderColor="gray.700">
            <Card.Body>
              <Flex direction="column" gap="2">
                <Text color="gray.400" fontSize="sm" fontWeight="medium">
                  Orphans Orders
                </Text>
                <Text color="white" fontSize="3xl" fontWeight="bold">
                  {orphansOrders}
                </Text>
                <Text color="gray.400" fontSize="sm">
                  Orders without deliveries
                </Text>
              </Flex>
            </Card.Body>
          </Card.Root>

          <Card.Root bg="gray.800" border="1px" borderColor="gray.700">
            <Card.Body>
              <Flex direction="column" gap="2">
                <Text color="gray.400" fontSize="sm" fontWeight="medium">
                  Average Order Value
                </Text>
                <Text color="white" fontSize="3xl" fontWeight="bold">
                  ${averageOrderValue}
                </Text>
                <Text color="gray.400" fontSize="sm">
                  Average value per order
                </Text>
              </Flex>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>

        {/* Orphan Orders List */}
        <Card.Root bg="gray.800" border="1px" borderColor="gray.700">
          <Card.Header>
            <Heading size="lg">Orders Without Deliveries</Heading>
          </Card.Header>
          <Card.Body>
            <Stack direction="column" gap="4">
              {orphanOrders.map((order) => (
                <Card.Root key={order.id} bg="gray.750" border="1px" borderColor="gray.600">
                  <Card.Body>
                    <Flex justify="space-between" align="center">
                      <Stack direction="column" gap="1" align="start">
                        <Text fontWeight="bold" color="white">
                          {order.id} - {order.customer}
                        </Text>
                        <Text color="gray.400" fontSize="sm">
                          Created: {order.createdAt}
                        </Text>
                      </Stack>
                      <Flex gap="4" align="center">
                        <Stack direction="column" gap="1" align="end">
                          <Text color="white" fontWeight="medium">
                            ${order.value}
                          </Text>
                          <Text color="gray.400" fontSize="sm">
                            {order.items} items
                          </Text>
                        </Stack>
                        <Badge colorPalette="orange" variant="subtle">
                          Needs Delivery
                        </Badge>
                      </Flex>
                    </Flex>
                  </Card.Body>
                </Card.Root>
              ))}
            </Stack>
          </Card.Body>
        </Card.Root>
      </Container>
    </Box>
  );
}
