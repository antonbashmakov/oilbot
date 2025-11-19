import { Card, Box, Text, Badge, Flex } from "@chakra-ui/react";

export interface Delivery {
  id: string;
  number: number;
  description: string;
  status: "PENDING" | "IN_TRANSIT" | "IN_TRANSIT_BACK" | "FULFILLED";
  order_deadline: string;
  delivery_start: string;
  delivery_end: string;
  group: string;
  orders: Array<{
    id: string;
    customerName: string;
    orderDate: string;
    status: "PENDING" | "PAID" | "CONSOLIDATED";
    numberOfItems: number;
    totalValue: number;
  }>;
}

interface DeliveryInformationCardProps {
  delivery: Delivery;
}

export function DeliveryInformationCard({ delivery }: DeliveryInformationCardProps) {
  const statusColors = {
    PENDING: "yellow",
    IN_TRANSIT: "status.inTransit",
    IN_TRANSIT_BACK: "status.inTransitBack",
    FULFILLED: "green",
  };

  const statusLabels = {
    PENDING: "Pending",
    IN_TRANSIT: "In Transit",
    IN_TRANSIT_BACK: "In Transit Back",
    FULFILLED: "Fulfilled",
  };

  return (
    <Card.Root bg="surface.container" border="1px" borderColor="border.subtle" borderRadius="xl" >
      <Card.Body>
        <Flex direction="column" gap="6">
          {/* Header with ID and Number */}
          <Flex justify="space-between" align="start">
            <Box>
              <Text color="text.secondary" fontSize="sm" fontWeight="medium">
                Delivery ID
              </Text>
              <Text color="text.primary" fontSize="lg" fontWeight="semibold">
                {delivery.id}
              </Text>
            </Box>
            <Box textAlign="right">
              <Text color="text.secondary" fontSize="sm" fontWeight="medium">
                Number
              </Text>
              <Text color="text.primary" fontSize="lg" fontWeight="semibold">
                #{delivery.number}
              </Text>
            </Box>
          </Flex>

          {/* Description */}
          <Box>
            <Text color="text.secondary" fontSize="sm" fontWeight="medium" mb="2">
              Description
            </Text>
            <Text color="text.primary" lineHeight="1.5">
              {delivery.description}
            </Text>
          </Box>

          {/* Status and Group */}
          <Flex gap="8" wrap="wrap">
            <Box>
              <Text color="text.secondary" fontSize="sm" fontWeight="medium" mb="1">
                Status
              </Text>
              <Badge colorPalette={statusColors[delivery.status]}>
                {statusLabels[delivery.status]}
              </Badge>
            </Box>
            <Box>
              <Text color="text.secondary" fontSize="sm" fontWeight="medium" mb="1">
                Group
              </Text>
              <Text color="text.primary">{delivery.group}</Text>
            </Box>
          </Flex>

          {/* Dates */}
          <Flex gap="8" wrap="wrap">
            <Box>
              <Text color="text.secondary" fontSize="sm" fontWeight="medium" mb="1">
                Order Deadline
              </Text>
              <Text color="text.primary">{delivery.order_deadline}</Text>
            </Box>
            <Box>
              <Text color="text.secondary" fontSize="sm" fontWeight="medium" mb="1">
                Delivery Start
              </Text>
              <Text color="text.primary">{delivery.delivery_start}</Text>
            </Box>
            <Box>
              <Text color="text.secondary" fontSize="sm" fontWeight="medium" mb="1">
                Delivery End
              </Text>
              <Text color="text.primary">{delivery.delivery_end}</Text>
            </Box>
          </Flex>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
}
