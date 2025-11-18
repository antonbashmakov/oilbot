"use client";

import { useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Card,
  SimpleGrid,
  Badge,
  Flex,
  Stack,
} from "@chakra-ui/react";
import { KPICard } from "@/components/ui/KPICard";
import { DataTable, Column } from "@/components/DataTable";

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
const  StatusBadge = ({ status }: { status: string }) => {
  const statusColors = {
    PENDING: "status.pending",
    IN_TRANSIT: "status.inTransit",
    IN_TRANSIT_BACK: "status.inTransitBack",
    FULLFILLED: "status.fulfilled"
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
    <Box bg="bg.primary" minH="100vh" py="8">
      <Container maxW="7xl">
        {/* Header */}
        <Stack direction="column" gap="2" align="start" mb="8">
          <Heading size="2xl" color="text.primary">
            CRM Dashboard
          </Heading>
          <Text color="text.secondary" fontSize="lg">
            Overview of delivery and order information
          </Text>
        </Stack>

        {/* Deliveries Table */}
        <Card.Root bg="surface.container" border="1px" borderColor="border.subtle" mb="8">
          <Card.Header pb="0">
            <Heading size="lg" color="text.primary">Upcoming Deliveries</Heading>
          </Card.Header>
          <Card.Body>
            <DataTable
              columns={[
                {
                  key: "id",
                  header: "ID",
                  accessor: (delivery) => (
                    <Text fontWeight="medium">{delivery.id}</Text>
                  ),
                },
                {
                  key: "name",
                  header: "Name",
                  accessor: (delivery) => delivery.name,
                },
                {
                  key: "description",
                  header: "Description",
                  accessor: (delivery) => (
                    <Text maxW="200px" title={delivery.description} truncate>
                      {delivery.description}
                    </Text>
                  ),
                },
                {
                  key: "numberOfOrders",
                  header: "Orders",
                  accessor: (delivery) => delivery.numberOfOrders,
                  align: "end",
                },
                {
                  key: "deliveryStart",
                  header: "Delivery Start",
                  accessor: (delivery) => delivery.deliveryStart,
                },
                {
                  key: "deliveryEnd",
                  header: "Delivery End",
                  accessor: (delivery) => delivery.deliveryEnd,
                },
                {
                  key: "status",
                  header: "Status",
                  accessor: (delivery) => <StatusBadge status={delivery.status} />,
                },
                {
                  key: "group",
                  header: "Group",
                  accessor: (delivery) => delivery.group,
                },
              ]}
              data={deliveries}
            />
          </Card.Body>
        </Card.Root>

        {/* KPI Cards */}
        <SimpleGrid columns={{ base: 1, md: 3 }} gap="6" mb="8">
          <KPICard
            name="Total Pending Deliveries"
            value={totalPendingDeliveries}
            description="Deliveries awaiting processing"
          />
          <KPICard
            name="Orphans Orders"
            value={orphansOrders}
            description="Orders without deliveries"
          />
          <KPICard
            name="Average Order Value"
            value={`$${averageOrderValue}`}
            description="Average value per order"
          />
        </SimpleGrid>

        {/* Orphan Orders List */}
        <Card.Root bg="surface.container" border="1px" borderColor="border.subtle">
          <Card.Header>
            <Heading size="lg" color="text.primary">Orders Without Deliveries</Heading>
          </Card.Header>
          <Card.Body>
            <Stack direction="column" gap="4">
              {orphanOrders.map((order) => (
                <Card.Root key={order.id} bg="surface.elevated" border="1px" borderColor="border.medium">
                  <Card.Body>
                    <Flex justify="space-between" align="center">
                      <Stack direction="column" gap="1" align="start">
                        <Text fontWeight="bold" color="text.primary">
                          {order.id} - {order.customer}
                        </Text>
                        <Text color="text.secondary" fontSize="sm">
                          Created: {order.createdAt}
                        </Text>
                      </Stack>
                      <Flex gap="4" align="center">
                        <Stack direction="column" gap="1" align="end">
                          <Text color="text.primary" fontWeight="medium">
                            ${order.value}
                          </Text>
                          <Text color="text.secondary" fontSize="sm">
                            {order.items} items
                          </Text>
                        </Stack>
                        <Badge colorPalette="accent.orange" variant="subtle">
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
