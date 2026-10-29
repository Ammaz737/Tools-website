import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  FileImage,
  FileText,
  Image,
  Minimize2,
  MousePointer2,
  PenLine,
  ShieldCheck,
} from "lucide-react";

export function WorkspaceIllustration() {
  return (
    <div
      className="hero-art"
      aria-label="Convert, edit and download your files"
    >
      <div className="art-backdrop" />
      <div className="art-grid" aria-hidden="true" />
      <Link
        href="/tools/compress-pdf"
        className="floating-tool float-compress"
        aria-label="Compress PDF"
      >
        <Minimize2 size={25} />
      </Link>
      <Link
        href="/tools/edit-pdf"
        className="floating-tool float-edit"
        aria-label="Edit PDF"
      >
        <PenLine size={25} />
      </Link>
      <Link
        href="/tools/image-resizer"
        className="floating-tool float-image"
        aria-label="Resize an image"
      >
        <Image size={25} />
      </Link>
      <div className="document-window">
        <div className="document-toolbar">
          <span className="window-dots">
            <i />
            <i />
            <i />
          </span>
          <span>YOUR WORKSPACE</span>
          <span className="document-saved">
            <Check size={12} /> Ready
          </span>
        </div>
        <div className="document-sheet">
          <div className="document-topline">
            <span className="document-file">
              <FileText size={22} />
            </span>
            <span className="document-label">A little less busywork.</span>
          </div>
          <div className="document-title">
            A little more
            <br />
            possibility.
          </div>
          <div className="document-lines" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="document-graphic" aria-hidden="true">
            <div />
            <span />
            <i />
          </div>
          <div className="document-bottom">
            <span>Made for your everyday.</span>
            <Check size={15} />
          </div>
        </div>
        <div className="document-status">
          <ShieldCheck size={14} /> Simple tools. Beautiful results.
        </div>
      </div>
      <Link
        href="/tools/pdf-to-jpg"
        className="conversion-card"
        aria-label="Convert PDF to JPG"
      >
        <span className="conversion-type pdf-type">
          <FileText size={20} />
          PDF
        </span>
        <ArrowRight size={19} />
        <span className="conversion-type jpg-type">
          <FileImage size={20} />
          JPG
        </span>
        <span className="conversion-download">
          <ArrowDownToLine size={19} />
        </span>
      </Link>
      <MousePointer2
        className="art-cursor"
        size={37}
        fill="currentColor"
        aria-hidden="true"
      />
      <span className="art-spark spark-one" aria-hidden="true">
        +
      </span>
      <span className="art-spark spark-two" aria-hidden="true">
        +
      </span>
      <span className="art-ring" aria-hidden="true" />
    </div>
  );
}
