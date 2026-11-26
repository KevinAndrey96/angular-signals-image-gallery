// Mirror the preconnect hint from index.html that NgOptimizedImage checks for priority images.
const preconnect = document.createElement('link');
preconnect.rel = 'preconnect';
preconnect.href = 'https://picsum.photos';
document.head.append(preconnect);

// jsdom does not implement modal dialogs yet; emulate the parts the lightbox relies on.
if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement): void {
    this.setAttribute('open', '');
    this.querySelector<HTMLElement>('[autofocus]')?.focus();
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement): void {
    this.removeAttribute('open');
  };
}
