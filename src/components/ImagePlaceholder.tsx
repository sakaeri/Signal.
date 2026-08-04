import './ImagePlaceholder.css';

export default function ImagePlaceholder({ caption, className }: { caption: string; className?: string }) {
  return (
    <div className={`img-placeholder${className ? ` ${className}` : ''}`}>
      <div className="img-placeholder-inner">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="10.5" r="1.6" />
          <path d="M21 16l-5.5-5.5L9 17" />
        </svg>
        <span className="img-placeholder-caption">{caption}</span>
      </div>
    </div>
  );
}
