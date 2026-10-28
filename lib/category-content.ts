import type { Category } from "./tools";
import type { BlogFaq } from "./blog";

export interface CategoryContent {
  /** 2-3 paragraphs: what the category covers, who it is for, when to use which tool. */
  intro: string[];
  /** 3-4 frequently asked questions with answers. */
  faqs: BlogFaq[];
}

export const categoryContent: Record<Category, CategoryContent> = {
  pdf: {
    intro: [
      "The PDF shelf covers the whole life of a document: converting it into and out of Word, Excel, and PowerPoint, combining or splitting pages, shrinking file size, and finishing touches like rotating, signing, watermarking, and password protection. Most of these tools run in your browser, so a contract, assignment, or report never has to be uploaded to convert or reorganise it.",
      "Start from the job, not the tool name. Merging and splitting change page structure; compressing shrinks size for email or upload limits; converters change format for editing or sharing. If a document needs both — say, merging several scans and then shrinking the result — do the structural step first and compress last, so you only compress once.",
      "A few honest limits are worth knowing before you start. PDF to Word in exact mode embeds pages as images, which preserves the layout faithfully but means that page content is not editable text. Word to PDF in browser mode renders pages as images for the same reason. For scanned or image-only PDFs, run OCR first so the text becomes searchable before you convert or edit.",
    ],
    faqs: [
      {
        q: "Which PDF tool should I use first for a document I need to edit?",
        a: "If the document is a PDF and you need to change its wording, start with PDF to Word. If it is a scan with no selectable text, run OCR PDF first so the text is recognised, then convert. If you only need to reorder, remove, or rotate pages, use the page tools directly — no conversion is needed.",
      },
      {
        q: "Do PDF tools here upload my documents?",
        a: "Most PDF tools run in your browser, so the file stays on your device during the operation. Tools that offer a server option say so on the tool page; choosing that option uploads the document to complete the conversion.",
      },
      {
        q: "Why does my converted Word document show pages as images?",
        a: "That is the exact conversion mode, which preserves the original layout by embedding each page as an image. It keeps the appearance faithful, but text inside an embedded page image is not directly editable — add or replace text around it, or use a different mode when editable text matters more than pixel-perfect layout.",
      },
      {
        q: "How do I make a PDF small enough to email?",
        a: "Use Compress PDF after any merging or page edits, and check the result before sending. If the file is still too large, consider splitting it into parts with Split PDF, or converting colour pages to JPG at a lower size only when image quality is not critical.",
      },
    ],
  },
  image: {
    intro: [
      "The image shelf handles everyday picture jobs: compressing, resizing, cropping, rotating, converting between JPG, PNG, WebP, HEIC, and SVG, and preparing images for documents with Image to PDF. It is built for sellers listing products, students submitting photos, and anyone whose uploads keep hitting a size or format limit.",
      "Pick the tool by what the receiving site actually requires. Compression and resizing fix size problems; format converters fix compatibility problems, such as an iPhone HEIC photo a form will not accept; cropping and rotation fix framing. Doing these in the wrong order wastes quality, so crop and rotate first, then resize, then compress last.",
      "Know the trade-offs before you convert. The image compressor always outputs JPEG, so PNG transparency is lost — keep the original if you need a transparent background. The background remover works by chroma-key, which suits solid-colour backdrops rather than busy photos. The upscaler resizes on canvas and sharpens, which improves presentation but cannot recover detail that was never in the original.",
    ],
    faqs: [
      {
        q: "Will compressing my image lose its transparent background?",
        a: "Yes, if you use the image compressor: it always outputs JPEG, and JPEG has no transparency, so transparent areas become a solid background. Keep your original PNG if transparency matters, and use format conversion instead when you only need a different file type.",
      },
      {
        q: "What kind of photo works best with the background remover?",
        a: "Photos against a fairly solid, even-coloured backdrop work best, because the remover is chroma-key based: it keys out a chosen colour range. Busy, multicoloured backgrounds and fine edges like hair will not separate cleanly, and that is a limit of the technique, not a fault in your photo.",
      },
      {
        q: "Can the upscaler make a blurry photo sharp?",
        a: "No. The upscaler enlarges the image on canvas and applies sharpening, which can make a small image present better at a larger size, but it cannot invent detail that was not captured. A very low-resolution original will still look soft when enlarged.",
      },
      {
        q: "What does the screenshot tool actually do?",
        a: "It annotates images you upload — you can mark up a picture you already have. It does not capture your screen, so take the screenshot with your device first, then upload it here to annotate.",
      },
    ],
  },
  ai: {
    intro: [
      "The AI shelf is a writing desk: drafting and rewriting with the AI writer and article rewriter, condensing long text with the summarizer, translating, fixing grammar and spelling, and checking work with the AI detector and plagiarism checker. It suits students polishing essays, jobseekers drafting emails, and anyone facing a blank page or a dense document.",
      "Use each tool for one clear step. Draft first, then rewrite or paraphrase for tone, then run the grammar and spell checkers for a final pass. Detection and originality checks belong at the end of that chain, not the start: they are most useful once the text is already in its near-final form, so you are checking what you will actually submit.",
      "Two limits shape everything here. AI tools produce no output without a configured provider, so if a tool returns nothing, the provider setup — not your text — is the first thing to check. And the plagiarism checker shows simulated results when no Copyleaks connection is configured, so never treat a simulated score as a real originality check for academic or professional submission.",
    ],
    faqs: [
      {
        q: "Why does an AI tool return no output?",
        a: "AI tools here need a configured provider to generate anything. Without one, there is nothing to produce a response, so check the provider configuration first before retrying or rewriting your prompt.",
      },
      {
        q: "Can I trust the plagiarism checker score for a submission?",
        a: "Only when it comes from a real configured check. Without a Copyleaks connection, the checker shows simulated results, which are for demonstration only and must never be presented as a real originality check.",
      },
      {
        q: "What is the difference between the AI detector and the plagiarism checker?",
        a: "The detector estimates whether text looks machine-generated; the plagiarism checker looks for matching existing sources. They answer different questions, so a passage can pass one and fail the other, and neither result is a verdict on its own.",
      },
      {
        q: "Should I rewrite with AI and then submit as my own work?",
        a: "That depends on the rules of whoever receives it. Schools, publishers, and employers differ on AI assistance, so check their policy first. As a habit, use these tools to draft, clarify, and polish, and keep your own judgement — and your own words — in the final version.",
      },
    ],
  },
  text: {
    intro: [
      "The text shelf is for shaping plain text: counting words and characters, converting case, cleaning stray spaces and duplicate lines, sorting lines, and generating placeholder or random text. It is the quiet toolkit behind essays that must hit a word limit, data pasted from spreadsheets, and drafts copied out of PDFs with messy line breaks.",
      "The right order is clean, then shape, then count. Remove extra spaces and duplicate lines before sorting, convert case before counting, and run the word counter last, once the text is in its final form. Counting first and editing after is the usual reason a submission lands just over or under a limit.",
      "These are also the fastest tools in the workshop: everything runs on text you paste, with no file upload and no waiting. That makes them ideal for quick checks in the middle of other work — a word count before submitting, a case conversion before pasting into a form, a sort before comparing two lists.",
    ],
    faqs: [
      {
        q: "What is the difference between the word counter and the character counter?",
        a: "The word counter counts words, which is what essays, applications, and articles usually limit. The character counter counts characters, including or excluding spaces depending on the tool's display, which matters for social posts, meta descriptions, and form fields with character caps. Check which limit your destination actually enforces.",
      },
      {
        q: "Why does pasted text have extra spaces and broken lines?",
        a: "Copying from PDFs, web pages, and spreadsheets often brings hidden line breaks and double spaces with it. The text cleaner and remove-extra-spaces tools strip those artefacts, and remove-duplicate-lines drops repeated rows, so the text behaves like normal typed text again.",
      },
      {
        q: "When would I use the text sorter?",
        a: "Whenever order matters for comparison: sorting two lists the same way makes duplicates and missing entries obvious. It is also useful for alphabetising names, references, or options before publishing them.",
      },
      {
        q: "Is lorem ipsum still useful for mockups?",
        a: "Yes, when you need to judge layout without finished copy distracting reviewers. Use it for wireframes and templates, then replace it with real text before any public release — placeholder text that ships is a common, avoidable embarrassment.",
      },
    ],
  },
  developer: {
    intro: [
      "The developer shelf covers data wrangling: formatting and validating JSON, XML, HTML, and SQL, minifying CSS and JavaScript, encoding and decoding Base64 and URLs, generating hashes and UUIDs, and decoding JWTs. It is for developers debugging an API response, students learning data formats, and anyone handed a wall of minified code.",
      "A good habit is validate, then format, then transform. A validator tells you whether the data is even parseable; a formatter makes it readable; only then do minification, encoding, or hashing make sense. Formatting a broken payload first just produces nicely indented broken data.",
      "Two tools deserve a caution. Hash generators like MD5 and SHA-256 are one-way fingerprints for checking integrity, not encryption — you cannot recover the original from a hash. And the JWT decoder reads the token's payload without verifying its signature, so it is for inspection during development, not for deciding whether a token should be trusted.",
    ],
    faqs: [
      {
        q: "Should I format or validate JSON first?",
        a: "Validate first. The validator reports syntax errors and their position; the formatter then makes valid JSON readable. If validation fails, fix the reported error before formatting, or you will just reformat the same broken structure.",
      },
      {
        q: "What is the difference between the JSON formatter and the JSON minifier?",
        a: "The formatter expands JSON with indentation for humans to read and debug. The minifier does the opposite, stripping whitespace for the smallest payload to send or store. Use the formatter while working and the minifier when shipping.",
      },
      {
        q: "Is a hash the same as encryption?",
        a: "No. A hash is a one-way fingerprint: the same input always gives the same hash, but the hash cannot be reversed to recover the input. Encryption is reversible with the right key. Use hashes to verify that data has not changed, not to protect secrets.",
      },
      {
        q: "Does decoding a JWT prove it is valid?",
        a: "No. Decoding only reads the payload; it does not verify the signature or expiry. A decoded token can still be forged or expired, so never accept a token as trustworthy on the basis of decoding alone.",
      },
    ],
  },
  seo: {
    intro: [
      "The SEO shelf helps a page be found and look right when it is shared: generating meta tags, Open Graph tags, canonical tags, robots.txt, sitemaps, and schema markup, plus previews for search results and checks for keyword density, broken links, and page speed. It suits site owners, bloggers, and small teams without a dedicated SEO tool.",
      "Work in the order search engines encounter a page: crawlability first, then presentation. A correct robots.txt and sitemap decide whether pages can be found at all; canonical tags settle which version of a page counts; meta and Open Graph tags then decide how the page reads in results and social shares. Polishing a title before fixing crawl problems is effort spent in the wrong place.",
      "Treat the checkers as guides, not grades. Keyword density has no ideal percentage that guarantees ranking, a speed test reflects one moment on one connection, and a broken-link check only covers the links it can reach. Use them to catch concrete mistakes — a missing tag, a dead link, a slow page — rather than chasing a single number.",
    ],
    faqs: [
      {
        q: "Which SEO tool should a new page start with?",
        a: "Start with the meta tag generator and the canonical tag generator, so the page has a title, description, and a single canonical URL. Then add Open Graph tags for sharing and schema markup for rich results, and finish with the SERP preview to see how the result will actually look.",
      },
      {
        q: "What is a canonical tag for?",
        a: "It tells search engines which URL is the main version of a page when similar or duplicate versions exist — for example with tracking parameters or http/https variants. Without one, ranking signals can split across duplicates.",
      },
      {
        q: "Does keyword density affect ranking?",
        a: "Not as a target number. Stuffing a keyword into a page reads badly and helps nobody. Write naturally for the topic, then use the density checker to spot accidental overuse or a missing core term, not to hit a percentage.",
      },
      {
        q: "Why does the speed test result change between runs?",
        a: "Speed depends on network conditions, server load, and what else is running, so results vary run to run. Look for consistent problems — large images, slow responses — rather than treating one fast or slow reading as the truth.",
      },
    ],
  },
  security: {
    intro: [
      "The security shelf is practical defence: generating strong passwords, testing password strength, validating email addresses, and inspecting domains through DNS, WHOIS, IP, and SSL checks. It is for anyone setting up an account, registering a domain, or wondering why a site shows a browser warning.",
      "Use the generators when creating credentials and the lookup tools when investigating. A password generator plus a strength check covers the account side; DNS, WHOIS, and SSL checks cover the domain side, answering who owns a domain, where it points, and whether its certificate is valid. Mixing those jobs up — testing a password's strength to judge a website, for example — answers the wrong question.",
      "One boundary matters: these lookups report public information about domains and certificates. They do not test whether a site is safe to trust with payment or personal data, and a valid certificate alone never proves a site is legitimate. Phishing sites can hold valid certificates too.",
    ],
    faqs: [
      {
        q: "What makes a generated password strong?",
        a: "Length and unpredictability. A long password made of random characters from several character sets is far harder to guess or brute-force than a short familiar word, even with symbols added. Use the generator rather than inventing a pattern, and store the result in a password manager.",
      },
      {
        q: "Does a valid SSL certificate mean a site is safe?",
        a: "No. A certificate only proves the connection to that domain is encrypted and the certificate is currently valid. It says nothing about who runs the site or whether it is honest, so check the domain itself and the site's reputation before entering sensitive information.",
      },
      {
        q: "What can a WHOIS lookup tell me?",
        a: "Public registration details for a domain, such as its registrar and registration and expiry dates, where that information is not privacy-protected. It is useful for checking a domain's age and ownership history before buying or trusting it.",
      },
      {
        q: "Why would I check DNS records?",
        a: "DNS records decide where a domain's mail and web traffic go. Checking them helps diagnose why email is not arriving, why a site is not loading after a move, or whether a domain is pointed at the service you expect.",
      },
    ],
  },
  converters: {
    intro: [
      "The converters shelf translates values between systems: currency, length, weight, area, temperature, time zones, data storage, binary, and Roman numerals. It is for travellers, students, cooks, traders, and anyone whose source and destination simply do not speak the same units.",
      "Accuracy depends on knowing what kind of conversion you are doing. Unit conversions like length and weight are fixed maths and exact. Currency conversion depends on exchange rates, which move during the day, so treat a converted amount as an estimate for budgeting and check a live rate before paying or sending money.",
      "Time zone and date conversions deserve extra care around daylight saving changes, which shift offsets during the year. A time that converts cleanly in January can be an hour off in July, so for meetings and deadlines, confirm the converted time with the other party rather than trusting a single conversion.",
    ],
    faqs: [
      {
        q: "Is the currency converter rate exact?",
        a: "No. Exchange rates move constantly, so any conversion is an estimate at the moment you run it. Use it for budgeting and comparison, and confirm the live rate with your bank or payment provider before a real transaction.",
      },
      {
        q: "Why do temperature conversions need a formula, not a ratio?",
        a: "Because Celsius and Fahrenheit start at different zero points. Converting is not a simple multiplication — the offset has to be applied as well — which is why a converter beats mental arithmetic here.",
      },
      {
        q: "Can I trust a time zone conversion for a meeting?",
        a: "Mostly, but daylight saving changes offsets during the year, so a conversion that is right in one month can be wrong in another. For important meetings, send the time in both zones or as a calendar invite and confirm with the other attendees.",
      },
      {
        q: "What is the data storage converter for?",
        a: "Translating between bytes, kilobytes, megabytes, gigabytes, and terabytes — useful when a file size, a hosting quota, and a download limit are each quoted in different units and you need to compare them directly.",
      },
    ],
  },
  calculators: {
    intro: [
      "The calculators shelf turns money and life questions into numbers: loans, mortgages, and EMI repayments, discounts, VAT and GST, margins, profit, ROI, percentages, plus age, BMI, dates, tips, and a scientific calculator. It is for borrowers comparing offers, sellers pricing products, and households checking everyday figures.",
      "For borrowing, compare like with like. Loan, mortgage, and EMI calculators answer slightly different questions — total cost versus monthly payment versus the effect of an extra payment — so run the same figures through each and compare the totals, not just the monthly number. A lower monthly payment that stretches years longer usually costs more overall.",
      "Every result here is an estimate from the numbers you enter, not an offer. Real loans add fees, insurance, variable rates, and eligibility conditions that a calculator cannot know, so use these figures to shortlist options and ask lenders for the full terms before committing.",
    ],
    faqs: [
      {
        q: "What is the difference between the loan, mortgage, and EMI calculators?",
        a: "The loan calculator covers general borrowing and total repayment cost; the mortgage calculator is tuned for home loans, including longer terms and property-related figures; the EMI calculator focuses on the equated monthly instalment itself. Use all three on the same numbers when comparing a home purchase, and compare total interest, not just the monthly figure.",
      },
      {
        q: "Are the results a loan offer?",
        a: "No. Results are estimates based only on the principal, rate, and term you enter. Fees, insurance, credit checks, and variable rates all change the real cost, so treat the output as a comparison aid and confirm terms with the lender.",
      },
      {
        q: "Why does a small rate change move the total so much?",
        a: "Because interest compounds over the whole term. On a long loan, even a fraction of a percent applies to a large balance for many years, which is why comparing total interest paid matters more than comparing the monthly payment alone.",
      },
      {
        q: "What does the BMI calculator actually measure?",
        a: "It divides weight by height squared to give a rough weight category. It does not measure body fat, muscle, or health on its own, so treat it as a screening number to discuss with a clinician, not a diagnosis.",
      },
    ],
  },
  utilities: {
    intro: [
      "The utilities shelf holds the everyday instruments: QR and barcode generators, colour pickers and converters, a notepad and todo list, timers and a stopwatch, timestamp and Unix time converters, random number and password generators, coin flips, and dice rolls. It is the drawer you open when a small task interrupts real work and just needs doing.",
      "The generators here split into two kinds. QR codes, barcodes, colours, and timestamps produce outputs you will reuse — a code on a flyer, a colour in a design, a date in a log — so double-check the output before printing or publishing it. Coin flips, dice rolls, and random numbers are for the moment itself: decisions, games, and draws where the result matters once and then is gone.",
      "Note the overlap with other shelves, which is deliberate. The utilities password generator and the security shelf's generator both make passwords; the utilities UUID generator mirrors the developer one. Use whichever you reach first — the output is the same kind of value — and keep passwords in a manager either way.",
    ],
    faqs: [
      {
        q: "Do QR codes generated here expire?",
        a: "The code itself does not expire; it encodes whatever text or link you gave it. If that link later breaks or the page moves, the code still scans but leads nowhere useful, so test every printed code before distributing it.",
      },
      {
        q: "What is the difference between the QR code and barcode generators?",
        a: "QR codes store more data — links, text, contact details — and are scanned by phone cameras. Barcodes store short product-style numbers and are scanned by retail scanners. Choose QR for linking people to something, barcode for labelling items.",
      },
      {
        q: "How do I convert a Unix timestamp?",
        a: "Paste the timestamp into the Unix time converter to read it as a normal date and time, or use the timestamp converter for named date formats. Check whether your timestamp is in seconds or milliseconds — mixing those up shifts the date by decades.",
      },
      {
        q: "Are the random number and dice tools fair?",
        a: "They are fine for games, draws, and everyday decisions. They are not a substitute for audited randomness where money, security, or legal outcomes depend on the result — for those, use a system designed and certified for that purpose.",
      },
    ],
  },
};
