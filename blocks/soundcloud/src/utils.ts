import { NotionParent } from '@notionhq/custom-blocks';

export function describeParent(parent: NotionParent): { type: string; id: string | null } {
  switch (parent.type) {
    case 'page_id':
      return { type: 'page', id: parent.page_id };
    case 'block_id':
      return { type: 'block', id: parent.block_id };
    case 'data_source_id':
      return { type: 'data source', id: parent.data_source_id };
    case 'agent_id':
      return { type: 'agent', id: parent.agent_id };
    case 'workspace':
      return { type: 'workspace', id: null };
    default: {
      const exhausted: never = parent;
      throw new Error(`Unknown parent type: ${JSON.stringify(exhausted)}`);
    }
  }
}
