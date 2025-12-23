"use client";

import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Textarea,
  Button,
  Card,
  Spinner,
} from "@chakra-ui/react";
import { LockIcon } from "@chakra-ui/icons";
import { useAdminCommentsQuery, useCreateComment } from "@/api";
import { Comment as ApiComment } from "@/api/models";
import { useCallback, useState } from "react";

interface CommentsProps {
  entityId?: string;
  commentClass?: string;
  title?: string;
  placeholder?: string;
}

// Map API comment to UI comment with color scheme
const mapApiCommentToUiComment = (comment: ApiComment, index: number) => {
  const colorSchemes = ["orange", "blue", "green", "purple", "gray"] as const;
  const colorScheme = colorSchemes[index % colorSchemes.length];
  
  // Extract initials from owner ID or use first two characters of text
  const initials = comment.owner?.id 
    ? comment.owner.id.slice(0, 2).toUpperCase()
    : "AD";
  
  // Format timestamp
  const timestamp = new Date(comment.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return {
    id: comment.id,
    author: comment.owner?.id ? `User ${comment.owner.id}` : "Admin",
    initials,
    timestamp,
    message: comment.text,
    colorScheme,
  };
};

const colorSchemes = {
  orange: {
    light: "orange.100",
    dark: "orange.900/30",
    textLight: "orange.600",
    textDark: "orange.400",
  },
  blue: {
    light: "blue.100",
    dark: "blue.900/30",
    textLight: "blue.600",
    textDark: "blue.400",
  },
  green: {
    light: "green.100",
    dark: "green.900/30",
    textLight: "green.600",
    textDark: "green.400",
  },
  purple: {
    light: "purple.100",
    dark: "purple.900/30",
    textLight: "purple.600",
    textDark: "purple.400",
  },
  gray: {
    light: "gray.100",
    dark: "gray.900/30",
    textLight: "gray.600",
    textDark: "gray.400",
  },
};

export default function Comments({
  entityId,
  commentClass = "NOTE",
  title = "Order Comments",
  placeholder = "Add internal note...",
}: CommentsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: comments = [], isLoading, refetch } = useAdminCommentsQuery(entityId, commentClass);
  const { mutate: createComment } = useCreateComment();

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const text = formData.get("note") as string;
    
    if (!text.trim() || !entityId) {
      return;
    }

    setIsSubmitting(true);
    createComment({
      text,
      entity_id: entityId,
      class: commentClass,
    }, {
      onSuccess: () => {
        e.currentTarget.reset();
        refetch();
      },
      onSettled: () => {
        setIsSubmitting(false);
      }
    });
  }, [entityId, commentClass, createComment, refetch]);

  const uiComments = comments.map(mapApiCommentToUiComment);

  return (
    <Card.Root
      bg="surface.container"
      border="1px"
      borderColor="border.subtle"
      borderRadius="xl"
      boxShadow="sm"
    >
      <Card.Body p="5">
        <Flex justify="space-between" align="center" mb="4">
          <Text fontSize="lg" fontWeight="semibold" color="text.primary">
            {title}
          </Text>
          <Flex
            align="center"
            justify="center"
            w="8"
            h="8"
            borderRadius="full"
            bg="bg.subtle"
            color="text.tertiary"
          >
            <LockIcon fontSize="sm" />
          </Flex>
        </Flex>

        <VStack gap="5" align="stretch">
          {isLoading ? (
            <Flex justify="center" py="4">
              <Spinner size="sm" />
            </Flex>
          ) : uiComments.length === 0 ? (
            <Text fontSize="sm" color="text.secondary" textAlign="center" py="4">
              No comments yet
            </Text>
          ) : (
            uiComments.map((comment) => {
              const colors = colorSchemes[comment.colorScheme];
              return (
                <Flex key={comment.id} gap="3">
                  <Flex
                    align="center"
                    justify="center"
                    shrink={0}
                    w="8"
                    h="8"
                    borderRadius="full"
                    bg={colors.light}
                    color={colors.textLight}
                    _dark={{ bg: colors.dark, color: colors.textDark }}
                    fontWeight="bold"
                    fontSize="xs"
                    textTransform="uppercase"
                  >
                    {comment.initials}
                  </Flex>
                  <Box flex="1">
                    <HStack gap="2" mb="1.5">
                      <Text fontSize="sm" fontWeight="semibold" color="text.primary">
                        {comment.author}
                      </Text>
                      <Text fontSize="xs" color="text.secondary">
                        {comment.timestamp}
                      </Text>
                    </HStack>
                    <Text fontSize="sm" color="text.secondary" lineHeight="relaxed">
                      {comment.message}
                    </Text>
                  </Box>
                </Flex>
              );
            })
          )}

          {entityId && (
            <Box mt="1">
              <form onSubmit={handleSubmit}>
                <Box position="relative">
                  <Textarea
                    name="note"
                    placeholder={placeholder}
                    rows={3}
                    resize="none"
                    fontSize="sm"
                    color="text.primary"
                    bg="bg.subtle"
                    borderColor="border.medium"
                    _placeholder={{ color: "text.tertiary" }}
                    _focus={{
                      borderColor: "primary.500",
                      boxShadow: "0 0 0 2px var(--chakra-colors-primary-500)",
                    }}
                    _dark={{
                      bg: "background.dark",
                      borderColor: "border.dark",
                      color: "white",
                      _placeholder: { color: "gray.400" },
                      _focus: {
                        borderColor: "primary.500",
                        boxShadow: "0 0 0 2px var(--chakra-colors-primary-500)",
                      },
                    }}
                    disabled={isSubmitting}
                  />
                  <Box position="absolute" bottom="2" right="2">
                    <Button
                      type="submit"
                      size="xs"
                      px="3"
                      py="1.5"
                      fontSize="xs"
                      fontWeight="medium"
                      bg="primary.500"
                      color="white"
                      _hover={{ bg: "primary.600" }}
                      _dark={{
                        bg: "primary.600",
                        _hover: { bg: "primary.700" },
                      }}
                      loading={isSubmitting}
                      disabled={isSubmitting}
                    >
                      Add Note
                    </Button>
                  </Box>
                </Box>
              </form>
            </Box>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
