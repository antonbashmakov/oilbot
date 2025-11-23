import { Box, Badge, Text, Link, Flex } from "@chakra-ui/react";

interface InfoMessageProps {
  type: "alert" | "info" | "warning";
  badgeText: string;
  message: string;
  linkText?: string;
  linkHref?: string;
}

export function InfoMessage({ 
  type, 
  badgeText, 
  message, 
  linkText, 
  linkHref 
}: InfoMessageProps) {
  // Define colors based on message type
  const getColors = () => {
    switch (type) {
      case "alert":
        return {
          badgeBg: "red.100",
          badgeColor: "red.800",
          borderColor: "red.200",
          bg: "red.50"
        };
      case "warning":
        return {
          badgeBg: "orange.100",
          badgeColor: "orange.800",
          borderColor: "orange.200",
          bg: "orange.50"
        };
      case "info":
      default:
        return {
          badgeBg: "blue.100",
          badgeColor: "blue.800",
          borderColor: "surface.elevated",
          bg: "bg.primary"
        };
    }
  };

  const colors = getColors();

  return (
    <Box
      bg={colors.bg}
      border="1px"
      borderStyle={"solid"}
      borderColor={colors.borderColor}
      borderRadius="md"
      p="3"
    >
      <Flex direction="row" align="center" gap="2">
        <Badge
          bg={colors.badgeBg}
          color={colors.badgeColor}
          fontSize="xs"
          fontWeight="medium"
          borderRadius="sm"
          px="2"
          py="1"
        >
          {badgeText}
        </Badge>
        <Text fontSize="sm" color="text.secondary">
          {message}
          {linkText && linkHref && (
            <>
              {" "}
              <Link
                href={linkHref}
                color="blue.600"
                fontWeight="medium"
                textDecoration="underline"
                _hover={{ color: "blue.700" }}
              >
                {linkText}
              </Link>
            </>
          )}
        </Text>
      </Flex>
    </Box>
  );
}
