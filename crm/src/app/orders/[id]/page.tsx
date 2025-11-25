"use client";

import {
  Avatar,
  Badge,
  Box,
  Breadcrumb,
  DataList,
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
  Container,
  Separator
} from "@chakra-ui/react";
import { useParams } from "next/navigation";
import { DataTable, Column, DecimalDataField } from "@/components/DataTable";
import { CartItem } from "@/api/models";
import { useAdminOrderOverviewQuery, usePatchOrderPicking, useStartOrderPicking } from "@/api";
import { InfoMessage } from "@/components/ui/InfoMessage";
import DataTableWithButtonsExample from "@/components/DataTableWithButtonsExample";
import DataTableWithSummaryExample from "@/components/DataTableWithSummaryExample";
import { useCallback } from "react";


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
  const { mutate: mutatePicking } = usePatchOrderPicking(orderId as string);
  const { mutate: mutateStartPicking, isLoading: isStartPicking } = useStartOrderPicking(orderId as string);

  const columns: Column<CartItem>[] = [
    { key: "id", header: "ID", accessor: (item) => item.id },
    { key: "name", header: "Name", accessor: (item) => item.name },
    {
      key: "fraction",
      field: "fraction",
      summarizable: true,
      header: "Fraction",
      accessor: (item) => item.fraction
    },
    {
      key: "quantity",
      header: "Quantity",
      accessor: (item) => item.quantity,
      align: "end",
    },
    {
      key: "price",
      field: "price",
      summarizable: true,
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
      key: 'fraction',
      header: 'Fraction',
      accessor: (item) => item.fraction,
      editable: true,
      field: 'fraction',
      renderer: DecimalDataField,
    },
    {
      key: 'price',
      header: 'Price',
      accessor: (item) => Math.floor(item.price_for_unit * item.fraction * item.quantity),
      field: 'price',
    },
    {
      key: 'quantity',
      header: 'Quantity',
      accessor: (item) => item.quantity,
      field: 'quantity',
    },
  ];

  const onSave = async (data: CartItem[]) => {
    return mutatePicking({ items: data });
  };

const onStartPickingClick = useCallback(() => {
    if (order && !order.picking) {
      mutateStartPicking();
    }
  }, [order]);

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

          {/*< DataTableWithSummaryExample />*/}
          {order && <>

            <Flex justify="space-between" align="center">
              <Flex align="center" gap={4}>
                <Heading size="2xl" color="text.primary">
                  Order {orderId}
                </Heading>
                <Badge colorScheme="green">Paid</Badge>
              </Flex>
              { !order.picking && <Button loading={isStartPicking} onClick={onStartPickingClick} colorScheme="blue">Start Picking</Button>}
            </Flex>

            <Grid templateColumns="repeat(3, 1fr)" gap={6}>
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
                      onSave={onSave}
                      rowButtons={() => []}
                    />
                  }
                </VStack>
              </GridItem>

              <GridItem colSpan={1}>
                <VStack gap={6} align="stretch" >
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
                          {order.customer.username && <Link href={`https://t.me/${order.customer.username}`} color="blue.500">
                            @{order.customer.username}
                          </Link>}
                          {!order.customer.username && <Text color="text.secondary">{order.customer.id}</Text>}
                        </Box>
                      </Flex>
                    </Card.Body>
                  </Card.Root>

                  <Card.Root>
                    <Card.Header>
                      <Heading size="md">Order History</Heading>
                    </Card.Header>
                    <Card.Body>
                      <DataList.Root orientation="horizontal" maxW="md">

                        <DataList.Item key="calculation-original">
                          <DataList.ItemLabel>Original</DataList.ItemLabel>
                          <DataList.ItemValue>{order.total}</DataList.ItemValue>
                        </DataList.Item>
                        <DataList.Item key="calculation-picking">
                          <DataList.ItemLabel>Picking</DataList.ItemLabel>
                          <DataList.ItemValue>{order.picking?.total || 0}</DataList.ItemValue>
                        </DataList.Item>
                        <Separator />
                        <DataList.Item key="calculation-final" fontWeight="bold">
                          <DataList.ItemLabel>Final Total</DataList.ItemLabel>
                          <DataList.ItemValue>{(order.picking?.total || 0) - (order.total || 0)}</DataList.ItemValue>
                        </DataList.Item>

                      </DataList.Root>
                    </Card.Body>
                  </Card.Root>
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
