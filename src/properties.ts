export type RichTextItem = {
  type: string;
  plain_text: string;
  href: string | null;
};

export type PropertyValue =
  | { type: 'rich_text'; rich_text: RichTextItem[] }
  | { type: 'title'; title: RichTextItem[] }
  | { type: 'checkbox'; checkbox: boolean };

export type PropertyType = PropertyValue['type'];

export function getProp<T extends PropertyType>(
  props: Record<string, unknown>,
  name: string,
  type: T
): Extract<PropertyValue, { type: T }> | null {
  const p = props[name] as PropertyValue | undefined;
  return p?.type === type ? (p as Extract<PropertyValue, { type: T }>) : null;
}

export function getPlainText(items: RichTextItem[]): string {
  return items.map((r) => r.plain_text).join('');
}
