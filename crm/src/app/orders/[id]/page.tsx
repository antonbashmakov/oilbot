"use client";

import {
  Avatar,
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
  Text,
  VStack,
  Container,
  Separator,
  IconButton,
  Status,
  Tabs,
  HStack,
  Dialog,
} from "@chakra-ui/react";
import { useParams } from "next/navigation";
import { DataTable, Column, DecimalDataField } from "@/components/DataTable";
import { CartItem, PickingItem } from "@/api/models";
import { useAdminOrderOverviewQuery, useCollectPickingItem, useConsolidateOrder, usePatchOrderPicking, useStartOrderPicking, useAdminOrderConciliationQuery, useAdminOrderPaymentsQuery, useCreateOrderPayment, useCancelOrder } from "@/api";
import { InfoMessage } from "@/components/ui/InfoMessage";
import { PaymentCard } from "@/components/ui/PaymentCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCallback, useEffect, useState } from "react";
import { AddIcon, MinusIcon, LockIcon } from "@chakra-ui/icons";
import { useTranslations } from 'next-intl';


export default function OrderPage() {
  const { id: orderId } = useParams();
  const t = useTranslations('orders');

  const [selectedItem, setSelectedItem] = useState<PickingItem>()
  const [isReadyForConsolidation, setIsReadyForConsolidation] = useState<boolean>(false);
  const [isOrderEditable, setIsOrderEditable] = useState<boolean>(false);
  const [isMissingOriginalPayment, setIsMissingOriginalPayment] = useState<boolean>(false);
  const [isMissingConsolidationPayment, setIsMissingConsolidationPayment] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("order-items");
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState<boolean>(false);

  const { data: order } = useAdminOrderOverviewQuery(orderId as string);
  const { data: conciliationOrder } = useAdminOrderConciliationQuery(orderId as string);
  const { data: payments = [] } = useAdminOrderPaymentsQuery(orderId as string);
  const { mutate: mutatePicking } = usePatchOrderPicking(orderId as string);
  const { mutate: mutateStartPicking, isPending: isStartPicking } = useStartOrderPicking(orderId as string);
  const { mutate: mutateConsolidate, isPending: isConsolidating } = useConsolidateOrder(orderId as string);
  const { mutate: collectPicking, isPending: isCollecting } = useCollectPickingItem(orderId as string, selectedItem?.id);
  const { mutate: createOriginalPayment, isPending: isCreatingOriginalPayment } = useCreateOrderPayment(orderId as string);
  const { mutate: createConciliationPayment, isPending: isCreatingConciliationPayment } = useCreateOrderPayment(conciliationOrder?.id);
  const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrder(orderId as string);

  // Sort payments into original and conciliation arrays
  const originalPayments = payments.filter(payment =>
    payment.order_id === orderId || !conciliationOrder || payment.order_id !== conciliationOrder.id
  );
  const conciliationPayments = payments.filter(payment =>
    conciliationOrder && payment.order_id === conciliationOrder.id
  );

  useEffect(() => setIsMissingOriginalPayment(!originalPayments?.filter(p => (p.status === 'SENT' || p.status === 'CONFIRMED')).length), [originalPayments]);
  useEffect(() => setIsMissingConsolidationPayment(order?.status === 'RESOLVING' && !conciliationPayments?.filter(p => (p.status === 'SENT' || p.status === 'CONFIRMED')).length), [conciliationPayments]);

  const isRowDisabled = (item: PickingItem) => {
    return isCollecting || !isOrderEditable || (item.status === 'CANCELED');
  };

  const rowButtons = (item: PickingItem) => {

    if (!item.status || item.status === 'PENDING') {
      return [
        <IconButton
          key="add"
          aria-label="Add quantity"
          size="xs"
          colorScheme="green"
          onClick={() => onCollectClick(item)}
        >
          <AddIcon />
        </IconButton>

      ];
    }
    if (item.status === 'COLLECTED') {
      return [
        <IconButton
          key="remove"
          aria-label="Remove quantity"
          size="xs"
          colorScheme="red"
          onClick={() => onCollectClick(item)}
          disabled={item.quantity <= 0}
        >
          <MinusIcon />
        </IconButton>
      ];
    }

    return [];

  };

  const onSave = async (data: CartItem[]) => {
    return mutatePicking({ items: data });
  };

  const onStartPickingClick = useCallback(() => {
    if (order && !order.picking) {
      mutateStartPicking();
    }
  }, [order]);
  const onConsolidateClick = useCallback(() => {
    console.log(isReadyForConsolidation)
    if (isReadyForConsolidation) {
      mutateConsolidate();
    }
  }, [isReadyForConsolidation]);

  const onCollectClick = useCallback((item: PickingItem) => {
    setSelectedItem(item);
  }, [selectedItem]);

  const onCreateOriginalPaymentClick = useCallback(() => {
    if (orderId) {
      const idempotencyKey = `original-${orderId}-${Date.now()}`;
      createOriginalPayment({ idempotency_key: idempotencyKey });
    }
  }, [orderId, createOriginalPayment]);

  const onCreateConciliationPaymentClick = useCallback(() => {
    if (conciliationOrder?.id) {
      const idempotencyKey = `conciliation-${conciliationOrder.id}-${Date.now()}`;
      createConciliationPayment({ idempotency_key: idempotencyKey });
    }
  }, [conciliationOrder?.id, createConciliationPayment]);

  const onCancelClick = useCallback(() => {
    setIsCancelDialogOpen(true);
  }, []);

  const onCancelConfirm = useCallback(() => {
    console.log('Order cancellation confirmed for order:', orderId);
    cancelOrder(undefined, {
      onSuccess: () => {
        console.log('Order cancelled successfully');
        setIsCancelDialogOpen(false);
        // The mutation will invalidate the order query, causing a refetch
      },
      onError: (error) => {
        console.error('Failed to cancel order:', error);
        // Keep dialog open to show error? Or close and show toast?
        setIsCancelDialogOpen(false);
      }
    });
  }, [orderId, cancelOrder]);

  const onCancelCancel = useCallback(() => {
    setIsCancelDialogOpen(false);
  }, []);

  useEffect(() => {
    if (selectedItem?.id) {
      collectPicking();
    }
  }, [selectedItem]);

  useEffect(() => {
    setIsReadyForConsolidation(!!order && (order.status === 'PENDING' || order.status === 'PAID') && !!order.picking && order.picking.items.filter(i => i.status === 'COLLECTED').length === order.picking.items.length);
    setIsOrderEditable((order?.status === 'PENDING' || order?.status === 'PAID'));
  }, [order]);

  // Column definitions using translations
  const columns: Column<CartItem>[] = [
    { key: "id", header: t('table.columns.id'), accessor: (item) => item.id },
    { key: "name", header: t('table.columns.name'), accessor: (item) => item.name },
    {
      key: "fraction",
      field: "fraction",
      summarizable: true,
      header: t('table.columns.fraction'),
      accessor: (item) => item.fraction
    },
    {
      key: "quantity",
      header: t('table.columns.quantity'),
      accessor: (item) => item.quantity,
      align: "end",
    },
    {
      key: "price",
      field: "price",
      summarizable: true,
      header: t('table.columns.price'),
      accessor: (item) => item.price.toFixed(2),
      align: "end",
    },
  ];

  const pickingColumns: Column<PickingItem>[] = [
    {
      key: 'collected-status',
      header: '',
      accessor: (item) => <>{item.status === 'COLLECTED' && <Status.Root colorPalette="blue">
        <Status.Indicator />
      </Status.Root>}</>,
    },
    {
      key: 'id',
      header: t('table.columns.id'),
      accessor: (item) => item.id,
      width: '80px',
    },
    {
      key: 'name',
      header: t('table.columns.name'),
      accessor: (item) => item.name,
    },
    {
      key: 'fraction',
      header: t('table.columns.fraction'),
      accessor: (item) => item.fraction,
      editable: true,
      field: 'fraction',
      renderer: DecimalDataField,
    },
    {
      key: 'price',
      header: t('table.columns.price'),
      accessor: (item) => Math.floor(item.price_for_unit * item.fraction * item.quantity),
    },
    {
      key: 'price_for_unit',
      header: t('table.columns.priceForUnit'),
      editable: true,
      field: 'price_for_unit',
      renderer: DecimalDataField,
      accessor: (item) => item.price_for_unit,
    },
    {
      key: 'quantity',
      header: t('table.columns.quantity'),
      accessor: (item) => item.quantity,
      field: 'quantity',
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
                <Breadcrumb.Link href="/dashboard">{t('breadcrumbs.dashboard')}</Breadcrumb.Link>
              </Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                <Breadcrumb.Link href="/orders">{t('breadcrumbs.orders')}</Breadcrumb.Link>
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
                  {t('pageTitle', { orderId: orderId as string })}
                </Heading>
                <StatusBadge status={order.status} />
                {!isOrderEditable && (
                  <Flex align="center" gap={1} color="gray.500">
                    <LockIcon boxSize={4} />
                    <Text fontSize="sm">{t('status.locked')}</Text>
                  </Flex>
                )}
              </Flex>
              <Flex gap={2}>
                {!order.picking && <Button loading={isStartPicking} onClick={onStartPickingClick} colorScheme="blue">{t('buttons.startPicking')}</Button>}
                <Button disabled={!isReadyForConsolidation} loading={isConsolidating} onClick={onConsolidateClick} colorScheme="blue">{t('buttons.consolidate')}</Button>
                <Button onClick={onCancelClick} bg="red.500" color="white" variant="outline" loading={isCancelling}>{t('buttons.cancel')}</Button>
              </Flex>
            </Flex>

            <Grid templateColumns="repeat(3, 1fr)" gap={6}>
              <GridItem colSpan={2}>
                <Tabs.Root bg="surface.container" value={activeTab} onValueChange={(e) => setActiveTab(e.value)}>
                  <Tabs.List>
                    <Tabs.Trigger value="order-items">{t('tabs.orderItems')}</Tabs.Trigger>
                    <Tabs.Trigger disabled={!conciliationOrder || !conciliationOrder.items} value="closing-order">{t('tabs.closingOrder')}</Tabs.Trigger>
                  </Tabs.List>
                  <Tabs.Content value="order-items">
                    <VStack gap={6} align="stretch" mt={4}>
                      <DataTable
                        columns={columns}
                        data={order.items}
                        getKey={i => i.id}
                      />
                      <InfoMessage
                        type="info"
                        badgeText={t('infoMessages.note')}
                        message={order.picking ? t('infoMessages.changeFraction') : t('infoMessages.clickStartPicking')}
                      />

                      {
                        order.picking && <DataTable
                          columns={pickingColumns}
                          data={order.picking.items}
                          title={t('table.products')}
                          isSaving={false}
                          onSave={onSave}
                          isRowDisabled={isRowDisabled}
                          rowButtons={rowButtons}
                          getKey={i => i.id}
                        />
                      }
                    </VStack>
                  </Tabs.Content>
                  <Tabs.Content value="closing-order">
                    <VStack gap={6} align="stretch" mt={4}>
                      {conciliationOrder && conciliationOrder.items ? (
                        <>
                          <Card.Root>
                            <Card.Header>
                              <Heading size="md">{t('cards.closingOrderInfo')}</Heading>
                            </Card.Header>
                            <Card.Body>
                              <DataList.Root orientation="horizontal" maxW="md">
                                <DataList.Item key="conciliation-id">
                                  <DataList.ItemLabel>{t('dataList.orderId')}</DataList.ItemLabel>
                                  <DataList.ItemValue>{conciliationOrder.id}</DataList.ItemValue>
                                </DataList.Item>
                                <DataList.Item key="conciliation-status">
                                  <DataList.ItemLabel>{t('dataList.status')}</DataList.ItemLabel>
                                  <DataList.ItemValue>
                                    <StatusBadge status={conciliationOrder.status} />
                                  </DataList.ItemValue>
                                </DataList.Item>
                              </DataList.Root>
                            </Card.Body>
                          </Card.Root>

                          <DataTable
                            columns={columns}
                            data={conciliationOrder.items}
                            title={t('table.closingOrderItems')}
                            getKey={i => i.id}
                            isRowDisabled={() => true}
                          />
                        </>
                      ) : (
                        <InfoMessage
                          type="info"
                          badgeText="Info"
                          message={t('infoMessages.noClosingOrder')}
                        />
                      )}
                    </VStack>
                  </Tabs.Content>
                </Tabs.Root>
              </GridItem>

              <GridItem colSpan={1}>
                <VStack gap={6} align="stretch" >
                  <Card.Root bg="surface.container">
                    <Card.Header>
                      <Heading size="md">{t('cards.customer')}</Heading>
                    </Card.Header>
                    <Card.Body>
                      <Flex align="center" gap={4}>
                        <Avatar.Root>
                          <Avatar.Image src="https://avatar.iran.liara.run/public/job/teacher/male" />
                        </Avatar.Root>
                        <Box>
                          <Text fontWeight="bold">{order.customer?.first_name} {order.customer?.last_name}
                          </Text>
                          {order.customer.username && <Link href={`https://t.me/${order.customer.username}`} color="blue.500">
                            @{order.customer.username}
                          </Link>}
                          {!order.customer.username && <Text color="text.secondary">{order.customer.id}</Text>}
                        </Box>
                      </Flex>
                    </Card.Body>
                  </Card.Root>

                  <Card.Root bg="surface.container">
                    <Card.Header>
                      <Heading size="md">{t('cards.orderCalculation')}</Heading>
                    </Card.Header>
                    <Card.Body>
                      <DataList.Root orientation="horizontal" maxW="md">

                        <DataList.Item key="calculation-original">
                          <DataList.ItemLabel>{t('cards.original')}</DataList.ItemLabel>
                          <DataList.ItemValue>{order.total}</DataList.ItemValue>
                        </DataList.Item>
                        <DataList.Item key="calculation-picking">
                          <DataList.ItemLabel>{t('cards.picking')}</DataList.ItemLabel>
                          <DataList.ItemValue>{order.picking?.total || 0}</DataList.ItemValue>
                        </DataList.Item>
                        <Separator />
                        <DataList.Item key="calculation-final" fontWeight="bold">
                          <DataList.ItemLabel>{t('cards.finalTotal')}</DataList.ItemLabel>
                          <DataList.ItemValue>{(order.total || 0) - (order.picking?.total || 0)}</DataList.ItemValue>
                        </DataList.Item>

                      </DataList.Root>
                    </Card.Body>
                  </Card.Root>
                  <Card.Root bg="surface.container">
                    <Card.Body>
                      <HStack justifyContent={'space-between'}>
                        <Heading size="md">{t('cards.original')}</Heading>
                        <Button
                          disabled={!isMissingOriginalPayment || isCreatingOriginalPayment}
                          loading={isCreatingOriginalPayment}
                          onClick={onCreateOriginalPaymentClick}
                          size="2xs"
                          colorScheme="dark"
                          bg="blue.800"
                          color="white"
                        >
                          {t('buttons.newPayment')}
                        </Button>
                      </HStack>

                      {originalPayments.map((payment) => (
                        <PaymentCard key={payment.id} payment={payment} />
                      ))}
                      <Separator />
                      <HStack mt={2} justifyContent={'space-between'}>
                        <Heading size="md">{t('cards.closing')}</Heading>
                        <Button
                          disabled={!isMissingConsolidationPayment || isCreatingConciliationPayment || !conciliationOrder?.id}
                          loading={isCreatingConciliationPayment}
                          onClick={onCreateConciliationPaymentClick}
                          size="2xs"
                          colorScheme="dark"
                          bg="blue.800"
                          color="white"
                        >
                          {t('buttons.newPayment')}
                        </Button>
                      </HStack>
                      {conciliationPayments.map((payment) => (
                        <PaymentCard key={payment.id} payment={payment} />
                      ))}

                    </Card.Body>
                  </Card.Root>
                </VStack>
              </GridItem>
            </Grid>

          </>
          }
        </VStack>
      </Container>

      {/* Cancel Order Confirmation Dialog */}
      <Dialog.Root open={isCancelDialogOpen} onOpenChange={(e) => setIsCancelDialogOpen(e.open)}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg="bg.primary">
            <Dialog.Header>
              <Dialog.Title>{t('dialog.cancelTitle')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack gap={4} align="stretch">
                <Text color="text.secondary">{t('dialog.cancelMessage')}</Text>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={onCancelCancel}>
                {t('dialog.keepOrder')}
              </Button>
              <Button bg="red.500" color="white" colorScheme="dark" onClick={onCancelConfirm}>
                {t('dialog.cancelOrder')}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
}
