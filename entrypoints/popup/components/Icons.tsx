import { Component, JSX } from 'solid-js';

interface IconProps {
  children?: JSX.Element;
  noMargin?: boolean;
}

const IconWrapper: Component<IconProps> = (props) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    style={{ 'vertical-align': 'middle', 'margin-right': props.noMargin ? '0' : '4px' }}
  >
    {props.children}
  </svg>
);

export const ReloadIcon: Component = () => (
  <IconWrapper>
    <path d="M21.5 2v6h-6M2.5 22v-6h6" />
    <path d="M2.5 12a10 10 0 0 1 14.9-8.7L21.5 8M2.5 16l4.1 4.7A10 10 0 0 0 21.5 12" />
  </IconWrapper>
);

export const ExportIcon: Component = () => (
  <IconWrapper>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </IconWrapper>
);

export const ImportIcon: Component = () => (
  <IconWrapper>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </IconWrapper>
);

export const DeleteIcon: Component = () => (
  <IconWrapper noMargin>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </IconWrapper>
);

export const BanIcon: Component = () => (
  <IconWrapper>
    <circle cx="12" cy="12" r="10" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </IconWrapper>
);

export const ExternalIcon: Component = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    style={{ 'vertical-align': 'middle', 'margin-left': '4px' }}
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

export const ClearIcon: Component = () => (
  <IconWrapper>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </IconWrapper>
);
