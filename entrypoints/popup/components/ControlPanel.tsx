import { Component, createSignal } from 'solid-js';
import { TabType } from '@/utils/constants';

interface ControlPanelProps {
  onAdd: (value: string) => void;
  currentTab: TabType;
}

export const ControlPanel: Component<ControlPanelProps> = (props) => {
  const [inputValue, setInputValue] = createSignal('');

  const handleAdd = () => {
    if (inputValue().trim()) {
      props.onAdd(inputValue().trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <div class="input-group" id="input-area">
      <input 
        type="text" 
        id="input" 
        placeholder={`Add to ${props.currentTab}...`}
        value={inputValue()}
        onInput={(e) => setInputValue(e.currentTarget.value)}
        onKeyPress={handleKeyPress}
      />
      <button id="add" onClick={handleAdd}>ADD</button>
    </div>
  );
};
