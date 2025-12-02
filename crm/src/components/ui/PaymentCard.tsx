import { Box, Flex, Text } from "@chakra-ui/react";
import { CheckIcon, WarningIcon, CloseIcon, TimeIcon } from "@chakra-ui/icons";
import { Payment } from "@/api/models";
import { StatusBadge, StatusValue } from "./StatusBadge";
import { format } from "date-fns";

interface PaymentCardProps {
  payment: Payment;
}

const getStatusConfig = (status: Payment["status"]) => {
  switch (status) {
    case "CONFIRMED":
      return {
        bgColor: "green.100",
        darkBgColor: "green.900/40",
        iconColor: "green.600",
        darkIconColor: "green.300",
        icon: <CheckIcon />,
        badgeBg: "green.100",
        badgeText: "green.800",
        darkBadgeBg: "green.900/40",
        darkBadgeText: "green.300",
        label: "CONFIRMED",
      };
    case "SENT":
      return {
        bgColor: "yellow.100",
        darkBgColor: "yellow.900/40",
        iconColor: "yellow.600",
        darkIconColor: "yellow.300",
        icon: <WarningIcon />,
        badgeBg: "yellow.100",
        badgeText: "yellow.800",
        darkBadgeBg: "yellow.900/40",
        darkBadgeText: "yellow.300",
        label: "SENT",
      };
    case "FAILED":
      return {
        bgColor: "red.100",
        darkBgColor: "red.900/40",
        iconColor: "red.600",
        darkIconColor: "red.300",
        icon: <CloseIcon />,
        badgeBg: "red.100",
        badgeText: "red.800",
        darkBadgeBg: "red.900/40",
        darkBadgeText: "red.300",
        label: "FAILED",
      };
    case "TIMED_OUT":
      return {
        bgColor: "gray.100",
        darkBgColor: "gray.900/40",
        iconColor: "gray.600",
        darkIconColor: "gray.300",
        icon: <TimeIcon />,
        badgeBg: "gray.100",
        badgeText: "gray.800",
        darkBadgeBg: "gray.900/40",
        darkBadgeText: "gray.300",
        label: "TIMED_OUT",
      };
    default:
      return {
        bgColor: "gray.100",
        darkBgColor: "gray.900/40",
        iconColor: "gray.600",
        darkIconColor: "gray.300",
        icon: <WarningIcon />,
        badgeBg: "gray.100",
        badgeText: "gray.800",
        darkBadgeBg: "gray.900/40",
        darkBadgeText: "gray.300",
        label: "UNKNOWN",
      };
  }
};

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), "dd MMM yyyy 'at' hh:mm a");
  } catch {
    return dateString;
  }
};

const formatAmount = (amount: number) => {
  // Assuming amount is in kopecks (minor units)
  return (amount / 100).toLocaleString("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 2,
  });
};

export const PaymentCard = ({ payment }: PaymentCardProps) => {
  const statusConfig = getStatusConfig(payment.status);

  // Generate payment description
  const paymentDescription = `#${payment.external_id}`;

  return (
    <Flex align="start" gap={4} width="100%" p={4} bg="white" _dark={{ bg: "surface.container" }} borderRadius="lg">
      {/* Icon container */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        width={8}
        height={8}
        bg={statusConfig.bgColor}
        _dark={{ bg: statusConfig.darkBadgeText }}
        borderRadius="full"
        flexShrink={0}
      >
        <Box
          as="span"
          color={statusConfig.iconColor}
          alignItems="center"
          justifyContent="center"
          display="flex"
          width={4}
          height={4}
        >
          {statusConfig.icon}
        </Box>
      </Box>

      {/* Content */}
      <Box flex={1}>
        {/* First line: Description and Amount */}
        <Flex align="center" justify="space-between" mb={1}>
          <Text fontSize="sm" fontWeight="medium" color="gray.800" _dark={{ color: "gray.200" }}>
            {paymentDescription}
          </Text>
          <Text fontSize="sm" fontWeight="semibold" color="gray.900" _dark={{ color: "white" }}>
            {formatAmount(payment.amount)}
          </Text>
        </Flex>

        {/* Second line: Date and Status Badge */}
        <Flex align="center" justifyContent={"space-between"} gap={2}>
          <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }}>
            {formatDate(payment.updated_at)}
          </Text>
          <StatusBadge status={payment.status as StatusValue} />
        </Flex>

      </Box>
    </Flex>
  );
};
