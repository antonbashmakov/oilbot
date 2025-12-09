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
import { useTranslations } from 'next-intl';

export default function SignupPage() {
  const router = useRouter();
  const { setUser } = useUser();
  const { mutate: signup, isPending: isSubmitting } = useSignup();
  const t = useTranslations('signup');
  
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
      setError(t('errors.fillAllFields'));
      return;
    }
    
    if (password !== confirmPassword) {
      setError(t('errors.passwordsDontMatch'));
      return;
    }
    
    if (!agreeToTerms) {
      setError(t('errors.agreeToTerms'));
      return;
    }
    
    if (password.length < 6) {
      setError(t('errors.passwordTooShort'));
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
            setError(t('errors.signupFailed'));
          }
        },
        onError: (error: any) => {
          console.error("Signup error:", error);
          setError(
            error?.error?.message || 
            error?.message || 
            t('errors.signupFailed')
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
                    {t('title')}
                  </Heading>
                  <Text color="text.secondary">
                    {t('subtitle')}
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
                        {t('email')}
                      </Text>
                      <Input
                        id="email"
                        type="email"
                        placeholder={t('emailPlaceholder')}
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
                        {t('password')}
                      </Text>
                      <Flex width="full">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder={t('passwordPlaceholder')}
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
                        {t('confirmPassword')}
                      </Text>
                      <Flex width="full">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder={t('confirmPasswordPlaceholder')}
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
                            {t('termsLink')}
                          </ChakraLink>{" "}
                          and{" "}
                          <ChakraLink as={Link} href="#" color="primary.500" _hover={{ textDecoration: "underline" }}>
                            {t('privacyLink')}
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
                      {t('createAccount')}
                    </Button>
                  </VStack>
                </form>

                {/* Login Link */}
                <Box textAlign="center" mt={4}>
                  <Text color="text.secondary" fontSize="sm">
                    {t('alreadyHaveAccount')}{" "}
                    <ChakraLink as={Link} href="/login" color="primary.500" fontWeight="medium" _hover={{ textDecoration: "underline" }}>
                      {t('login')}
                    </ChakraLink>
                  </Text>
                </Box>
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Footer */}
          <Box textAlign="center">
            <Text color="text.secondary" fontSize="sm">
              {t('needHelp')}{" "}
              <ChakraLink as={Link} href="#" color="primary.500" fontWeight="medium" _hover={{ textDecoration: "underline" }}>
                {t('contactUs')}
              </ChakraLink>
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
