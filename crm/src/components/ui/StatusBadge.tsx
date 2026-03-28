import { Badge, BadgeProps } from "@chakra-ui/react";

export type StatusValue =
  | "SENT"
  | "CANCELED"
  | "CONFIRMED"
  | "FAILED"
  | "TIMED_OUT"
  | "CANCELED"
  | "REJECTED"
  | "PENDING"
  | "PAYMENT_IN_PROGRESS"
  | "PAID"
  | "RESOLVING"
  | "CONCILIATION_PAYMENT_IN_PROGRESS"
  | "CONSOLIDATION_SUCCESSFUL"
  | "CONCILIATED"
  | "DELIVERED"
  | "PAYMENT_FAILED";

interface StatusBadgeProps extends Omit<BadgeProps, "children"> {
  status: StatusValue;
  children?: React.ReactNode;
}

const getStatusConfig = (status: StatusValue) => {
  switch (status) {
    // Payment statuses
    case "CONFIRMED":
      return {
        colorScheme: "green",
        label: "Confirmed",
        bg: "green.100",
        color: "green.800",
        darkBg: "green.900/40",
        darkColor: "green.300",
      };
    case "SENT":
      return {
        colorScheme: "yellow",
        label: "Sent",
        bg: "yellow.100",
        color: "yellow.800",
        darkBg: "yellow.900/40",
        darkColor: "yellow.300",
      };
    case "FAILED":
      return {
        colorScheme: "red",
        label: "Failed",
        bg: "red.100",
        color: "red.800",
        darkBg: "red.900/40",
        darkColor: "red.300",
      };
    case "TIMED_OUT":
      return {
        colorScheme: "gray",
        label: "Timed Out",
        bg: "gray.100",
        color: "gray.800",
        darkBg: "gray.900/40",
        darkColor: "gray.300",
      };
    case "CANCELED":
      return {
        colorScheme: "red",
        label: "Canceled",
        bg: "red.100",
        color: "red.800",
        darkBg: "red.900/40",
        darkColor: "red.300",
      };
    case "REJECTED":
      return {
        colorScheme: "red",
        label: "Rejected",
        bg: "red.100",
        color: "red.800",
        darkBg: "red.900/40",
        darkColor: "red.300",
      };
    case "PAYMENT_FAILED":
      return {
        colorScheme: "red",
        label: "Rejected",
        bg: "red.100",
        color: "red.800",
        darkBg: "red.900/40",
        darkColor: "red.300",
      };

    // Order statuses
    case "PENDING":
      return {
        colorScheme: "blue",
        label: "Pending",
        bg: "blue.100",
        color: "blue.800",
        darkBg: "blue.900/40",
        darkColor: "blue.300",
      };
    case "PAYMENT_IN_PROGRESS":
      return {
        colorScheme: "orange",
        label: "Payment in Progress",
        bg: "orange.100",
        color: "orange.800",
        darkBg: "orange.900/40",
        darkColor: "orange.300",
      };
    case "PAID":
      return {
        colorScheme: "green",
        label: "Paid",
        bg: "green.100",
        color: "green.800",
        darkBg: "green.900/40",
        darkColor: "green.300",
      };
    case "RESOLVING":
      return {
        colorScheme: "purple",
        label: "Resolving",
        bg: "purple.100",
        color: "purple.800",
        darkBg: "purple.900/40",
        darkColor: "purple.300",
      };
    case "CONCILIATION_PAYMENT_IN_PROGRESS":
      return {
        colorScheme: "orange",
        label: "Conciliation Payment in Progress",
        bg: "orange.100",
        color: "orange.800",
        darkBg: "orange.900/40",
        darkColor: "orange.300",
      };
    case "CONCILIATED":
      return {
        colorScheme: "green",
        label: "Conciliated",
        bg: "green.100",
        color: "green.800",
        darkBg: "green.900/40",
        darkColor: "green.300",
      };
    default:
      return {
        colorScheme: "gray",
        label: status,
        bg: "gray.100",
        color: "gray.800",
        darkBg: "gray.900/40",
        darkColor: "gray.300",
      };
  }
};

export const StatusBadge = ({ status, children, ...props }: StatusBadgeProps) => {
  const config = getStatusConfig(status);
  const label = children || config.label;

  return (
    <Badge
      colorScheme={config.colorScheme}
      bg={config.bg}
      color={config.color}
      _dark={{
        bg: config.darkBg,
        color: config.darkColor,
      }}
      px={2}
      py={0.5}
      borderRadius="md"
      fontSize="xs"
      fontWeight="medium"
      {...props}
    >
      {label}
    </Badge>
  );
};
