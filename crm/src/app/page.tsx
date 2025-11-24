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
import { useAdminDeliveriesQuery } from "@/api";
import Link from "next/link";

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
  const [orphanOrders] = useState(mockOrphanOrders);

  const {data: deliveries} = useAdminDeliveriesQuery();

  // Calculate KPIs
  const totalPendingDeliveries =  10;//deliveries.filter(d => d.status === "PENDING").length;
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
        { deliveries && deliveries.length > 0 && <Card.Root bg="surface.container" border="1px" borderColor="border.subtle" mb="8">
          <Card.Header pb="0">
            <Heading size="lg" color="text.primary">Upcoming Deliveries</Heading>
          </Card.Header>
          <Card.Body>
            <DataTable
              title="Deliveries"
              columns={[
                {
                  key: "id",
                  header: "ID",
                  accessor: (delivery) => (
                     <Link target="_blank" href={`/deliveries/${delivery.id}`}><Text fontWeight="medium">{delivery.id}</Text></Link>
                  ),
                },
                {
                  key: "name",
                  header: "Name",
                  accessor: (delivery) => delivery.number,
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
                  accessor: (delivery) => 'N/A',
                  align: "end",
                },
                {
                  key: "deliveryStart",
                  header: "Delivery Start",
                  accessor: (delivery) => delivery.delivery_start,
                },
                {
                  key: "deliveryEnd",
                  header: "Delivery End",
                  accessor: (delivery) => delivery.delivery_end,
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
        </Card.Root>}

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
        <Card.Root border="1px" borderColor="border.subtle">
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
