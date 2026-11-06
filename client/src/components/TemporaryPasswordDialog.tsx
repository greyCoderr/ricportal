import { useState } from "react";
import { Banner, Button, Modal } from "./ui";

type Props = {
  open: boolean;
  personName: string;
  password: string;
  onClose: () => void;
};

// BR-05: a temporary password is shown once and never stored in plain text.
export function TemporaryPasswordDialog({
  open,
  personName,
  password,
  onClose,
}: Props) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(password).then(
      () => {
        setCopied(true);
      },
      () => {
        setCopied(false);
      },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Temporary password"
      footer={<Button onClick={onClose}>Done</Button>}
    >
      <div className="flex flex-col gap-3">
        <Banner tone="warning">
          This is shown only once. Give it to {personName} now. They must change
          it at their next login.
        </Banner>
        <p
          data-temporary-password
          className="rounded-control border border-border-subtle p-3 text-center text-20 font-semibold tracking-label"
        >
          {password}
        </p>
        <div>
          <Button variant="secondary" size="sm" onClick={copy}>
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
