import { ApiReference } from '@scalar/nextjs-api-reference'

const config = {
  url: "/openapi.json",
  theme: 'mars' as const,
  defaultOpenAllTags: true,
  hideModels: true,
  hideDarkModeToggle: true,
  darkMode: false,
  expandAllModelSections: true,
  expandAllResponses: true,
  persistAuth: false,
  pathRouting: {
    basePath: "/docs",
  },
} as const

export const GET = ApiReference(config)
