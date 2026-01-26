import './mock-setup';
import { render } from 'solid-js/web';
import App from '@/entrypoints/popup/App';

render(() => <App />, document.getElementById('root')!);
