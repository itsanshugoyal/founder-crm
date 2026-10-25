import { Component, type ReactNode } from "react";
import { Button, Modal } from "./ui";

/** A failed view chunk must not remove navigation or the recovery path. */
export class ViewBoundary extends Component<
  { children: ReactNode; onClose?: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const recovery = (
      <section className="empty-state" role="alert">
        <h2>This view could not open</h2>
        <p>
          Check your connection, then reload the app. A recent update may have
          replaced the page files. Reloading will discard unsaved form changes.
        </p>
        <Button tone="primary" onClick={() => location.reload()}>
          Reload App
        </Button>
        {this.props.onClose && (
          <Button onClick={this.props.onClose}>Close Record</Button>
        )}
      </section>
    );
    return this.props.onClose ? (
      <Modal
        open
        onClose={this.props.onClose}
        title="Record could not open"
        description="Your workspace is still available. Close this record or reload the app to recover."
      >
        {recovery}
      </Modal>
    ) : (
      recovery
    );
  }
}
