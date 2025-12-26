import {
  Card,
  Heading,
  Box,
  Text,
  Input,
  Button,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import { useState } from "react";
import { useTranslations } from 'next-intl';

interface OrderDeliveryCardProps {
  /** Callback when the form is submitted with address data */
  onSubmit?: (address: AddressData) => void;
  /** Whether the form is in a loading state */
  isLoading?: boolean;
  /** Initial values for the form fields */
  initialValues?: Partial<AddressData>;
}

export interface AddressData {
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
}

export function OrderDeliveryCard({
  onSubmit,
  isLoading = false,
  initialValues = {},
}: OrderDeliveryCardProps) {
  const [streetAddress, setStreetAddress] = useState(initialValues.streetAddress || "");
  const [city, setCity] = useState(initialValues.city || "");
  const [state, setState] = useState(initialValues.state || "");
  const [zipCode, setZipCode] = useState(initialValues.zipCode || "");
  const t = useTranslations('orderDeliveryCard');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({ streetAddress, city, state, zipCode });
    }
  };

  return (
    <Card.Root bg="surface.container" borderWidth="1px" borderColor="border.subtle" borderRadius="xl">
      <Card.Body p={5}>
        <Heading size="md" color="text.primary" mb={4}>
          {t('addDeliveryAddress')}
        </Heading>
        <form onSubmit={handleSubmit}>
          {/* Street Address */}
          <Box mb={4}>
            <Text as="label" display="block" fontSize="sm" fontWeight="medium" color="text.secondary" mb={1.5}>
              {t('streetAddress')}
            </Text>
            <Input
              id="street-address"
              placeholder={t('streetAddressPlaceholder')}
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              bg="surface.elevated"
              borderColor="border.medium"
              color="text.primary"
              _placeholder={{ color: "text.hint" }}
              _focus={{ borderColor: "primary.blue", ring: "primary.blue" }}
            />
          </Box>

          {/* City and State */}
          <Grid templateColumns="repeat(2, 1fr)" gap={4} mb={4}>
            <GridItem>
              <Box>
                <Text as="label" display="block" fontSize="sm" fontWeight="medium" color="text.secondary" mb={1.5}>
                  {t('city')}
                </Text>
                <Input
                  id="city-name"
                  placeholder={t('cityPlaceholder')}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  bg="surface.elevated"
                  borderColor="border.medium"
                  color="text.primary"
                  _placeholder={{ color: "text.hint" }}
                  _focus={{ borderColor: "primary.blue", ring: "primary.blue" }}
                />
              </Box>
            </GridItem>
            <GridItem>
              <Box>
                <Text as="label" display="block" fontSize="sm" fontWeight="medium" color="text.secondary" mb={1.5}>
                  {t('state')}
                </Text>
                <Input
                  id="state-name"
                  placeholder={t('statePlaceholder')}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  bg="surface.elevated"
                  borderColor="border.medium"
                  color="text.primary"
                  _placeholder={{ color: "text.hint" }}
                  _focus={{ borderColor: "primary.blue", ring: "primary.blue" }}
                />
              </Box>
            </GridItem>
          </Grid>

          {/* Zip Code */}
          <Box mb={6}>
            <Text as="label" display="block" fontSize="sm" fontWeight="medium" color="text.secondary" mb={1.5}>
              {t('zipCode')}
            </Text>
            <Input
              id="zip-code"
              placeholder={t('zipCodePlaceholder')}
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              bg="surface.elevated"
              borderColor="border.medium"
              color="text.primary"
              _placeholder={{ color: "text.hint" }}
              _focus={{ borderColor: "primary.blue", ring: "primary.blue" }}
            />
          </Box>

          {/* Submit Button */}
          <Button
            type="submit"
            w="full"
            h={10}
            bg="primary.blue"
            color="white"
            fontWeight="medium"
            fontSize="sm"
            _hover={{ bg: "primary.blueDark" }}
            loading={isLoading}
          >
            {t('saveAddress')}
          </Button>
        </form>
      </Card.Body>
    </Card.Root>
  );
}
