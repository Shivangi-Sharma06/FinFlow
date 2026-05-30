import { createTheme, rem } from '@mantine/core';

export const theme = createTheme({
  fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  fontFamilyMonospace: 'DM Mono, ui-monospace, SFMono-Regular, Menlo, monospace',
  defaultRadius: 'sm',
  primaryColor: 'warm',
  colors: {
    warm: [
      '#f7f5f0',
      '#ebe4d8',
      '#dad2c1',
      '#c9c0ad',
      '#aea69c',
      '#756d65',
      '#514a44',
      '#3f3a36',
      '#383330',
      '#2b2622'
    ]
  },
  radius: {
    xs: rem(2),
    sm: rem(3),
    md: rem(4),
    lg: rem(6)
  },
  headings: {
    fontFamily: 'Inter, system-ui, sans-serif',
    sizes: {
      h1: { fontSize: rem(32), lineHeight: '1.2', fontWeight: '500' },
      h2: { fontSize: rem(24), lineHeight: '1.25', fontWeight: '500' },
      h3: { fontSize: rem(18), lineHeight: '1.35', fontWeight: '500' }
    }
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'sm',
        color: 'white'
      }
    },
    Paper: {
      defaultProps: {
        radius: 'md',
        withBorder: true
      }
    },
    TextInput: {
      defaultProps: {
        radius: 'sm'
      }
    },
    Select: {
      defaultProps: {
        radius: 'sm'
      }
    }
  }
});
