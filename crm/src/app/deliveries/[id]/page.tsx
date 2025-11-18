"use client";

import { useParams } from "next/navigation";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Flex,
  Badge,
  Card,
} from "@chakra-ui/react";
import { DataTable } from "@/components/DataTable";

// Mock data for a specific delivery
const mockDelivery = {
  id: "DLV-001",
  name: "Moscow Morning Delivery",
  description: "Morning delivery to Moscow region",
  status: "PENDING" as const,
  group: "MOSCOW",
  deliveryStart: "2025-11-19 08:00",
  deliveryEnd: "2025-11-19 12:00",
  orders: [
    {
      id: "ORD-101",
      customerName: "Ivan Petrov",
      orderDate: "2025-11-18 14:30",
      status: "PAID" as const,
      numberOfItems: 3,
      totalValue: 2500,
    },
    {
      id: "ORD-102",
      customerName: "Maria Ivanova",
      orderDate: "2025-11-18 16:45",
      status: "PENDING" as const,
      numberOfItems: 2,
      totalValue: 1800,
    },
    {
      id: "ORD-103",
      customerName: "Alexey Smirnov",
      orderDate: "2025-11-19 09:15",
      status: "CONSOLIDATED" as const,
      numberOfItems: 4,
      totalValue: 3200,
    },
    {
      id: "ORD-104",
      customerName: "Elena Volkova",
      orderDate: "2025-11-19 10:30",
      status: "PAID" as const,
      numberOfItems: 1,
      totalValue: 1500,
    },
  ],
};

// Order status badge component
function OrderStatusBadge({ status }: { status: string }) {
  const statusColors = {
    PENDING: "status.warning",
    PAID: "status.success",
    CONSOLIDATED: "primary.blue",
  };

  const statusLabels = {
    PENDING: "Pending",
    PAID: "Paid",
    CONSOLIDATED: "Consolidated",
  };

  return (
    <Badge colorPalette={statusColors[status as keyof typeof statusColors]}>
      {statusLabels[status as keyof typeof statusLabels]}
    </Badge>
  );
}

export default function DeliveryDetailPage() {
  const params = useParams();
  const deliveryId = params.id as string;

  // In a real app, we would fetch the delivery data based on the ID
  const delivery = mockDelivery;

  const handleEdit = () => {
    console.log("Edit delivery:", deliveryId);
    // Implement edit functionality
  };

  const handleMarkDelivered = () => {
    console.log("Mark delivery as delivered:", deliveryId);
    // Implement mark delivered functionality
  };

  return (
    <Box bg="bg.primary" minH="100vh" py="8">
      <Container maxW="7xl">
        {/* Header with title and buttons */}
        <Flex justify="space-between" align="center" mb="8">
          <Box>
            <Heading size="2xl" color="text.primary">
              Delivery {delivery.id}
            </Heading>
            <Text color="text.secondary" fontSize="lg" mt="2">
              {delivery.name}
            </Text>
          </Box>
          <Flex gap="4">
            <Button variant="outline" onClick={handleEdit}>
              Edit
            </Button>
            <Button colorPalette="green" onClick={handleMarkDelivered}>
              Mark Delivered
            </Button>
          </Flex>
        </Flex>

        {/* Delivery Information Card */}
        <Card.Root bg="surface.container" border="1px" borderColor="border.subtle" mb="8">
          <Card.Body>
            <Flex gap="8" wrap="wrap">
              <Box>
                <Text color="text.secondary" fontSize="sm" fontWeight="medium">
                  Description
                </Text>
                <Text color="text.primary">{delivery.description}</Text>
              </Box>
              <Box>
                <Text color="text.secondary" fontSize="sm" fontWeight="medium">
                  Status
                </Text>
                <Badge colorPalette="status.pending" mt="1">
                  {delivery.status.replace(/_/g, " ")}
                </Badge>
              </Box>
              <Box>
                <Text color="text.secondary" fontSize="sm" fontWeight="medium">
                  Group
                </Text>
                <Text color="text.primary">{delivery.group}</Text>
              </Box>
              <Box>
                <Text color="text.secondary" fontSize="sm" fontWeight="medium">
                  Delivery Start
                </Text>
                <Text color="text.primary">{delivery.deliveryStart}</Text>
              </Box>
              <Box>
                <Text color="text.secondary" fontSize="sm" fontWeight="medium">
                  Delivery End
                </Text>
                <Text color="text.primary">{delivery.deliveryEnd}</Text>
              </Box>
            </Flex>
          </Card.Body>
        </Card.Root>

        {/* Orders Table */}
        <Card.Root bg="surface.container" border="1px" borderColor="border.subtle">
          <Card.Header>
            <Heading size="lg" color="text.primary">
              Orders in Delivery
            </Heading>
          </Card.Header>
          <Card.Body>
            <DataTable
              columns={[
                {
                  key: "id",
                  header: "Order ID",
                  accessor: (order) => (
                    <Text fontWeight="medium">{order.id}</Text>
                  ),
                },
                {
                  key: "customerName",
                  header: "Customer Name",
                  accessor: (order) => order.customerName,
                },
                {
                  key: "orderDate",
                  header: "Order Date",
                  accessor: (order) => order.orderDate,
                },
                {
                  key: "status",
                  header: "Status",
                  accessor: (order) => <OrderStatusBadge status={order.status} />,
                },
                {
                  key: "numberOfItems",
                  header: "Items",
                  accessor: (order) => order.numberOfItems,
                  align: "end",
                },
                {
                  key: "totalValue",
                  header: "Total Value",
                  accessor: (order) => `$${order.totalValue}`,
                  align: "end",
                },
              ]}
              data={delivery.orders}
            />
          </Card.Body>
        </Card.Root>
      </Container>
    </Box>
  );
}
