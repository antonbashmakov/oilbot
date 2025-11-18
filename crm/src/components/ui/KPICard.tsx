import { Card, Flex, Text } from "@chakra-ui/react";

interface KPICardProps {
  name: string;
  value: string | number;
  description: string;
}

export function KPICard({ name, value, description }: KPICardProps) {
  return (
    <Card.Root bg="gray.800" border="1px" borderColor="gray.700">
      <Card.Body>
        <Flex direction="column" gap="2">
          <Text color="gray.400" fontSize="sm" fontWeight="medium">
            {name}
          </Text>
          <Text color="white" fontSize="3xl" fontWeight="bold">
            {value}
          </Text>
          <Text color="gray.400" fontSize="sm">
            {description}
          </Text>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
}
