"use client";

import { useParams } from "next/navigation";
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Badge,
  Button,
  VStack,
  Card,
  Separator,
  Icon,
  Grid,
  GridItem,
  Dialog,
} from "@chakra-ui/react";
import { useAgentDeliveryQuery, useDeliverOrder } from "@/api";
import { LuTruck, LuPackage, LuCheck, LuMapPin, LuStore } from "react-icons/lu";
import { useState } from "react";
import { Order } from "@/api/models";
import { useTranslations } from 'next-intl';

export default function DeliveryProcessPage() {
  const params = useParams();
  const deliveryId = params.id as string;
  const { data: delivery, isLoading } = useAgentDeliveryQuery(deliveryId);
  const deliverOrderMutation = useDeliverOrder();
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [confirmOrderId, setConfirmOrderId] = useState<string | null>(null);
  const t = useTranslations('deliveryProcess');

  // Compute delivered count based on order status
  const allOrders = [...(delivery?.deliveries || []), ...(delivery?.pickups || [])];
  const deliveredCount = allOrders.filter(order => order.status === "DELIVERED").length;
  const totalOrders = allOrders.length;
  const remainingCount = totalOrders - deliveredCount;

  const handleMarkClick = (orderId: string) => {
    setConfirmOrderId(orderId);
  };

  const handleConfirm = async () => {
    if (!confirmOrderId) return;
    try {
      await deliverOrderMutation.mutateAsync(confirmOrderId);
      setConfirmOrderId(null);
    } catch (error) {
      console.error("Failed to mark order as delivered:", error);
    }
  };

  const handleCancel = () => {
    setConfirmOrderId(null);
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  if (isLoading) {
    return (
      <Box bg="bg.primary" minH="100vh" py="8">
        <Container maxW="7xl">
          <Text color="text.primary">{t('loading')}</Text>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg="bg.primary" minH="100vh" py="8">
      <Container maxW="7xl">
        {/* Header */}
        <Flex
          direction={{ base: "column", sm: "row" }}
          justify="space-between"
          align={{ base: "start", sm: "center" }}
          gap={4}
          mb={8}
          p={4}
          bg="surface.container"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.subtle"
        >
          <Flex align="center" gap={3}>
            <Box bg="primary.blue/20" p={2} borderRadius="lg">
              <Icon as={LuTruck} boxSize={6} color="primary.blueDark" />
            </Box>
            <Box>
              <Heading size="lg" color="text.primary">
                {t('myRoute')}
              </Heading>
              <Text fontSize="sm" color="text.secondary" fontWeight="medium" textTransform="uppercase">
                {t('todaysShift')}
              </Text>
            </Box>
          </Flex>
          <Flex
            align="center"
            bg="surface.elevated"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="border.medium"
            p={2}
            gap={6}
            w={{ base: "full", sm: "auto" }}
            justify="space-around"
          >
            <Box textAlign="center">
              <Text fontSize="xs" color="text.secondary" fontWeight="bold" textTransform="uppercase">
                {t('delivered')}
              </Text>
              <Flex align="baseline" justify="center" gap={1}>
                <Text fontSize="2xl" fontWeight="black" color="status.successDark">
                  {deliveredCount}
                </Text>
                <Text fontSize="sm" fontWeight="bold" color="text.secondary">
                  / {totalOrders}
                </Text>
              </Flex>
            </Box>
            <Box h={8} w="1px" bg="border.medium" />
            <Box textAlign="center">
              <Text fontSize="xs" color="text.secondary" fontWeight="bold" textTransform="uppercase">
                {t('remaining')}
              </Text>
              <Text fontSize="2xl" fontWeight="black" color="text.primary">
                {remainingCount}
              </Text>
            </Box>
          </Flex>
        </Flex>

        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={8}>
          {/* Deliveries Column */}
          <GridItem>
            <Flex align="center" gap={2} mb={4} px={1}>
              <Heading size="md" color="text.primary" display="flex" alignItems="center" gap={2}>
                {t('deliveries')}
                <Badge bg="surface.elevated" color="text.primary" fontSize="xs" fontWeight="bold" px={2} py={0.5} borderRadius="full">
                  {delivery?.deliveries?.length || 0}
                </Badge>
              </Heading>
            </Flex>
            <VStack gap={4} align="stretch">
              {delivery?.deliveries?.map((order: Order) => (
                <Card.Root key={order.id} bg="surface.container" borderWidth="1px" borderColor="border.subtle" borderRadius="xl" overflow="hidden">
                  <Card.Body p={5}>
                    <Flex justify="space-between" align="start" mb={4}>
                      <Box>
                        <Heading size="md" color="text.primary"> 
                          {order.name || order.id.slice(-4)}
                        </Heading>
                        <Flex align="center" gap={1} mt={1} color="text.secondary" fontSize="sm">
                          <Icon as={LuMapPin} boxSize={4} />
                          <Text>{order.owner?.id}</Text>
                        </Flex>
                      </Box>
                      <Badge bg="primary.blue/30" color="primary.blueDark" fontSize="xs" fontWeight="bold" px={2} py={1} borderRadius="md" borderWidth="1px" borderColor="primary.blue/50">
                        {t('orderBadge', { id: order.id.slice(-4) })}
                      </Badge>
                    </Flex>
                    <Flex wrap="wrap" gap={2} mb={4}>
                      {(expandedOrders.includes(order.id) ? order.items : order.items.slice(0, 2)).map((item) => (
                        <Badge key={item.id} bg="surface.elevated" color="text.primary" fontSize="base" fontWeight="bold" px={4} py={2} borderRadius="lg" borderWidth="1px" borderColor="border.subtle">
                          {item.name}
                        </Badge>
                      ))}
                      {!expandedOrders.includes(order.id) && order.items.length > 2 && (
                        <Badge bg="surface.elevated" color="text.secondary" fontSize="base" fontWeight="bold" px={4} py={2} borderRadius="lg" borderWidth="1px" borderColor="border.subtle">
                          {t('moreItems', { count: order.items.length - 2 })}
                        </Badge>
                      )}
                    </Flex>
                    <Separator borderColor="border.subtle" my={2} />
                    <Flex justify="space-between" align="center" mt={2}>
                      <Button variant="ghost" color="primary.blueDark" fontSize="sm" fontWeight="semibold" onClick={() => toggleExpand(order.id)}>
                        <Icon as={LuPackage} mr={1} /> {expandedOrders.includes(order.id) ? t('hideDetails') : t('viewDetails')}
                      </Button>
                      <Text fontSize="xs" color="text.secondary" fontWeight="medium">
                        {t('itemsTotal', { items: order.items.length, total: order.total })}
                      </Text>
                    </Flex>
                  </Card.Body>
                  <Box p={4} bg="surface.elevated" borderTopWidth="1px" borderColor="border.subtle">
                    {order.status === "DELIVERED" ? (
                      <Flex justify="center" align="center" h={12} bg="status.success/10" borderRadius="lg" borderWidth="1px" borderColor="status.success/30">
                        <Badge bg="status.success" color="white" fontSize="lg" fontWeight="bold" px={4} py={2} borderRadius="md">
                          {t('deliveredBadge')}
                        </Badge>
                      </Flex>
                    ) : (
                      <Button
                        w="full"
                        h={12}
                        colorPalette="green"
                        fontWeight="bold"
                        fontSize="lg"
                        borderRadius="lg"
                        onClick={() => handleMarkClick(order.id)}
                        loading={deliverOrderMutation.isPending && deliverOrderMutation.variables === order.id}
                      >
                        <Icon as={LuCheck} mr={2} /> {t('markDelivered')}
                      </Button>
                    )}
                  </Box>
                </Card.Root>
              ))}
            </VStack>
          </GridItem>

          {/* Self Pickup Column */}
          <GridItem>
            <Flex align="center" gap={2} mb={4} px={1}>
              <Heading size="md" color="text.primary" display="flex" alignItems="center" gap={2}>
                {t('selfPickup')}
                <Badge bg="surface.elevated" color="text.primary" fontSize="xs" fontWeight="bold" px={2} py={0.5} borderRadius="full">
                  {delivery?.pickups?.length || 0}
                </Badge>
              </Heading>
            </Flex>
            <VStack gap={4} align="stretch">
              {delivery?.pickups?.map((order: Order) => (
                <Card.Root key={order.id} bg="surface.container" borderWidth="1px" borderColor="border.subtle" borderRadius="xl" overflow="hidden">
                  <Card.Body p={5}>
                    <Flex justify="space-between" align="start" mb={4}>
                      <Box>
                        <Heading size="md" color="text.primary"> {order.name || order.id.slice(-4)}</Heading>
                        <Flex align="center" gap={1} mt={1} color="status.warningDark" fontSize="sm" fontWeight="medium">
                          <Icon as={LuStore} boxSize={4} />
                          <Text>{t('storePickup', { counter: order.id.slice(-1) })}</Text>
                        </Flex>
                      </Box>
                      <Badge bg="status.warning/20" color="status.warningDark" fontSize="xs" fontWeight="bold" px={2} py={1} borderRadius="md" borderWidth="1px" borderColor="status.warning/20">
                        {t('pickupBadge', { id: order.id.slice(-3) })}
                      </Badge>
                    </Flex>
                    <Flex wrap="wrap" gap={2} mb={4}>
                      {(expandedOrders.includes(order.id) ? order.items : order.items.slice(0, 2)).map((item) => (
                        <Badge key={item.id} bg="surface.elevated" color="text.primary" fontSize="base" fontWeight="bold" px={4} py={2} borderRadius="lg" borderWidth="1px" borderColor="border.subtle">
                          {item.name}
                        </Badge>
                      ))}
                      {!expandedOrders.includes(order.id) && order.items.length > 2 && (
                        <Badge bg="surface.elevated" color="text.secondary" fontSize="base" fontWeight="bold" px={4} py={2} borderRadius="lg" borderWidth="1px" borderColor="border.subtle">
                          {t('moreItems', { count: order.items.length - 2 })}
                        </Badge>
                      )}
                    </Flex>
                    <Separator borderColor="border.subtle" my={2} />
                    <Flex justify="space-between" align="center" mt={2}>
                      <Button variant="ghost" color="primary.blueDark" fontSize="sm" fontWeight="semibold" onClick={() => toggleExpand(order.id)}>
                        <Icon as={LuPackage} mr={1} /> {expandedOrders.includes(order.id) ? t('hideDetails') : t('viewDetails')}
                      </Button>
                      <Text fontSize="xs" color="text.secondary" fontWeight="medium">
                        {t('itemsTotal', { items: order.items.length, total: order.total })}
                      </Text>
                    </Flex>
                  </Card.Body>
                  <Box p={4} bg="surface.elevated" borderTopWidth="1px" borderColor="border.subtle">
                    {order.status === "DELIVERED" ? (
                      <Flex justify="center" align="center" h={12} bg="status.success/10" borderRadius="lg" borderWidth="1px" borderColor="status.success/30">
                        <Badge bg="status.success" color="white" fontSize="lg" fontWeight="bold" px={4} py={2} borderRadius="md">
                          {t('deliveredBadge')}
                        </Badge>
                      </Flex>
                    ) : (
                      <Button
                        w="full"
                        h={12}
                        colorPalette="blue"
                        fontWeight="bold"
                        fontSize="lg"
                        borderRadius="lg"
                        onClick={() => handleMarkClick(order.id)}
                        loading={deliverOrderMutation.isPending && deliverOrderMutation.variables === order.id}
                      >
                        <Icon as={LuCheck} mr={2} /> {t('markDelivered')}
                      </Button>
                    )}
                  </Box>
                </Card.Root>
              ))}
            </VStack>
          </GridItem>
        </Grid>

        {/* Confirmation Dialog */}
        <Dialog.Root open={confirmOrderId !== null} onOpenChange={(e) => !e.open && setConfirmOrderId(null)}>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content bg="bg.primary">
              <Dialog.Header>
                <Dialog.Title>{t('confirmDelivery')}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text>{t('confirmMessage')}</Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant="outline" onClick={handleCancel}>
                  {t('cancel')}
                </Button>
                <Button colorPalette="green" onClick={handleConfirm} loading={deliverOrderMutation.isPending}>
                  {t('confirm')}
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>
      </Container>
    </Box>
  );
}
