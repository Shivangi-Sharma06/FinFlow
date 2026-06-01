import { createTheme, rem } from '@mantine/core';

export const theme = createTheme({
  fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  fontFamilyMonospace: 'DM Mono, ui-monospace, SFMono-Regular, Menlo, monospace',
  defaultRadius: 'sm',
  autoContrast: true,
  primaryColor: 'warm',
  primaryShade: 3,
  colors: {
    warm: [
      '#fff8fb',
      '#ffeef5',
      '#ffe2ec',
      '#f9d2e0',
      '#efbfd0',
      '#d6a4b8',
      '#b78499',
      '#916574',
      '#6c4955',
      '#4a313b'
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
        color: 'warm'
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
