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
} from "@chakra-ui/react";
import { DataTable } from "@/components/DataTable";
import { DeliveryInformationCard } from "../DeliveryInformationCard";
import { useAdminDeliveryQuery } from "@/api";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function DeliveryDetailPage() {
  const params = useParams();
  const deliveryId = params.id as string;

  const { data: delivery } = useAdminDeliveryQuery(deliveryId);

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



      {delivery && <Container maxW="7xl">
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
        {delivery.activeOrders && <Card.Root bg="bg.primary" border="1px" borderColor="border.subtle" mb="8">

          <Card.Body p={0}>
            <DataTable
              title="Orders in Delivery"
              getKey={i => i.id}
              columns={[
                {
                  key: "id",
                  header: "Order ID",

                  accessor: (order) => (
                    <Link target="_blank" href={`/orders/${order.id}`}><Text fontWeight="medium">{order.id}</Text></Link>
                  ),
                },
                {
                  key: "customerName",
                  header: "Customer Name",
                  accessor: (order) => order.owner.id,
                },
                {
                  key: "status",
                  header: "Status",
                  accessor: (order) => <StatusBadge status={order.status} />,
                },
                {
                  key: "numberOfItems",
                  header: "Items",
                  accessor: (order) => order.items.length,
                },
                {
                  key: "totalValue",
                  field: "total",
                  header: "Total Value",
                  accessor: (order) => order.total,
                  summarizable: true,
                  align: "end",
                },
              ]}
              data={delivery.activeOrders}
            />
          </Card.Body>
        </Card.Root>}
        {delivery.stats && delivery.stats.length > 0 && <Card.Root bg="bg.primary" border="1px" borderColor="border.subtle" mb="8">
          <Card.Body p={0} >
            <DataTable
              title="Statistics"
              getKey={i => i.name}
              columns={[
                {
                  key: "itemName",
                  header: "Item Name",
                  accessor: (item) => (
                    <Text fontWeight="medium">{item.name}</Text>
                  ),
                },
                {
                  key: "totalFraction",
                  header: "Total Fraction",
                  accessor: (item) => item.fraction,
                },
                {
                  key: "totalQuantity",
                  header: "Total Quantity",
                  accessor: (item) => item.quantity,
                },
                {
                  key: "totalCost",
                  field: "total",
                  header: "Total Cost",
                  accessor: (item) => item.total,
                  summarizable: true,
                  align: "end",
                },
              ]}
              data={delivery.stats!}
            />
          </Card.Body>
        </Card.Root>}

        {/* Canceled Orders Table */}
        {delivery.cancelledOrders && <Card.Root bg="bg.primary" border="1px" borderColor="border.subtle" mb="8">

          <Card.Body p={0}>
            <DataTable
              title="Canceled Orders"
              getKey={i => i.id}
              columns={[
                {
                  key: "id",
                  header: "Order ID",

                  accessor: (order) => (
                    <Link target="_blank" href={`/orders/${order.id}`}><Text fontWeight="medium">{order.id}</Text></Link>
                  ),
                },
                {
                  key: "customerName",
                  header: "Customer Name",
                  accessor: (order) => order.owner.id,
                },
                {
                  key: "status",
                  header: "Status",
                  accessor: (order) => <StatusBadge status={order.status} />,
                },
                {
                  key: "numberOfItems",
                  header: "Items",
                  accessor: (order) => order.number_of_items,
                  align: "end",
                },
                {
                  key: "totalValue",
                  header: "Total Value",
                  accessor: (order) => order.total,
                  align: "end",
                },
              ]}
              data={delivery.cancelledOrders}
            />
          </Card.Body>
        </Card.Root>}        
      </Container>
      }
    </Box>
  );
}
