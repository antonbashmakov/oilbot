"use client";

import {
  Avatar,
  Badge,
  Box,
  Breadcrumb,
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
  Container
} from "@chakra-ui/react";
import { useParams } from "next/navigation";
import { DataTable, Column, DecimalDataField } from "@/components/DataTable";
import DataTableExample from "@/components/DataTableExample";
import { CartItem } from "@/api/models";
import { useAdminOrderOverviewQuery } from "@/api";
import { InfoMessage } from "@/components/ui/InfoMessage";


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

  const { data: order } = useAdminOrderOverviewQuery(orderId as string);

  const columns: Column<CartItem>[] = [
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
      accessor: (item) => item.price.toFixed(2),
      align: "end",
    },
  ];

  const pickingColumns: Column<CartItem>[] = [
    {
      key: 'id',
      header: 'ID',
      accessor: (item) => item.id,
      width: '80px',
    },
    {
      key: 'name',
      header: 'Name',
      accessor: (item) => item.name,
    },
    {
      key: 'price',
      header: 'Price',
      accessor: (item) => item.price.toFixed(2),
      editable: true,
      field: 'price',
      renderer: DecimalDataField,
    },
    {
      key: 'quantity',
      header: 'Quantity',
      accessor: (item) => item.quantity,
      editable: true,
      field: 'quantity',
      renderer: DecimalDataField,
    },
  ];

  return (
    <Box bg="bg.primary" minH="100vh" py="8">
      <Container maxW="7xl">
        <VStack gap={6} align="stretch">
          {/* Breadcrumbs */}

          <Breadcrumb.Root>
            <Breadcrumb.List>
              <Breadcrumb.Item>
                <Breadcrumb.Link href="/dashboard">Dashboard</Breadcrumb.Link>
              </Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                <Breadcrumb.Link href="/orders">Orders</Breadcrumb.Link>
              </Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                <Text>{orderId}</Text>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb.Root>
          {order && <>

            <Flex justify="space-between" align="center">
              <Flex align="center" gap={4}>
                <Heading size="2xl" color="text.primary">
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
                <VStack gap={6} align="stretch" >
                  <DataTable
                    columns={columns}
                    data={order.items}
                    title="Order Items"
                  />
                  <InfoMessage
                    type="info"
                    badgeText="Note"
                    message={order.picking ? "Change the fraction column to reflect the picked items." : "Click 'Start Picking' to begin the order picking process."}
                  />

                  {
                    order.picking && <DataTable
                      columns={pickingColumns}
                      data={order.picking.items}
                      title="Products"
                      isSaving={false}
                    />
                  }
                </VStack>
              </GridItem>

              {/* Right Column */}
              <GridItem colSpan={1}>
                <VStack gap={6} align="stretch" >
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
                          { order.customer.username && <Link href={`https://t.me/${order.customer.username}`} color="blue.500">
                            @{order.customer.username}
                          </Link>}
                          { !order.customer.username && <Text color="text.secondary">{order.customer.id}</Text>}
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

          </>
          }
        </VStack>
      </Container>
    </Box>
  );
}
