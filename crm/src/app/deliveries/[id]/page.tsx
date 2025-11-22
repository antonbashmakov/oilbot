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

  const {data: delivery} = useAdminDeliveryQuery(deliveryId);


  console.log("Delivery data:", delivery);
  

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
{   delivery &&  <Container maxW="7xl">
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
        { delivery.orders && <Card.Root bg="bg.primary" border="1px" borderColor="border.subtle">
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
                  accessor: (order) => order.owner.id,
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
                  accessor: (order) => order.total,
                  align: "end",
                },
              ]}
              data={delivery.orders}
            />
          </Card.Body>
        </Card.Root>}
        { delivery.stats && delivery.stats.length > 0 && <Card.Root bg="bg.primary" border="1px" borderColor="border.subtle">
          <Card.Header>
            <Heading p={0} size="lg" color="text.primary">
              Statistics
            </Heading>
          </Card.Header>
          <Card.Body p={0}>
            <DataTable
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
                  key: "totalCost",
                  header: "Total Cost",
                  accessor: (item) => item.total,
                },
              ]}
              data={delivery.stats!}
            />
          </Card.Body>
        </Card.Root>}
      </Container>
}
    </Box>
  );
}
