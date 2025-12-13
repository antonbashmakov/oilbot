import React, { useState } from 'react';
import { Box, Flex, Text, Input, Button, Avatar } from "@chakra-ui/react";
import { ArrowForwardIcon, TimeIcon } from "@chakra-ui/icons";
import { ConversationMessage } from "@/api/models";
import { format } from "date-fns";
import { useTranslations } from 'next-intl';

export interface MessengerProps {
  messages: ConversationMessage[];
  onMessage?: (text: string) => void;
  className?: string;
}

export function Messenger({ messages, onMessage, className = '' }: MessengerProps) {
  const [inputText, setInputText] = useState('');
  const t = useTranslations('messenger');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && onMessage) {
      onMessage(inputText.trim());
      setInputText('');
    }
  };

  return (
    <Box
      className={className}
      _dark={{ bg: "surface.container" }}
      borderRadius="xl"
      boxShadow="sm"
      border="1px"
      borderColor="gray.200"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      height="420px"
    >
      {/* Header */}
      <Flex
        p={4}
        borderBottom="1px"
        borderColor="gray.200"
        _dark={{ borderColor: "border.subtle" }}
        justifyContent="space-between"
        alignItems="center"
      >
        <Text
          fontSize="sm"
          fontWeight="bold"
          color="gray.900"
          _dark={{ color: "text.primary" }}
          textTransform="uppercase"
          letterSpacing="wide"
        >
          {t('communication')}
        </Text>
        <Button
          variant="ghost"
          size="sm"
          color="gray.400"
          _hover={{ color: "primary.blue" }}
          transition="colors"
        >
          <TimeIcon boxSize={5} />
        </Button>
      </Flex>

      {/* Messages container */}
      <Box
        flex={1}
        p={4}
        overflowY="auto"
        display="flex"
        flexDirection="column"
        gap={4}
      >
        {messages.map((message, index) => (
          <Flex
            key={message.id || index}
            gap={3}
            flexDirection={message.role === "ADMIN" ? "row-reverse" : "row"}
          >
            <Avatar.Root
              size="sm"
              style={{
                backgroundImage: "",
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <Avatar.Fallback />
            </Avatar.Root>
            <Box
              display="flex"
              flexDirection="column"
              gap={1}
              alignItems={message.role === "ADMIN" ? "flex-end" : "flex-start"}
              maxWidth="85%"
            >
              <Box
                p={3}
                fontSize="sm"
                lineHeight="relaxed"
                bg={message.role === "ADMIN" ? "primary.blue" : "gray.100"}
                _dark={{
                  bg: message.role === "ADMIN" ? "primary.blueDark" : "gray.800"
                }}
                color={message.role === "ADMIN" ? "white" : "gray.800"}

                borderTopLeftRadius="2xl"
                borderTopRightRadius={message.role === "ADMIN" ? "0" : "2xl"}
                borderBottomRightRadius={message.role === "ADMIN" ? "2xl" : "0"}
                borderBottomLeftRadius={message.role === "ADMIN" ? "2xl" : "0"}
              >
                {message.text}
              </Box>
              <Text
                fontSize="xs"
                fontWeight="medium"
                color="gray.400"
                textTransform="uppercase"
                ml={message.role === "ADMIN" ? 0 : 1}
                mr={message.role === "ADMIN" ? 1 : 0}
              >
                {format(message.created_at, "dd-MM-yyyy HH:mm")}
              </Text>
            </Box>
          </Flex>
        ))}
      </Box>

      {/* Input area */}
      <Box
        p={3}
        bg="white"
        _dark={{ bg: "surface.container" }}
        borderTop="1px"
        borderColor="gray.200"
      >
        <form onSubmit={handleSubmit}>
          <Flex position="relative" alignItems="center">
            <Input
              width="full"
              bg="gray.50"
              _dark={{ bg: "bg.tertiary", borderColor: "gray.700", color: "text.primary" }}
              border="1px"
              borderColor="gray.200"
              color="gray.900"
              fontSize="sm"
              borderRadius="lg"
              placeholder={t('typeMessage')}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              pr={12}
              py={2.5}
              _focus={{
                borderColor: "primary.blue",
                boxShadow: "0 0 0 1px var(--chakra-colors-primary-blue)"
              }}
            />
            <Button
              type="submit"
              position="absolute"
              right={2}
              variant="ghost"
              size="sm"
              color="primary.blue"
              _hover={{ color: "primary.blueDark" }}
              p={1}
              borderRadius="md"
              transition="colors"
            >
              <ArrowForwardIcon boxSize={5} />
            </Button>
          </Flex>
        </form>
      </Box>
    </Box>
  );
}
