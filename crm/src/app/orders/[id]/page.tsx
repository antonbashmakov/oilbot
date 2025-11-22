"use client";

import {
  Avatar,
  Badge,
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Card,
  Flex,
  Grid,
  GridItem,
  Heading,
  Link,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useParams } from "next/navigation";
import { DataTable, Column } from "@/components/DataTable";

// Mock data for the order items
const orderItems = [
  {
    id: "PROD-001",
    name: "Laptop Pro",
    fraction: "unit",
    quantity: 1,
    price: 1200,
  },
  {
    id: "PROD-002",
    name: "Wireless Mouse",
    fraction: "unit",
    quantity: 1,
    price: 50,
  },
  {
    id: "PROD-003",
    name: "USB-C Cable",
    fraction: "unit",
    quantity: 2,
    price: 15,
  },
];

type OrderItem = typeof orderItems[0];

// Mock data for the customer
const customer = {
  id: "CUST-123",
  name: "John Doe",
  avatarUrl: "https://bit.ly/dan-abramov",
};

// Mock data for order history
const orderHistory = [
    { event: "Order Created", date: "2023-11-20 10:00" },
    { event: "Payment Sent", date: "2023-11-20 10:05" },
    { event: "Payment Made", date: "2023-11-20 10:10" },
    { event: "Order Picked", date: "2023-11-21 09:00" },
    { event: "Reconciliation Order created", date: "2023-11-21 09:30" },
    { event: "Reconciliation Payment Sent", date: "2023-11-21 09:35" },
    { event: "Reconciliation Payment Made", date: "2023-11-21 09:40" },
    { event: "Order delivered", date: "2023-11-22 14:00" },
];


export default function OrderPage() {
  const { id: orderId } = useParams();

  const columns: Column<OrderItem>[] = [
    { key: "id", header: "ID", accessor: (item) => item.id },
    { key: "name", header: "Name", accessor: (item) => item.name },
    { key: "fraction", header: "Fraction", accessor: (item) => item.fraction },
    {
      key: "quantity",
      header: "Quantity",
      accessor: (item) => item.quantity,
      align: "end",
    },
    {
      key: "price",
      header: "Price",
      accessor: (item) => `$${item.price.toFixed(2)}`,
      align: "end",
    },
  ];

  return (
    <Box p={8}>
      <VStack gap={6} align="stretch">
        {/* Breadcrumbs */}
        <Breadcrumb.Root>
          <Breadcrumb.Item>
            <Breadcrumb.Link href="/dashboard">Dashboard</Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Breadcrumb.Link href="/orders">Orders</Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Text>{orderId}</Text>
          </Breadcrumb.Item>
        </Breadcrumb.Root>
        <Flex justify="space-between" align="center">
          <Flex align="center" gap={4}>
            <Heading as="h1" size="lg">
              Order {orderId}
            </Heading>
            <Badge colorScheme="green">Paid</Badge>
          </Flex>
          <Button colorScheme="blue">Start Picking</Button>
        </Flex>

        {/* Main Content */}
        <Grid templateColumns="repeat(3, 1fr)" gap={6}>
          {/* Left Column */}
          <GridItem colSpan={2}>
            <DataTable
              columns={columns}
              data={orderItems}
              title="Order Items"
            />
          </GridItem>

          {/* Right Column */}
          <GridItem colSpan={1}>
            <VStack gap={6} align="stretch">
              {/* Customer Card */}
              <Card.Root>
                <Card.Header>
                  <Heading size="md">Customer</Heading>
                </Card.Header>
                <Card.Body>
                  <Flex align="center" gap={4}>
                    <Avatar.Root>
                      <Avatar.Image src={customer.avatarUrl} />
                    </Avatar.Root>
                    <Box>
                      <Text fontWeight="bold">{customer.name}</Text>
                      <Link href={`/customers/${customer.id}`} color="blue.500">
                        View Customer
                      </Link>
                    </Box>
                  </Flex>
                </Card.Body>
              </Card.Root>

              {/* Order History Card */}
              <Card.Root>
                <Card.Header>
                  <Heading size="md">Order History</Heading>
                </Card.Header>
                <Card.Body>
                  <Stack gap={4}>
                    {orderHistory.map((item, index) => (
                      <Flex key={index} justify="space-between">
                        <Text fontSize="sm">{item.event}</Text>
                        <Text fontSize="sm" color="gray.500">
                          {item.date}
                        </Text>
                      </Flex>
                    ))}
                  </Stack>
                </Card.Body>
              </Card.Root>
            </VStack>
          </GridItem>
        </Grid>
      </VStack>
    </Box>
  );
}
