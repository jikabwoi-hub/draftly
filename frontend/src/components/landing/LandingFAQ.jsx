import { useState } from "react";
import { Plus } from "lucide-react";
import { Reveal } from "./Reveal";

const FAQS = [
  {
    q: "What exactly does Draftly do?",
    a: "Draftly is an AI proposal workspace. You describe the opportunity (or upload the RFP), and it drafts a complete, structured business proposal grounded in your own company knowledge — then lets you edit, export and manage it.",
  },
  {
    q: "Does Draftly make things up?",
    a: "No. Draftly is built to stay grounded in the material you provide. It retrieves relevant passages from your knowledge library and is designed to avoid inventing facts, figures or credentials. You always review and edit the final draft.",
  },
  {
    q: "How does the company knowledge library work?",
    a: "Upload past proposals, case studies, bios and credentials. Draftly indexes them and pulls the most relevant content into each new draft, so proposals reflect your real experience and voice.",
  },
  {
    q: "Can I upload an RFP document?",
    a: "Yes. You can attach a PDF or DOCX RFP. Draftly reads the requirements and tailors the proposal structure and content to what the buyer actually asked for.",
  },
  {
    q: "What export formats are supported?",
    a: "You can export finished proposals as PDF, DOCX or plain text, ready to attach to a submission or send directly to a client.",
  },
  {
    q: "Is my data private and secure?",
    a: "Yes. Your workspace is isolated from other organisations, data is encrypted in transit, and AI processing happens securely on the server. We never expose your content or API keys in the browser.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. The Free plan lets you try Draftly end-to-end. You only upgrade when you need higher limits and team features.",
  },
];

function Item({ item, open, onToggle }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface-1/50 backdrop-blur">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-foreground sm:text-base">{item.q}</span>
        <Plus
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${
            open ? "rotate-45" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
        </div>
      </div>
    </div>
  );
}

export function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="relative scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4">
        <Reveal className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan">FAQ</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Frequently asked questions
          </h2>
        </Reveal>

        <div className="mt-12 flex flex-col gap-3">
          {FAQS.map((item, i) => (
            <Reveal key={item.q} delay={i * 50}>
              <Item
                item={item}
                open={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
