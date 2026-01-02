/**
 * SilkCircuit theme for Shiki syntax highlighting.
 *
 * Matches the design system colors used throughout the app.
 * Used by both markdown rendering and tool output display.
 */
export const silkCircuitTheme = {
  name: 'silk-circuit',
  type: 'dark' as const,
  colors: {
    'editor.background': '#12101a',
    'editor.foreground': '#f8f8f2',
  },
  tokenColors: [
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#5a5470', fontStyle: 'italic' },
    },
    { scope: ['string', 'string.quoted'], settings: { foreground: '#50fa7b' } },
    { scope: ['constant.numeric', 'constant.language'], settings: { foreground: '#ff6ac1' } },
    { scope: ['keyword', 'storage.type', 'storage.modifier'], settings: { foreground: '#e135ff' } },
    { scope: ['entity.name.function', 'support.function'], settings: { foreground: '#80ffea' } },
    {
      scope: ['entity.name.class', 'entity.name.type', 'support.class'],
      settings: { foreground: '#f1fa8c' },
    },
    { scope: ['variable', 'variable.other'], settings: { foreground: '#f8f8f2' } },
    { scope: ['variable.parameter'], settings: { foreground: '#ffb86c' } },
    { scope: ['constant.other', 'entity.name.tag'], settings: { foreground: '#ff6ac1' } },
    { scope: ['entity.other.attribute-name'], settings: { foreground: '#50fa7b' } },
    { scope: ['punctuation', 'meta.brace'], settings: { foreground: '#8b85a0' } },
    { scope: ['keyword.operator'], settings: { foreground: '#ff6ac1' } },
    { scope: ['support.type.property-name'], settings: { foreground: '#80ffea' } },
    { scope: ['meta.object-literal.key'], settings: { foreground: '#80ffea' } },
  ],
};
