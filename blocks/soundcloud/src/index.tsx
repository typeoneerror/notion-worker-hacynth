import '@notionhq/custom-blocks/nds.css';
import { NotionCustomBlock, NotionTokenScope } from '@notionhq/custom-blocks/react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

ReactDOM.createRoot(root).render(
  <NotionCustomBlock autoResize>
    <NotionTokenScope>
      <App />
    </NotionTokenScope>
  </NotionCustomBlock>
);
