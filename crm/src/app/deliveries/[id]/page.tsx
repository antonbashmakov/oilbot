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
import { useAdminDeliveryQuery, useDownloadDeliveryStats } from "@/api";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useEffect, useState } from "react";
import { useTranslations } from 'next-intl';
import { DeliveryOverviewItemStats, Order, Stats } from "@/api/models";
import _ from "lodash";

export default function DeliveryDetailPage() {
  const params = useParams();
  const deliveryId = params.id as string;
  const t = useTranslations('deliveries');

  const { data: delivery } = useAdminDeliveryQuery(deliveryId);
  const downloadStatsMutation = useDownloadDeliveryStats();
  const [isDownloading, setDownloading] = useState(false);
  const [activeOrders, setActiveOrders] = useState<Order[]>();
  const [stats, setStats] = useState<DeliveryOverviewItemStats[]>();

  const handleEdit = () => {
    console.log("Edit delivery:", deliveryId);
    // Implement edit functionality
  };

  const handleMarkDelivered = () => {
    console.log("Mark delivery as delivered:", deliveryId);
    // Implement mark delivered functionality
  };

  const handleDownloadReport = async () => {
    try {
      setDownloading(true);
      const response = await downloadStatsMutation(delivery!.id);

      // Get the blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `delivery-${deliveryId}-stats.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading report:", error);
    }
    setDownloading(false);

  };

  useEffect(() => {
    if (delivery) {
      const active = _.sortBy(delivery.activeOrders, "owner.id");
      const stats = _.sortBy(delivery.stats!, "name");
      setActiveOrders(active);
      setStats(stats);
    }
  }, [delivery]);

  return (
    <Box bg="bg.primary" minH="100vh" py="8">
      {delivery && <Container maxW="7xl">
        {/* Header with title and buttons */}
        <Flex justify="space-between" align="center" mb="8">
          <Box>
            <Heading size="2xl" color="text.primary">
              {t('pageTitle', { deliveryNumber: delivery.number })}
            </Heading>
            <Text color="text.secondary" fontSize="lg" mt="2">
              {delivery.description}
            </Text>
          </Box>
          <Flex gap="4">
            <Button variant="outline" onClick={handleEdit}>
              {t('buttons.edit')}
            </Button>
            <Button colorPalette="green" onClick={handleMarkDelivered}>
              {t('buttons.markDelivered')}
            </Button>
          </Flex>
        </Flex>

        {/* Delivery Information Card */}
        <DeliveryInformationCard delivery={delivery} />
        <Container mb="8" />
        {/* Orders Table */}
        {activeOrders && <Card.Root bg="bg.primary" border="1px" borderColor="border.subtle" mb="8">

          <Card.Body p={0}>
            <DataTable
              title={t('tables.ordersInDelivery')}
              getKey={i => i.id}
              columns={[
                {
                  key: "id",
                  header: t('columns.orderId'),

                  accessor: (order) => (
                    <Link target="_blank" href={`/orders/${order.id}`}><Text fontWeight="medium">{order.id}</Text></Link>
                  ),
                },
                {
                  key: "name",
                  header: t('columns.name'),
                  accessor: (order) => order.name,
                },
                {
                  key: "customerName",
                  header: t('columns.customerName'),
                  accessor: (order) => order.owner.id,
                },
                {
                  key: "status",
                  header: t('columns.status'),
                  accessor: (order) => <StatusBadge status={order.status} />,
                },
                {
                  key: "numberOfItems",
                  header: t('columns.items'),
                  accessor: (order) => order.items.length,
                },
                {
                  key: "totalValue",
                  field: "total",
                  header: t('columns.totalValue'),
                  accessor: (order) => order.total,
                  summarizable: true,
                  align: "end",
                },
              ]}
              data={activeOrders}
            />
          </Card.Body>
        </Card.Root>}
        {stats && stats.length > 0 && (
          <>
            <Flex justify="flex-end" mb="4">
              <button
                onClick={handleDownloadReport}
                disabled={isDownloading}
                className="flex items-center justify-center gap-2 h-9 px-3 rounded-md border border-gray-600 bg-surface-dark text-gray-300 hover:bg-gray-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-base">download</span>
                <span>
                  {isDownloading ? t('buttons.downloading') : t('buttons.downloadReport')}
                </span>
              </button>
            </Flex>
            <Card.Root bg="bg.primary" border="1px" borderColor="border.subtle" mb="8">
              <Card.Body p={0} >
                <DataTable
                  title={t('tables.statistics')}
                  getKey={i => i.name}
                  columns={[
                    {
                      key: "itemName",
                      header: t('columns.itemName'),
                      accessor: (item) => (
                        <Text fontWeight="medium">{item.name}</Text>
                      ),
                    },
                    {
                      key: "totalFraction",
                      header: t('columns.totalFraction'),
                      accessor: (item) => item.fraction,
                    },
                    {
                      key: "totalQuantity",
                      header: t('columns.totalQuantity'),
                      accessor: (item) => item.quantity,
                    },
                    {
                      key: "totalCost",
                      field: "total",
                      header: t('columns.totalCost'),
                      accessor: (item) => item.total,
                      summarizable: true,
                      align: "end",
                    },
                    {
                      key: "orders",
                      field: "orders",
                      header: t('columns.orders'),
                      accessor: (item) => <>{item.orders?.map(o => <Link target="_blank" href={`/orders/${o.id}`}>{o.id}, </Link>)}</>,
                      align: "end",
                    },
                  ]}
                  data={stats!}
                />
              </Card.Body>
            </Card.Root>
          </>
        )}

        {/* Canceled Orders Table */}
        {delivery.cancelledOrders && <Card.Root bg="bg.primary" border="1px" borderColor="border.subtle" mb="8">

          <Card.Body p={0}>
            <DataTable
              title={t('tables.canceledOrders')}
              getKey={i => i.id}
              columns={[
                {
                  key: "id",
                  header: t('columns.orderId'),

                  accessor: (order) => (
                    <Link target="_blank" href={`/orders/${order.id}`}><Text fontWeight="medium">{order.id}</Text></Link>
                  ),
                },
                {
                  key: "customerName",
                  header: t('columns.customerName'),
                  accessor: (order) => order.owner.id,
                },
                {
                  key: "status",
                  header: t('columns.status'),
                  accessor: (order) => <StatusBadge status={order.status} />,
                },
                {
                  key: "numberOfItems",
                  header: t('columns.items'),
                  accessor: (order) => order.number_of_items,
                  align: "end",
                },
                {
                  key: "totalValue",
                  header: t('columns.totalValue'),
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
