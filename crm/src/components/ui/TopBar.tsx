"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Flex,
  HStack,
  Avatar,
  Text,
  VStack,
  Menu,
  Portal,
  Badge,
} from "@chakra-ui/react";
import { ChevronDownIcon, EmailIcon, ArrowForwardIcon } from "@chakra-ui/icons";
import { useUser } from "@/api/user/provider";
import { clearAuthToken } from "@/utils/auth";
import { useBuildInfo } from "@/hooks/useBuildInfo";

export default function TopBar() {
  const router = useRouter();
  const { user, setUser, isLoading } = useUser();
  const { buildInfo } = useBuildInfo();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    // Clear user from context
    setUser(null);
    // Clear token from storage
    clearAuthToken();
    // Redirect to login page
    router.push("/login");
  };

  // Don't show top bar while loading or if user is not logged in
  if (isLoading || !user) {
    return null;
  }

  return (
    <Box
      as="header"
      position="sticky"
      top="0"
      zIndex="1000"
      bg="surface.container"
      borderBottom="1px"
      borderColor="border.subtle"
      px="6"
      py="3"
    >
      <Flex justify="space-between" align="center">
        {/* Left side - Logo/Brand */}
        <HStack gap="3">
          <Box
            as="span"
            color="primary.500"
            fontSize="2xl"
            className="material-symbols-outlined"
            style={{
              fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"
            }}
          >
            insights
          </Box>
          <Text fontSize="xl" fontWeight="bold" color="text.primary">
            CRM Dashboard
          </Text>
          {buildInfo && (
            <Badge
              colorScheme="blue"
              variant="subtle"
              fontSize="xs"
              px="2"
              py="1"
              borderRadius="md"
            >
              v{buildInfo.version} ({buildInfo.commitHash})
            </Badge>
          )}
        </HStack>

        {/* Right side - User menu */}
        <Box position="relative" ref={menuRef}>
          {true && <Menu.Root>
            <Menu.Trigger asChild>
              <HStack h="10" gap="3">
                <Avatar.Root size="sm">
                  <Avatar.Fallback>
                    <EmailIcon />
                  </Avatar.Fallback>
                </Avatar.Root>
                <VStack gap="0" align="start" display={{ base: "none", md: "flex" }}>
                  <Text fontSize="sm" fontWeight="medium" color="text.primary">
                    {user.email}
                  </Text>
                  <Text fontSize="xs" color="text.secondary">
                    {user.roles?.join(", ")}
                  </Text>
                </VStack>

              </HStack>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item
                    onClick={handleLogout}
                    px="4"
                    py="2"
                    value=""
                    _hover={{ bg: "bg.subtle" }}
                    cursor="pointer"
                  >
                    <HStack gap="3">
                      <ArrowForwardIcon boxSize="4" />
                      <Text fontSize="sm">Logout</Text>
                    </HStack>
                  </Menu.Item>

                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>

          }

          {/* <MenuContent
              position="absolute"
              right="0"
              top="100%"
              mt="2"
              minW="200px"
              bg="surface.container"
              border="1px"
              borderColor="border.medium"
              borderRadius="md"
              boxShadow="lg"
              py="2"
              zIndex="1001"
            >
              <MenuItem
                onClick={handleLogout}
                px="4"
                py="2"
                value=""
                _hover={{ bg: "bg.subtle" }}
                cursor="pointer"
              >
                <HStack gap="3">
                  <ArrowForwardIcon boxSize="4" />
                  <Text fontSize="sm">Logout</Text>
                </HStack>
              </MenuItem>
            </MenuContent> */}


        </Box>
      </Flex>
    </Box>
  );
}
