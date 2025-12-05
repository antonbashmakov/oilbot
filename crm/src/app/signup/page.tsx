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
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import Link from "next/link";
import { useSignup } from "@/api";
import { useUser } from "@/api/user/provider";
import { setAuthToken } from "@/utils/auth";

export default function SignupPage() {
  const router = useRouter();
  const { setUser } = useUser();
  const { mutate: signup, isLoading: isSubmitting } = useSignup();
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Basic validation
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (!agreeToTerms) {
      setError("You must agree to the terms and conditions");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    
    // Call the signup API
    signup(
      { email, password },
      {
        onSuccess: (user: any) => {
          if (user) {
            // Store user in context (includes JWT token)
            setUser(user);
            
            // Store JWT token and user data in both localStorage and cookie
            if (user.token) {
              setAuthToken(user.token, user);
            }
            
            // Redirect to the original page or home page
            const searchParams = new URLSearchParams(window.location.search);
            const from = searchParams.get('from');
            router.push(from || "/");
          } else {
            setError("Signup failed. Please try again.");
          }
        },
        onError: (error: any) => {
          console.error("Signup error:", error);
          setError(
            error?.error?.message || 
            error?.message || 
            "Signup failed. Please try again."
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
              <HStack gap={2}>
                <Box
                  as="span"
                  color="primary.500"
                  fontSize="4xl"
                  className="material-symbols-outlined"
                  style={{
                    fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"
                  }}
                >
                  insights
                </Box>
                <Heading as="h1" size="xl" color="text.primary">
                  CRMify
                </Heading>
              </HStack>
          </Flex>

          {/* Form Container */}
          <Card.Root bg="surface.container" border="1px" borderColor="border.subtle" p={8} borderRadius="xl" shadow="lg">
            <Card.Body>
              <VStack gap={8} align="stretch">
                {/* Header */}
                <Box textAlign="center" mb={2}>
                  <Heading as="h2" size="lg" color="text.primary" mb={2}>
                    Create Your Account
                  </Heading>
                  <Text color="text.secondary">
                    Join our platform to manage your customer relationships effectively.
                  </Text>
                </Box>

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
                      <Text as="label" display="block" color="text.primary" fontSize="md" fontWeight="medium" mb={2}>
                        Email
                      </Text>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        bg="bg.subtle"
                        borderColor="border.medium"
                        _focus={{
                          borderColor: "primary.500",
                          boxShadow: "0 0 0 2px var(--chakra-colors-primary-100)",
                        }}
                        height="12"
                        fontSize="md"
                        width="full"
                      />
                    </Box>

                    {/* Password Field */}
                    <Box width="full">
                      <Text as="label" display="block" color="text.primary" fontSize="md" fontWeight="medium" mb={2}>
                        Password
                      </Text>
                      <Flex width="full">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          bg="bg.subtle"
                          borderColor="border.medium"
                          borderRightRadius="0"
                          _focus={{
                            borderColor: "primary.500",
                            boxShadow: "0 0 0 2px var(--chakra-colors-primary-100)",
                          }}
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
                        >
                          {showPassword ? <ViewOffIcon color="white" /> : <ViewIcon color="white"/>}
                        </Button>
                      </Flex>
                    </Box>

                    {/* Confirm Password Field */}
                    <Box width="full">
                      <Text as="label" display="block" color="text.primary" fontSize="md" fontWeight="medium" mb={2}>
                        Confirm Password
                      </Text>
                      <Flex width="full">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Re-enter your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          bg="bg.subtle"
                          borderColor="border.medium"
                          borderRightRadius="0"
                          _focus={{
                            borderColor: "primary.500",
                            boxShadow: "0 0 0 2px var(--chakra-colors-primary-100)",
                          }}
                          height="12"
                          fontSize="md"
                          flex="1"
                        />
                        <Button
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          bg="bg.subtle"
                          borderColor="border.medium"
                          borderLeft="none"
                          borderLeftRadius="0"
                          borderRightRadius="md"
                          _hover={{ bg: "bg.subtle" }}
                          height="12"
                          px={4}
                        >
                          {showConfirmPassword ? <ViewOffIcon color="white"/> : <ViewIcon color="white"/>}
                        </Button>
                      </Flex>
                    </Box>

                    {/* Terms Checkbox */}
                    <Box width="full">
                      <HStack align="start" gap={3}>
                        <Checkbox.Root
                          checked={agreeToTerms}
                          onCheckedChange={(details) => {
                            if (typeof details.checked === 'boolean') {
                              setAgreeToTerms(details.checked);
                            }
                          }}
                          colorPalette="primary"
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                        </Checkbox.Root>
                        <Text as="label" color="text.primary" fontSize="sm" fontWeight="medium" cursor="pointer">
                          I agree to the{" "}
                          <ChakraLink as={Link} href="#" color="primary.500" _hover={{ textDecoration: "underline" }}>
                            Terms of Service
                          </ChakraLink>{" "}
                          and{" "}
                          <ChakraLink as={Link} href="#" color="primary.500" _hover={{ textDecoration: "underline" }}>
                            Privacy Policy
                          </ChakraLink>.
                        </Text>
                      </HStack>
                    </Box>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      width="full"
                      colorPalette="primary"
                      size="lg"
                      fontSize="md"
                      fontWeight="medium"
                      loading={isSubmitting}
                      disabled={!agreeToTerms}
                    >
                      Create Account
                    </Button>
                  </VStack>
                </form>

                {/* Login Link */}
                <Box textAlign="center" mt={4}>
                  <Text color="text.secondary" fontSize="sm">
                    Already have an account?{" "}
                    <ChakraLink as={Link} href="/login" color="primary.500" fontWeight="medium" _hover={{ textDecoration: "underline" }}>
                      Log in
                    </ChakraLink>
                  </Text>
                </Box>
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Footer */}
          <Box textAlign="center">
            <Text color="text.secondary" fontSize="sm">
              Need help?{" "}
              <ChakraLink as={Link} href="#" color="primary.500" fontWeight="medium" _hover={{ textDecoration: "underline" }}>
                Contact Us
              </ChakraLink>
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
