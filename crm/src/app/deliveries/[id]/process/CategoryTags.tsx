"use client";

import { Box, Flex, Icon } from "@chakra-ui/react";
import { useTranslations } from 'next-intl';
import { Category, getChakraIconByCategory } from "@/utils/categoryMap";

interface CategoryTagsProps {
  categories: Category[];
}

export default function CategoryTags({ categories }: CategoryTagsProps) {
  const t = useTranslations('deliveryProcess');

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <Flex wrap="wrap" gap={2} mb={4}>
      {categories.map((category) => {
        // Determine colors based on category
        let bgColor, textColor, borderColor;
        switch (category) {
          case 'STEAKS':
            bgColor = "primary.blue/20";
            textColor = "primary.blueDark";
            borderColor = "primary.blue/40";
            break;
          case 'FISH':
            bgColor = "rgba(239, 68, 68, 0.2)";
            textColor = "#EF4444";
            borderColor = "rgba(239, 68, 68, 0.4)";
            break;
          case 'OTHER':
          default:
            bgColor = "status.warning/20";
            textColor = "status.warningDark";
            borderColor = "status.warning/40";
            break;
        }
        
        return (
          <Box
            key={category}
            px={4}
            py={2}
            borderRadius="lg"
            bg={bgColor}
            color={textColor}
            fontWeight="black"
            fontSize="lg"
            borderWidth="2px"
            borderColor={borderColor}
            display="flex"
            alignItems="center"
            gap={2}
          >
            <Icon as={getChakraIconByCategory(category)} boxSize={6} />
            {t(`categories.${category}`)}
          </Box>
        );
      })}
    </Flex>
  );
}