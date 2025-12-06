"use client";

import {
  Box,
  Container,
  Flex,
  VStack,
  Heading,
  Text,
  Button,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { FaHourglassHalf } from "react-icons/fa";
import Link from "next/link";

export default function ApprovePage() {
  return (
    <Box
      bg="bg.primary"
      minH="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      {/* Main Content */}
      <Container
        maxW="container.sm"
        flex="1"
        display="flex"
        alignItems="center"
        justifyContent="center"
        py="8"
      >
        <Box
          bg="surface.container"
          borderRadius="xl"
          p="8"
          width="full"
          maxW="480px"
          boxShadow="lg"
          border="1px"
          borderColor="border.subtle"
        >
          <VStack gap="8" align="center">
            {/* Icon Visual */}
            <Flex
              h="24"
              w="24"
              alignItems="center"
              justifyContent="center"
              borderRadius="full"
              bg="orange.50"
              _dark={{ bg: "orange.50" }}
            >
              <Box
                as="span"
                fontSize="5xl"
                color={"orange.400"}
              >
                <FaHourglassHalf  />
              </Box>
            </Flex>

            {/* Text Content */}
            <VStack gap="3" textAlign="center">
              <Heading size="lg" color="text.primary">
                Wait for your account to be enabled
              </Heading>
              <Text color="text.secondary" fontSize="md" lineHeight="relaxed">
                Your supervisor will examine the account shortly.
                <br />
                You will receive an email once approved.
              </Text>
            </VStack>


          </VStack>
        </Box>
      </Container>

      {/* Footer */}
      <Box
        borderTop="1px"
        borderColor="border.subtle"
        bg="surface.container/50"
        py="6"
        backdropFilter="blur(8px)"
      >
        <Container maxW="7xl">
          <Flex
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align="center"
            gap="4"
          >
            <Text color="text.secondary" fontSize="sm" fontWeight="medium">
              © 2023 CRM System v2.0. All rights reserved.
            </Text>
            <Flex gap="6">
              <ChakraLink
                as={Link}
                href="#"
                color="text.secondary"
                fontSize="sm"
                fontWeight="medium"
                _hover={{ color: "primary.500" }}
              >
                Contact Support
              </ChakraLink>
              <ChakraLink
                as={Link}
                href="#"
                color="text.secondary"
                fontSize="sm"
                fontWeight="medium"
                _hover={{ color: "primary.500" }}
              >
                Privacy Policy
              </ChakraLink>
            </Flex>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
}
