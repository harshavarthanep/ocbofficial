/* ==========================================================================
   OCB STORE SETTINGS · version 4
   --------------------------------------------------------------------------
   This is the only file you need to edit to run the store.
   Change a value, save, upload to GitHub, refresh the site.

   Three rules so nothing breaks:
     1. Keep text inside "quotes".
     2. Keep the comma at the end of each line.
     3. Numbers (prices, quantities) have no quotes and no currency sign.

   Anything left as "" (empty quotes) simply stays hidden on the website.
   Lines marked  <-- CHANGE  are placeholders I could not know. Replace them.
   ========================================================================== */

window.OCB_CONFIG = {

  /* ---------- 1. BRAND ---------------------------------------------------- */
  brand: {
    name: "OCB",
    fullName: "Original Clothing Brand",
    siteUrl: "https://ocbofficial.com",
    email: "info@ocbofficial.com",
    instagram: "ocb_official",          // without the @
    whatsapp: "918524861804",           // country code + number, digits only, no + or spaces. "" hides WhatsApp everywhere
    legalName: "OCB (Original Clothing Brand)",   // business name shown on the Contact page
    address: "No. 12, Sample Street, T. Nagar, Chennai, Tamil Nadu 600017, India",   // <-- CHANGE  this is a DUMMY address
    showAddress: true                   // false = hide the address (online-only business). Razorpay usually asks for one while approving you.
  },

  /* ---------- 2. THIN STRIP AT THE VERY TOP ------------------------------- */
  /* One or more short messages, shown together. Use [] to hide the strip.   */
  announcement: [
    "Drop 001 · The Unseen is live",
    "Free shipping across the USA"      // <-- CHANGE if shipping is not free
  ],

  /* ---------- 3. MONEY ---------------------------------------------------- */
  currency: {
    code: "USD",                        // "USD" or "INR" (Razorpay must have this currency enabled)
    symbol: "$",                        // "$" or "₹"
    locale: "en-US",                    // "en-US" writes 100,000. "en-IN" writes 1,00,000
    taxNote: ""                         // small text beside prices, e.g. "Taxes included". "" hides it
  },
  shipping: {
    flatRate: 0,                        // shipping charge per order. 0 = free shipping
    freeAbove: 0,                       // order value where shipping becomes free. 0 = not used
    note: "Dispatch within 5 business days",                            // short line on product pages  <-- CONFIRM the real time
    detail: "Orders are prepared for dispatch within 5 business days.",  // first sentence of the product page "Shipping and returns" panel
    countries: ["United States"]        // where you deliver. Add more, e.g. ["United States", "Canada", "India"]
  },

  /* ---------- 4. PRODUCTS -------------------------------------------------
     To add a product: copy one whole block from { to }, paste it after the
     last one (with a comma between blocks) and change the values.
     To add photos: upload them to  images/products/  and add their paths to
     "images". The first image is the main one. Best shape is 4:5 portrait
     (for example 1500 x 1875 px), under 400 KB each.
     theme: "light" gives the product a cream page, "dark" gives it a black page.
     ----------------------------------------------------------------------- */
  products: [
    {
      id: "the-other-side",             // used in the link. lowercase, no spaces. Never change after launch.
      code: "OCB 001",                  // small product number shown above the name
      status: "In stock",               // shown beside the code. Becomes "Sold out" by itself when every size is sold out
      name: "The Other Side",
      colour: "Off-white",
      theme: "light",
      badge: "Drop 001",
      price: 35,                        // <-- CHANGE  price in dollars
      compareAt: 0,                     // old price shown struck through. 0 = hidden
      tagline: "You know one side. But not the other.",
      description: "Two faces. One identity. THE OTHER SIDE explores the space between what the world sees and what remains unseen. The artwork sits on the back — a reminder that there is always more beneath the surface.",
      sizes: ["S", "M", "L", "XL", "XXL"],
      soldOutSizes: [],                 // e.g. ["S", "XXL"]
      background: "#BEBAB1",            // colour behind the photo. Match your photo's backdrop.
      images: [
        "images/products/the-other-side-1.jpg",
        "images/products/the-other-side-2.jpg",
        "images/products/the-other-side-3.jpg"
      ],
      details: [                        // edit, add or remove lines freely  <-- CONFIRM 300 GSM and the fit with the manufacturer
        "100% cotton",
        "300 GSM heavyweight fabric",
        "Oversized drop-shoulder fit",
        "Back graphic print"
      ],
      care: [
        "Machine wash cold, inside out.",
        "Wash with similar colours, where appropriate.",
        "Do not iron directly on the print.",
        "Dry in shade."
      ]
    },
    {
      id: "inner-noise",
      code: "OCB 002",
      status: "In stock",
      name: "Inner Noise",
      colour: "Black",
      theme: "dark",
      badge: "Drop 001",
      price: 35,                        // <-- CHANGE  price in dollars
      compareAt: 0,
      tagline: "Quiet outside / chaos within.",
      description: "A fractured portrait shaped by the thoughts that rarely stay quiet. Overthinking, anxieties, expectations and memories — mapped across the artwork. Minimal from the front. The noise remains on the back.",
      sizes: ["S", "M", "L", "XL", "XXL"],
      soldOutSizes: [],
      background: "#484846",
      images: [
        "images/products/inner-noise-1.jpg",
        "images/products/inner-noise-2.jpg",
        "images/products/inner-noise-3.jpg"
      ],
      details: [                        // edit, add or remove lines freely  <-- CONFIRM 300 GSM and the fit with the manufacturer
        "100% cotton",
        "300 GSM heavyweight fabric",
        "Oversized drop-shoulder fit",
        "Back graphic print"
      ],
      care: [
        "Machine wash cold, inside out.",
        "Wash with similar colours, where appropriate.",
        "Do not iron directly on the print.",
        "Dry in shade."
      ]
    }
  ],

  /* ---------- 5. SIZE GUIDE ----------------------------------------------- */
  /* Standard unisex tee measurements. Replace with your own when you have them. */
  sizeGuide: {
    note: "Garment measured flat, in inches. Between sizes? Take the larger one.",
    columns: ["Size", "Chest", "Length", "Shoulder"],
    rows: [
      ["S",   "36", "28", "17"],
      ["M",   "40", "29", "18.5"],
      ["L",   "44", "30", "20"],
      ["XL",  "48", "31", "21.5"],
      ["XXL", "52", "32", "23"]
    ]
  },

  /* ---------- 6. HOME PAGE TEXT -------------------------------------------
     The home page, top to bottom. Every block is optional: delete a block
     (or leave its title "") and that section simply disappears.
     ----------------------------------------------------------------------- */

  /* 1 · The opening: photos fade one into the next behind the big OCB mark.
     Add, remove or reorder slides. "focus" is the part of the photo kept in view
     on narrow screens: "left", "center", "right" or two percentages like "62% 40%". */
  opening: {
    eyebrow: "Original Clothing Brand",
    tagline: "Silent expression.",
    button: "Shop the drop",
    link: "#/shop",
    seconds: 6,                         // how long each photo stays
    slides: [
      { image: "images/home/man-light.jpg",       focus: "64% 30%" },
      { image: "images/home/concrete-light.jpg",  focus: "40% 50%" },
      { image: "images/home/column-shadow.jpg",   focus: "52% 50%" },
      { image: "images/home/concrete-corner.jpg", focus: "70% 40%" }
    ]
  },

  /* 2 · The brand: picture on the left, words on the right */
  story: {
    label: "The brand",
    title: ["A space for", "the unexpressed."],
    text: "Contemporary streetwear for individuals who feel more, think deeper and express differently.",
    linkText: "Our philosophy",
    link: "#/about",
    image: "images/home/architecture.jpg"
  },

  /* 3 · Three short pillars. icon: "minimal", "expressive" or "timeless" */
  pillars: [
    { icon: "minimal",    title: "Minimal",    text: "Purposeful. Not loud." },
    { icon: "expressive", title: "Expressive", text: "Emotion in form." },
    { icon: "timeless",   title: "Timeless",   text: "Beyond trends." }
  ],

  /* 4 · The drop: product picture with the design switcher, and the launch copy */
  hero: {
    label: "Drop 001 · The Unseen is live",
    lines: ["Not everything", "needs to be said."],   // the headline, one line each
    sub: "Two designs. Two perspectives. One philosophy. Discover THE UNSEEN — OCB's first collection.",
    spec: "300 GSM heavyweight · 100% cotton · Oversized drop-shoulder fit",   // <-- CONFIRM with the manufacturer
    button: "Explore the collection",
    lookLink: "Discover the lookbook",
    note: "Free shipping across the USA · Secure checkout",   // "" hides it
    blackAndWhite: true
  },

  /* 5 · The collection banner */
  collection: {
    label: "The collection · The Unseen",
    title: "First drop",
    text: "A study in contrast.",
    button: "Explore collection",
    link: "#/shop",
    image: "images/home/first-drop.jpg",
    focus: "62% 30%"
  },

  /* The moving line of words above the products */
  marquee: ["Silent expression", "The Unseen", "Two designs", "Two perspectives", "OCB"],

  /* 6 · The products */
  sides: {
    label: "The Unseen · Drop 001",
    title: "Two designs. Two perspectives.",
    intro: "Two expressions of what exists beneath the surface. INNER NOISE explores the chaos within. THE OTHER SIDE reveals the identity beyond appearances."
  },

  /* The Shop page heading */
  shop: {
    eyebrow: "The Unseen · Drop 001",
    title: "Two designs. Two perspectives.",
    intro: "Two expressions of what exists beneath the surface. INNER NOISE explores the chaos within. THE OTHER SIDE reveals the identity beyond appearances."
  },

  /* 7 · Lookbook. The home page shows the first two photos; the Lookbook page shows them all,
     followed by your product photos. "product" links a photo to a product id. */
  lookbook: {
    label: "Lookbook",
    title: "Beyond the frame.",
    intro: "A closer look at THE UNSEEN — two designs shaped by what exists beneath the surface.",
    link: "Explore the lookbook",
    items: [
      { image: "images/home/man-portrait.jpg",    caption: "Look 01 / Light" },
      { image: "images/home/concrete-angles.jpg", caption: "Look 02 / Form" },
      { image: "images/home/first-drop-wide.jpg", caption: "Look 03 / Contrast", product: "the-other-side" },
      { image: "images/home/concrete-light.jpg",  caption: "Look 04 / Shadow" },
      { image: "images/home/architecture.jpg",    caption: "Look 05 / Structure" }
    ]
  },

  /* 8 · The stories behind the designs. Add, remove or reorder freely. */
  details: {
    label: "",
    title: "The stories behind the designs.",
    items: [
      { image: "images/products/the-other-side-3.jpg", product: "the-other-side",
        title: "The Other Side", text: "Two profiles meet in one composition. A reflection of the difference between the identity people see and the one they never fully know." },
      { image: "images/products/inner-noise-3.jpg", product: "inner-noise",
        title: "Inner Noise", text: "A fractured portrait surrounded by fragments of thought. A visual expression of overthinking, anxieties, expectations and memories." },
      { image: "images/products/the-other-side-2.jpg", product: "the-other-side",
        title: "The expression, in every detail", text: "The back carries the artwork. The front keeps the branding restrained. Made from 100% cotton." }
    ]
  },

  /* 9 · Our philosophy. The full text lives on the About page. */
  note: {
    label: "Our philosophy",
    title: "Clothing that gives form to the unseen.",
    text: "Some things are expressed without words. Others remain beneath the surface. OCB turns those unseen thoughts and perspectives into visual expression.",
    link: "Discover the OCB philosophy"
  },

  /* Footer */
  footer: {
    brand: "OCB · Original Clothing Brand",
    line: "Silent expression.",
    collection: "The Unseen"            // adds a "The Unseen" link to the footer Shop list. "" hides it
  },

  /* The About page */
  philosophy: {
    title: ["Silent", "Expression"],
    paragraphs: [
      "Not everything needs to be explained.",
      "What you wear can speak without a word. What remains unseen can say just as much.",
      "OCB is for those who value presence over attention. For those who express themselves without needing to explain who they are.",
      "We create clothing for the thoughts, perspectives and expressions that exist beneath the surface."
    ]
  },

  /* Four short facts at the bottom of the Shop page. <-- CHANGE to match your real policies. */
  promises: [
    { title: "Shipping", link: "#/policy/shipping", text: "Free US shipping on eligible orders. Orders are prepared for dispatch within 5 business days." },
    { title: "Returns",  link: "#/policy/returns",  text: "Need a different size? Review our Returns & Exchanges Policy for eligibility and instructions." },
    { title: "Payment",  text: "Pay securely at checkout using the payment methods shown at checkout." },
    { title: "Support",  link: "#/contact",         text: "Need help? Contact us by email or WhatsApp. We're here to help." }
  ],

  about: {
    paragraphs: [
      "OCB began with a simple belief: expression doesn't always need words. Clothing can carry meaning without explaining everything.",
      "Every OCB piece begins with an idea. We translate thoughts, identity and perspective into considered design — shaped by restraint, detail and intention.",
      "No unnecessary noise. No borrowed identity. Just original expression.",
      "Clothing with meaning beyond the surface. This is THE UNSEEN — the first expression of OCB."
    ],
    button: "Explore the Unseen"
  },

  /* Questions and answers. <-- CHANGE the answers to your real terms. */
  faq: [
    { q: "How long does delivery take?",
      a: "Orders are prepared for dispatch within 5 business days. Delivery time after that depends on your location and the carrier. You get the tracking link on WhatsApp or email as soon as it ships." },
    { q: "Can I return or exchange?",
      a: "Yes. Unworn, unwashed pieces with tags can be exchanged or returned within 14 days of delivery. Message us with your order reference and we will arrange it." },
    { q: "How do I pick my size?",
      a: "Open the size guide on any product page and compare it with a tee you already own. The fit is oversized with a dropped shoulder, so take your usual size for that look." },
    { q: "How do I pay?",
      a: "Pay securely at checkout using the payment methods shown there. You can also send your order on WhatsApp and pay through the link we share." },
    { q: "Do I need an account?",
      a: "No. You can check out as a guest. An account simply saves your addresses and keeps your order history in one place." }
  ],

  newsletter: {
    eyebrow: "Join OCB",
    title: "Stay in the expression.",
    sub: "Be first to hear about new releases, collection stories and what comes next from OCB. No unnecessary noise.",
    placeholder: "Enter your email address",
    consent: "By signing up you agree to receive emails from OCB. Unsubscribe any time.",
    /* Your existing Google Apps Script link that saves emails to your Sheet. "" hides the form. */
    endpoint: "https://script.google.com/macros/s/AKfycbxatZWjO3nD2ymn-aOhuKgQpsnm7Rgkvz1PsM3m73omiWGZVFn3hmBa4MFz-xoD1xCztQ/exec"
  },

  /* ---------- 7. PAYMENTS -------------------------------------------------
     WhatsApp ordering turns on by itself once brand.whatsapp (section 1) has
     a number. Card payments and Razorpay each turn on once their lines below
     are filled. Use one, both or neither: checkout lines up whatever is on.
     See the setup guide, part "Razorpay".
     ----------------------------------------------------------------------- */
  /* Pay by card: Stripe's secure card fields on the checkout page. Shows once BOTH lines are filled.
     See the setup guide, part "Card payments". */
  card: {
    publishableKey: "",                 // starts with pk_live_ (or pk_test_ while testing). Never put the SECRET key (sk_...) here.
    workerUrl: ""                       // "" = use the same Worker link as Razorpay below
  },

  razorpay: {
    keyId: "",                          // starts with rzp_live_ (or rzp_test_ while testing). Never put the Key SECRET here.
    workerUrl: ""                       // your Cloudflare Worker link, e.g. "https://ocb-pay.yourname.workers.dev"
  },

  /* ---------- 8. ACCOUNTS (Firebase) --------------------------------------
     Paste the values Firebase gives you. While apiKey is "" the account
     button and sign-in are hidden and the shop still works for guests.
     These Firebase values are safe to be public. They are identifiers, not passwords.
     ----------------------------------------------------------------------- */
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  },
  signIn: {
    emailLink: false,                   // one-tap link sent to the inbox, no password. Free plan allows only 5 a day, so keep false until you upgrade Firebase to Blaze.
    google: true,                       // "Continue with Google"
    emailPassword: true                 // classic email + password
  },

  /* ---------- 9. "ADD TO HOME SCREEN" POP-UP ------------------------------ */
  installPrompt: {
    enabled: true,
    delaySeconds: 25,                   // how long a visitor browses before it appears
    remindAfterDays: 14                 // if they close it, wait this many days before showing again
  },

  /* ---------- 10. POLICIES ------------------------------------------------
     Razorpay checks that these pages exist before approving your account.
     <-- CHANGE: read every line and make it true for your business.
     ----------------------------------------------------------------------- */
  policies: {
    shipping: {
      title: "Shipping policy",
      updated: "November 2026",
      body: [
        "We deliver to addresses in the United States. Orders are prepared for dispatch within 5 business days of payment.",
        "Once your order ships we send the tracking details to the phone number or email you gave at checkout. Delivery time after dispatch depends on your location and the carrier.",
        "Shipping charges, if any, are shown at checkout before you pay. Any customs duties or import taxes charged at delivery are the responsibility of the recipient.",
        "Please check your address carefully. If a parcel comes back to us because the address was wrong or delivery was refused, we will contact you to arrange delivery again and a re-shipping charge may apply.",
        "If your tracking has not moved for 10 days, or the parcel is marked delivered and you do not have it, contact us and we will work with the carrier to resolve it."
      ]
    },
    returns: {
      title: "Returns & exchanges",
      updated: "November 2026",
      body: [
        "You can return or exchange an item within 14 days of delivery if it is unworn, unwashed and has its original tags and packaging.",
        "To start a return, message us on WhatsApp or email with your order reference and the reason. We will reply with the return steps. Please do not send items back before contacting us.",
        "If your item arrived damaged, faulty or different from what you ordered, tell us within 7 days of delivery with a photo. We will replace it or refund you in full, including shipping, at no cost to you.",
        "For other returns the cost of return shipping is paid by the customer, and original shipping charges are not refunded.",
        "Approved refunds are issued to the original payment method within 5 to 10 business days after we receive and inspect the item. Your bank may take a few more days to show it.",
        "You can cancel an order for a full refund any time before it is dispatched."
      ]
    },
    privacy: {
      title: "Privacy",
      updated: "November 2026",
      body: [
        "This policy explains what information OCB (Original Clothing Brand) collects when you use this website and how we use it.",
        "What we collect: your name, phone number, email address and delivery address when you place an order or create an account, and your email address if you join our mailing list.",
        "How we use it: to process, deliver and support your order, to answer your questions, and, only if you signed up, to tell you about new releases. You can unsubscribe at any time.",
        "Accounts: sign-in is handled by Google Firebase. Your saved addresses and order history are stored there so you can use them again. Your cart and, if you choose, your address are also kept in your own browser.",
        "Payments: online payments are processed by Razorpay. We never see or store your card or bank details.",
        "Sharing: we do not sell or rent your information. We share it only with the service providers needed to run the store, such as the payment processor and the delivery carrier, or when the law requires it.",
        "Your choices: you can ask to see, correct or delete your information at any time by emailing us, and we will respond within 30 days.",
        "This website is not intended for children under 13 and we do not knowingly collect their information. We may update this policy and will post the new date at the top of this page."
      ]
    },
    terms: {
      title: "Terms of service",
      updated: "November 2026",
      body: [
        "This website is operated by OCB (Original Clothing Brand). By using the site or placing an order you agree to these terms.",
        "Products and prices: prices are shown in US dollars. We may change prices or withdraw products at any time, but never for an order you have already paid for. We try to show colors and prints accurately; small differences between screens and the real garment are normal.",
        "Orders: an order is confirmed once payment is received. We may refuse or cancel an order, for example if an item is unavailable or a price was listed in error, and we will refund you in full if we do.",
        "Accounts: you are responsible for keeping your sign-in details private and for activity on your account.",
        "Intellectual property: all designs, artwork, photographs, logos and text on this site belong to OCB and may not be copied or used without written permission.",
        "Liability: to the extent permitted by law, our liability for any claim relating to an order is limited to the amount you paid for that order.",
        "Changes and contact: we may update these terms and the current version is always on this page. Questions can be sent through the Contact page."
      ]
    }
  }

};
