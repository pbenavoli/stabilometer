import MarkdownIt from 'markdown-it';
import RenderHTML from '@native-html/render';
import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

const parser = new MarkdownIt();

function markdownToHtml(markdown: string): string {
  return parser.render(markdown);
}

export default function MarkdownDocument({ markdown }: { markdown: string }) {
  const { width } = useWindowDimensions();
  const html = useMemo(() => markdownToHtml(markdown), [markdown]);

  return (
    <View style={styles.document}>
      <RenderHTML
        contentWidth={Math.max(width - 48, 1)}
        source={{ html }}
        tagsStyles={tagsStyles}
      />
    </View>
  );
}

const tagsStyles = {
  body: {
    color: '#202733',
    fontSize: 16,
    lineHeight: 24,
  },
  h1: {
    color: '#202733',
    fontSize: 28,
    fontWeight: '700' as const,
  },
  h2: {
    color: '#202733',
    fontSize: 24,
    fontWeight: '700' as const,
  },
  h3: {
    color: '#202733',
    fontSize: 20,
    fontWeight: '700' as const,
  },
};

const styles = StyleSheet.create({
  document: {
    width: '100%',
  },
});
