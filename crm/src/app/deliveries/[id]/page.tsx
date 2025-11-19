"use client";

import { useParams } from "next/navigation";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Flex,
  Card,
  Badge,
  Stack,
  Separator,
} from "@chakra-ui/react";
import { DataTable } from "@/components/DataTable";
import { DeliveryInformationCard, Delivery } from "../DeliveryInformationCard";

// Mock data for a specific delivery
const mockDelivery: Delivery = {
  id: "764a2736-d1e0-4586-9a9f-088f252b41b9",
  number: 9,
  description: "This shipment includes: caviar, salmon, trout, salmon (again), steaks, cheeses, and ham.",
  status: "PENDING" as const,
  order_deadline: "7-11-2025",
  delivery_start: "9-11-2025",
  delivery_end: "13-11-2025",
  group: "MOSCOW",
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
    PENDING: "yellow",
    PAID: "green",
    CONSOLIDATED: "green",
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
              Delivery #{delivery.number}
            </Heading>
            <Text color="text.secondary" fontSize="lg" mt="2">
              {delivery.description}
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
          <DeliveryInformationCard delivery={delivery} />
        <Container mb="8" />
        {/* Orders Table */}
        <Card.Root bg="bg.primary" border="1px" borderColor="border.subtle">
          <Card.Header>
            <Heading p={0} size="lg" color="text.primary">
              Orders in Delivery
            </Heading>
          </Card.Header>
          <Card.Body p={0}>
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
