"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Flex,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Input,
  Checkbox,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { Card } from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon, EmailIcon, LockIcon } from "@chakra-ui/icons";
import Link from "next/link";
import { useLogin } from "@/api";
import { setAuthToken } from "@/utils/auth";

export default function LoginPage() {
  const router = useRouter();
  
  const { mutate: login, isPending: isSubmitting } = useLogin();
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Basic validation
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    
    // Call the login API
    login(
      { email, password },
      {
        onSuccess: (user: any) => {
          if (user) {
            // Store JWT token and user data in both localStorage and cookie
            if (user.token) {
              setAuthToken(user.token, user);
            }
            
            // Redirect to the original page or home page
            const searchParams = new URLSearchParams(window.location.search);
            const from = searchParams.get('from');
            router.push(from || "/");
            
            // Force a page reload to trigger UserProvider refetch
            window.location.reload();
          } else {
            setError("Login failed. Please try again.");
          }
        },
        onError: (error: any) => {
          console.error("Login error:", error);
          setError(
            error?.error?.message || 
            error?.message || 
            "Login failed. Please check your credentials and try again."
          );
        }
      }
    );
  };

  return (
    <Box bg="bg.primary" minH="100vh" py="8">
      <Container maxW="md">
        <VStack gap={8} align="stretch">
          {/* Logo */}
          <Flex justify="center" mb={6}>
            <VStack gap={4} align="center">
              <Flex
                h="12"
                w="12"
                alignItems="center"
                justifyContent="center"
                borderRadius="full"
                bg="primary.500/20"
                color="primary.500"
              >
                <Box
                  as="span"
                  fontSize="3xl"
                  className="material-symbols-outlined"
                  style={{
                    fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"
                  }}
                >
                  data_usage
                </Box>
              </Flex>
              <VStack gap={2} align="center">
                <Heading as="h1" size="xl" color="text.primary" textAlign="center">
                  Sign in to your CRM
                </Heading>
                <Text color="text.secondary" textAlign="center">
                  Welcome back! Please enter your details.
                </Text>
              </VStack>
            </VStack>
          </Flex>

          {/* Form Container */}
          <Card.Root bg="surface.container" border="1px" borderColor="border.subtle" p={8} borderRadius="xl" shadow="lg">
            <Card.Body>
              <VStack gap={8} align="stretch">
                {/* Error message */}
                {error && (
                  <Box 
                    bg="red.50" 
                    border="1px" 
                    borderColor="red.200" 
                    color="red.700" 
                    p={3} 
                    borderRadius="md"
                    fontSize="sm"
                  >
                    {error}
                  </Box>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                  <VStack gap={6}>
                    {/* Email Field */}
                    <Box width="full">
                      <Text as="label" display="block" color="text.primary" fontSize="sm" fontWeight="medium" mb={2}>
                        Email
                      </Text>
                      <Flex width="full" position="relative">
                        <Box
                          position="absolute"
                          left="3"
                          top="50%"
                          transform="translateY(-50%)"
                          color="text.secondary"
                          zIndex="1"
                        >
                          <EmailIcon boxSize={5} />
                        </Box>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          bg="bg.subtle"
                          borderColor="border.medium"
                          pl="10"
                          _focus={{
                            borderColor: "primary.500",
                            boxShadow: "0 0 0 2px var(--chakra-colors-primary-100)",
                          }}
                          height="12"
                          fontSize="md"
                          width="full"
                        />
                      </Flex>
                    </Box>

                    {/* Password Field */}
                    <Box width="full">
                      <Text as="label" display="block" color="text.primary" fontSize="sm" fontWeight="medium" mb={2}>
                        Password
                      </Text>
                      <Flex width="full" position="relative">
                        <Box
                          position="absolute"
                          left="3"
                          top="50%"
                          transform="translateY(-50%)"
                          color="text.secondary"
                          zIndex="1"
                        >
                          <LockIcon boxSize={5} />
                        </Box>
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          bg="bg.subtle"
                          borderColor="border.medium"
                          pl="10"
                          pr="10"
                          _focus={{
                            borderColor: "primary.500",
                            boxShadow: "0 0 0 2px var(--chakra-colors-primary-100)",
                          }}
                          borderRightRadius="md"
                          height="12"
                          fontSize="md"
                          flex="1"
                        />
                        <Button
                          onClick={() => setShowPassword(!showPassword)}
                          bg="bg.subtle"
                          borderColor="border.medium"
                          borderLeft="none"
                          borderLeftRadius="0"
                          borderRightRadius="md"
                          _hover={{ bg: "bg.subtle" }}
                          height="12"
                          px={4}
                          position="absolute"
                          right="0"
                          top="0"
                        >
                          {showPassword ? <ViewOffIcon color="white" /> : <ViewIcon color="white"/>}
                        </Button>
                      </Flex>
                    </Box>

                    {/* Remember Me & Forgot Password */}
                    <Flex width="full" justify="space-between" align="center">
                      <HStack align="center" gap={2}>
                        <Checkbox.Root
                          checked={rememberMe}
                          onCheckedChange={(details) => {
                            if (typeof details.checked === 'boolean') {
                              setRememberMe(details.checked);
                            }
                          }}
                          colorPalette="primary"
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                        </Checkbox.Root>
                        <Text as="label" color="text.primary" fontSize="sm" fontWeight="medium" cursor="pointer">
                          Remember Me
                        </Text>
                      </HStack>
                      <ChakraLink
                        as={Link}
                        href="#"
                        color="primary.500"
                        fontSize="sm"
                        fontWeight="medium"
                        _hover={{ textDecoration: "underline" }}
                      >
                        Forgot Password?
                      </ChakraLink>
                    </Flex>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      width="full"
                      colorPalette="primary"
                      size="lg"
                      fontSize="md"
                      fontWeight="semibold"
                      loading={isSubmitting}
                    >
                      Sign In
                    </Button>
                  </VStack>
                </form>

                {/* Signup Link */}
                <Box textAlign="center" mt={4}>
                  <Text color="text.secondary" fontSize="sm">
                    Don't have an account?{" "}
                    <ChakraLink as={Link} href="/signup" color="primary.500" fontWeight="medium" _hover={{ textDecoration: "underline" }}>
                      Sign up
                    </ChakraLink>
                  </Text>
                </Box>
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Footer */}
          <Box textAlign="center">
            <Text color="text.secondary" fontSize="sm">
              © 2024 Your Company. All rights reserved.
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
