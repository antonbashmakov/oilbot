import type { Meta, StoryObj } from '@storybook/nextjs';

import { KPICard } from '../components/ui/KPICard';

const meta = {
  title: 'UI/KPICard',
  component: KPICard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof KPICard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: 'Total Revenue',
    value: '$45,231.89',
    description: '+20.1% from last month',
  },
};
