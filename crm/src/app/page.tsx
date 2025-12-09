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
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('dashboard');

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
            {t('pageTitle')}
          </Heading>
          <Text color="text.secondary" fontSize="lg">
            {t('pageSubtitle')}
          </Text>
        </Stack>

        {/* Deliveries Table */}
        { deliveries && deliveries.length > 0 && <Card.Root bg="surface.container" border="1px" borderColor="border.subtle" mb="8">
          <Card.Header pb="0">
            <Heading size="lg" color="text.primary">{t('cards.upcomingDeliveries')}</Heading>
          </Card.Header>
          <Card.Body>
            <DataTable
              getKey={i => i.id}
              title={t('tables.deliveries')}
              columns={[
                {
                  key: "id",
                  header: t('columns.id'),
                  accessor: (delivery) => (
                     <Link target="_blank" href={`/deliveries/${delivery.id}`}><Text fontWeight="medium">{delivery.id}</Text></Link>
                  ),
                },
                {
                  key: "name",
                  header: t('columns.name'),
                  accessor: (delivery) => delivery.number,
                },
                {
                  key: "description",
                  header: t('columns.description'),
                  accessor: (delivery) => (
                    <Text maxW="200px" title={delivery.description} truncate>
                      {delivery.description}
                    </Text>
                  ),
                },
                {
                  key: "numberOfOrders",
                  header: t('columns.orders'),
                  accessor: (delivery) => 'N/A',
                  align: "end",
                },
                {
                  key: "deliveryStart",
                  header: t('columns.deliveryStart'),
                  accessor: (delivery) => delivery.delivery_start,
                },
                {
                  key: "deliveryEnd",
                  header: t('columns.deliveryEnd'),
                  accessor: (delivery) => delivery.delivery_end,
                },
                {
                  key: "status",
                  header: t('columns.status'),
                  accessor: (delivery) => <StatusBadge status={delivery.status} />,
                },
                {
                  key: "group",
                  header: t('columns.group'),
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
            name={t('kpis.totalPendingDeliveries')}
            value={totalPendingDeliveries}
            description={t('kpis.totalPendingDeliveriesDescription')}
          />
          <KPICard
            name={t('kpis.orphansOrders')}
            value={orphansOrders}
            description={t('kpis.orphansOrdersDescription')}
          />
          <KPICard
            name={t('kpis.averageOrderValue')}
            value={`$${averageOrderValue}`}
            description={t('kpis.averageOrderValueDescription')}
          />
        </SimpleGrid>

        {/* Orphan Orders List */}
        <Card.Root border="1px" borderColor="border.subtle">
          <Card.Header>
            <Heading size="lg" color="text.primary">{t('cards.ordersWithoutDeliveries')}</Heading>
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
                          {t('labels.created')}: {order.createdAt}
                        </Text>
                      </Stack>
                      <Flex gap="4" align="center">
                        <Stack direction="column" gap="1" align="end">
                          <Text color="text.primary" fontWeight="medium">
                            ${order.value}
                          </Text>
                          <Text color="text.secondary" fontSize="sm">
                            {order.items} {t('labels.items')}
                          </Text>
                        </Stack>
                        <Badge colorPalette="accent.orange" variant="subtle">
                          {t('status.needsDelivery')}
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
