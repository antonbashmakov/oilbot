import { Card, Flex, Text } from "@chakra-ui/react";

interface KPICardProps {
  name: string;
  value: string | number;
  description: string;
}

export function KPICard({ name, value, description }: KPICardProps) {
  return (
    <Card.Root bg="surface.container" border="1px" borderColor="border.subtle">
      <Card.Body>
        <Flex direction="column" gap="2">
          <Text color="text.secondary" fontSize="sm" fontWeight="medium">
            {name}
          </Text>
          <Text color="text.primary" fontSize="3xl" fontWeight="bold">
            {value}
          </Text>
          <Text color="text.secondary" fontSize="sm">
            {description}
          </Text>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
}
